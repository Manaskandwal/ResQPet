package com.vetscue.api.controller;

import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.security.UserPrincipal;
import com.vetscue.api.service.AmbulanceDispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AmbulanceDispatchService ambulanceDispatchService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/list")
    public ResponseEntity<?> listHospitals() {
        List<User> hospitals = userRepository.findByRole(User.Role.hospital).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsApproved()))
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "count", hospitals.size(), "hospitals", hospitals));
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyHospitals(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "50") double radiusKm) {
        List<User> hospitals = userRepository.findByRole(User.Role.hospital).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsApproved()))
                .toList();
        if (lat == null || lng == null) {
            return ResponseEntity.ok(Map.of("success", true, "count", hospitals.size(), "hospitals", hospitals));
        }
        final double rLat = lat, rLng = lng;
        List<User> nearby = hospitals.stream().filter(u -> u.getLocation() != null && u.getLocation().getLat() != null &&
                haversineDistance(rLat, rLng, u.getLocation().getLat(), u.getLocation().getLng()) <= radiusKm).toList();
        return ResponseEntity.ok(Map.of("success", true, "count", nearby.size(), "hospitals", nearby));
    }

    @GetMapping("/cases/escalated")
    @PreAuthorize("hasRole('HOSPITAL') or hasRole('ADMIN')")
    public ResponseEntity<?> getEscalatedCases(@AuthenticationPrincipal UserPrincipal currentUser) {
        User hospital = userRepository.findById(currentUser.getId()).orElse(null);
        if (hospital == null || hospital.getLocation() == null || hospital.getLocation().getLat() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Hospital location not set"));
        }

        double lat = hospital.getLocation().getLat();
        double lng = hospital.getLocation().getLng();

        List<RescueRequest> broadcastCases = rescueRepository.findByStatus("hospital_broadcasted");
        List<Map<String, Object>> nearbyCases = new ArrayList<>();

        for (RescueRequest rescue : broadcastCases) {
            if (rescue.getRejectedHospitals() != null && rescue.getRejectedHospitals().contains(currentUser.getId())) {
                continue;
            }
            if (rescue.getLocation() != null && rescue.getLocation().getLat() != null && rescue.getLocation().getLng() != null) {
                double dist = haversineDistance(lat, lng, rescue.getLocation().getLat(), rescue.getLocation().getLng());
                if (dist <= 50.0) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rescue.getId());
                    map.put("description", rescue.getDescription());
                    map.put("location", rescue.getLocation());
                    map.put("status", rescue.getStatus());
                    map.put("distance", dist);
                    nearbyCases.add(map);
                }
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "count", nearbyCases.size(), "cases", nearbyCases));
    }

    @PostMapping("/cases/{id}/accept")
    @PreAuthorize("hasRole('HOSPITAL') or hasRole('ADMIN')")
    public ResponseEntity<?> acceptBroadcastedCase(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Optional<RescueRequest> rescueOpt = rescueRepository.findById(id);
        if (rescueOpt.isEmpty() || !"hospital_broadcasted".equals(rescueOpt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Could not claim case"));
        }

        RescueRequest rescue = rescueOpt.get();
        boolean isSelfTransport = Boolean.TRUE.equals(rescue.getNgoTransporting());
        String newStatus = isSelfTransport ? "hospital_accepted" : "ambulance_pinged";

        rescue.setAssignedHospital(currentUser.getId());
        rescue.setStatus(newStatus);
        rescue.setWorkStartedAt(Instant.now());

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status(newStatus)
                .message("Hospital accepted the rescue case")
                .timestamp(Instant.now())
                .build());

        rescueRepository.save(rescue);

        if (!isSelfTransport) {
            ambulanceDispatchService.startAmbulanceDispatch(rescue.getId());
        }

        messagingTemplate.convertAndSend("/topic/rescue/" + id, Map.of("status", newStatus, "message", "Hospital accepted the case"));

        return ResponseEntity.ok(Map.of("success", true, "message", "Case claimed successfully", "rescue", rescue));
    }

    @GetMapping("/ambulances/linked")
    @PreAuthorize("hasRole('HOSPITAL') or hasRole('ADMIN')")
    public ResponseEntity<?> getLinkedAmbulances(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<User> ambulances = userRepository.findByRole(User.Role.ambulance).stream()
                .filter(a -> currentUser.getId().equals(a.getLinkedHospital()))
                .toList();

        return ResponseEntity.ok(Map.of("success", true, "count", ambulances.size(), "ambulances", ambulances));
    }

    @PostMapping("/ambulances/onboard")
    @PreAuthorize("hasRole('HOSPITAL') or hasRole('ADMIN')")
    public ResponseEntity<?> onboardAmbulance(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body) {

        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String vehicleNumber = body.get("vehicleNumber");
        String phone = body.get("phone");

        if (name == null || email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Missing required fields"));
        }

        if (userRepository.existsByEmail(email.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Email already registered"));
        }

        User ambulance = User.builder()
                .name(name)
                .email(email.toLowerCase())
                .password(passwordEncoder.encode(password))
                .role(User.Role.ambulance)
                .ambulanceType(User.AmbulanceType.linked)
                .linkedHospital(currentUser.getId())
                .vehicleNumber(vehicleNumber != null ? vehicleNumber : "")
                .phone(phone != null ? phone : "")
                .isApproved(true)
                .isAvailable(true)
                .build();

        userRepository.save(ambulance);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "message", "Ambulance onboarded successfully", "ambulance", ambulance));
    }

    @GetMapping("/cases/mine")
    @PreAuthorize("hasRole('HOSPITAL') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyCases(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> cases = rescueRepository.findByAssignedHospital(currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "count", cases.size(), "cases", cases));
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
