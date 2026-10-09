package com.vetscue.api.controller;

import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/ngo")
public class NgoController {

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/list")
    public ResponseEntity<?> listNgos() {
        List<User> ngos = userRepository.findByRole(User.Role.ngo).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsApproved()))
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "count", ngos.size(), "ngos", ngos));
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyNgos(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "50") double radiusKm) {
        List<User> ngos = userRepository.findByRole(User.Role.ngo).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsApproved()))
                .toList();
        if (lat == null || lng == null) {
            return ResponseEntity.ok(Map.of("success", true, "count", ngos.size(), "ngos", ngos));
        }
        final double rLat = lat, rLng = lng;
        List<User> nearby = ngos.stream().filter(u -> u.getLocation() != null && u.getLocation().getLat() != null &&
                haversineDistance(rLat, rLng, u.getLocation().getLat(), u.getLocation().getLng()) <= radiusKm).toList();
        return ResponseEntity.ok(Map.of("success", true, "count", nearby.size(), "ngos", nearby));
    }

    @GetMapping("/cases/nearby")
    @PreAuthorize("hasRole('NGO') or hasRole('ADMIN')")
    public ResponseEntity<?> getNearbyCases(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        User ngo = userRepository.findById(currentUser.getId()).orElse(null);
        Double activeLat = (lat != null) ? lat : (ngo != null && ngo.getLocation() != null ? ngo.getLocation().getLat() : null);
        Double activeLng = (lng != null) ? lng : (ngo != null && ngo.getLocation() != null ? ngo.getLocation().getLng() : null);
        boolean hasLocation = activeLat != null && activeLng != null;

        List<RescueRequest> pendingCases = rescueRepository.findByStatus("pending");
        List<Map<String, Object>> resultCases = new ArrayList<>();

        for (RescueRequest rescue : pendingCases) {
            if (rescue.getRejectedBy() != null && rescue.getRejectedBy().contains(currentUser.getId())) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", rescue.getId());
            map.put("user", rescue.getUser());
            map.put("description", rescue.getDescription());
            map.put("animalType", rescue.getAnimalType());
            map.put("location", rescue.getLocation());
            map.put("status", rescue.getStatus());
            map.put("images", rescue.getImages());
            map.put("createdAt", rescue.getCreatedAt());

            if (hasLocation && rescue.getLocation() != null && rescue.getLocation().getLat() != null && rescue.getLocation().getLng() != null) {
                double dist = haversineDistance(activeLat, activeLng, rescue.getLocation().getLat(), rescue.getLocation().getLng());
                if (dist <= 50.0) {
                    map.put("distance", dist);
                    resultCases.add(map);
                }
            } else {
                map.put("distance", null);
                resultCases.add(map);
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", resultCases.size(),
                "cases", resultCases,
                "locationSet", hasLocation
        ));
    }

    @PostMapping("/cases/{id}/accept")
    @PreAuthorize("hasRole('NGO') or hasRole('ADMIN')")
    public ResponseEntity<?> acceptCase(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body) {

        Optional<RescueRequest> rescueOpt = rescueRepository.findById(id);
        if (rescueOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Case not found"));
        }

        RescueRequest rescue = rescueOpt.get();
        if (!"pending".equals(rescue.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Case is no longer pending"));
        }

        String type = (String) body.get("type");
        rescue.setAssignedNGO(currentUser.getId());
        rescue.setAcceptedAt(Instant.now());

        String updateMessage = "NGO accepted the case for treatment.";
        if ("schedule".equals(type)) {
            rescue.setStatus("scheduled");
            updateMessage = "NGO scheduled the rescue.";
        } else {
            rescue.setStatus("accepted");
        }

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status(rescue.getStatus())
                .message(updateMessage)
                .timestamp(Instant.now())
                .build());

        rescueRepository.save(rescue);
        messagingTemplate.convertAndSend("/topic/rescue/" + id, Map.of("status", rescue.getStatus(), "message", updateMessage));

        return ResponseEntity.ok(Map.of("success", true, "message", updateMessage, "rescue", rescue));
    }

    @GetMapping("/cases/mine")
    @PreAuthorize("hasRole('NGO') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyCases(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> cases = rescueRepository.findByAssignedNGO(currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "count", cases.size(), "cases", cases));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('NGO') or hasRole('ADMIN')")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> ngoCases = rescueRepository.findByAssignedNGO(currentUser.getId());
        long acceptedCount = ngoCases.size();
        long completedCount = ngoCases.stream().filter(c -> "completed".equals(c.getStatus())).count();

        return ResponseEntity.ok(Map.of("success", true, "analytics", Map.of(
                "accepted_count", acceptedCount,
                "completed_count", completedCount
        )));
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
