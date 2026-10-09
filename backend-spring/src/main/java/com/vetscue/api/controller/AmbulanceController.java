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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ambulance")
public class AmbulanceController {

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/task")
    @PreAuthorize("hasRole('AMBULANCE') or hasRole('ADMIN')")
    public ResponseEntity<?> getAssignedTask(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> tasks = rescueRepository.findByAssignedAmbulance(currentUser.getId()).stream()
                .filter(t -> List.of("ambulance_assigned", "en_route", "picked_up").contains(t.getStatus()))
                .toList();

        RescueRequest activeTask = tasks.isEmpty() ? null : tasks.get(0);
        return ResponseEntity.ok(Map.of("success", true, "task", activeTask != null ? activeTask : Map.of()));
    }

    @PostMapping("/cases/{id}/accept")
    @PreAuthorize("hasRole('AMBULANCE') or hasRole('ADMIN')")
    public ResponseEntity<?> acceptPing(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Optional<RescueRequest> rescueOpt = rescueRepository.findById(id);
        if (rescueOpt.isEmpty() || !"ambulance_pinged".equals(rescueOpt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Dispatch no longer available"));
        }

        RescueRequest rescue = rescueOpt.get();
        rescue.setStatus("ambulance_assigned");
        rescue.setAssignedAmbulance(currentUser.getId());
        rescue.setAmbulanceAssignedAt(Instant.now());
        rescue.setActiveAmbulancePings(new ArrayList<>());

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status("ambulance_assigned")
                .message("Ambulance driver accepted dispatch")
                .timestamp(Instant.now())
                .build());

        rescueRepository.save(rescue);

        userRepository.findById(currentUser.getId()).ifPresent(user -> {
            user.setIsAvailable(false);
            userRepository.save(user);
        });

        messagingTemplate.convertAndSend("/topic/rescue/" + id, Map.of("status", "ambulance_assigned", "message", "Ambulance accepted dispatch"));

        return ResponseEntity.ok(Map.of("success", true, "message", "Dispatch claimed successfully", "rescue", rescue));
    }

    @PutMapping("/location")
    @PreAuthorize("hasRole('AMBULANCE') or hasRole('ADMIN')")
    public ResponseEntity<?> updateLocation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Double> locationMap) {

        Double lat = locationMap.get("lat");
        Double lng = locationMap.get("lng");

        if (lat == null || lng == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Valid lat and lng required"));
        }

        userRepository.findById(currentUser.getId()).ifPresent(user -> {
            user.setLocation(new User.GeoLocation(lat, lng));
            user.setLocationUpdatedAt(Instant.now());
            userRepository.save(user);
        });

        return ResponseEntity.ok(Map.of("success", true, "message", "Location updated successfully"));
    }

    @PutMapping("/availability")
    @PreAuthorize("hasRole('AMBULANCE') or hasRole('ADMIN')")
    public ResponseEntity<?> updateAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body) {

        Boolean available = (Boolean) body.getOrDefault("available", true);
        userRepository.findById(currentUser.getId()).ifPresent(user -> {
            user.setIsAvailable(available);
            userRepository.save(user);
        });
        return ResponseEntity.ok(Map.of("success", true, "message", "Availability updated to: " + available));
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyAmbulances(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "20") double radiusKm) {

        List<User> allAmbulances = userRepository.findByRole(User.Role.ambulance).stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsAvailable()) && a.getLocation() != null
                        && a.getLocation().getLat() != null)
                .toList();

        if (lat == null || lng == null) {
            return ResponseEntity.ok(Map.of("success", true, "count", allAmbulances.size(), "ambulances", allAmbulances));
        }

        final double refLat = lat;
        final double refLng = lng;
        List<User> nearby = allAmbulances.stream().filter(a -> {
            double dist = haversineDistance(refLat, refLng, a.getLocation().getLat(), a.getLocation().getLng());
            return dist <= radiusKm;
        }).toList();

        return ResponseEntity.ok(Map.of("success", true, "count", nearby.size(), "ambulances", nearby));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('AMBULANCE') or hasRole('ADMIN')")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> history = rescueRepository.findByAssignedAmbulance(currentUser.getId()).stream()
                .filter(t -> List.of("completed", "delivered").contains(t.getStatus()))
                .toList();

        return ResponseEntity.ok(Map.of("success", true, "count", history.size(), "history", history));
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
