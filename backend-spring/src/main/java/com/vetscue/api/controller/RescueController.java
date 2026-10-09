package com.vetscue.api.controller;

import com.vetscue.api.dto.RescueDto.*;
import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.security.UserPrincipal;
import com.vetscue.api.service.AmbulanceDispatchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rescue")
public class RescueController {

    private static final double SERVICE_FEE = 20.0;

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AmbulanceDispatchService ambulanceDispatchService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<RescueResponse> createRescue(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateRescueRequest request) {

        Optional<User> userOpt = userRepository.findById(currentUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(RescueResponse.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        boolean depositDeducted = false;

        // Deduct ₹20 service deposit from user wallet if available
        if (user.getWalletBalance() != null && user.getWalletBalance() >= SERVICE_FEE) {
            user.setWalletBalance(user.getWalletBalance() - SERVICE_FEE);
            user.getPaymentHistory().add(User.PaymentRecord.builder()
                    .amount(SERVICE_FEE)
                    .type("deduction")
                    .description("Emergency Rescue Service Deposit (Refundable)")
                    .timestamp(Instant.now())
                    .build());
            userRepository.save(user);
            depositDeducted = true;
        }

        RescueRequest rescue = RescueRequest.builder()
                .user(user.getId())
                .description(request.getDescription())
                .animalType(request.getAnimalType() != null ? request.getAnimalType() : "dog")
                .animalTypeOther(request.getAnimalTypeOther() != null ? request.getAnimalTypeOther() : "")
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .video(request.getVideo())
                .location(request.getLocation())
                .status("pending")
                .depositDeducted(depositDeducted)
                .depositAmount(depositDeducted ? SERVICE_FEE : 0.0)
                .willingToPay(request.getWillingToPay())
                .willingToGo(request.getWillingToGo())
                .transportType(request.getTransportType())
                .build();

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status("pending")
                .message("Rescue request submitted. Waiting for NGO or nearby ambulance.")
                .timestamp(Instant.now())
                .build());

        rescueRepository.save(rescue);

        // Notify NGOs via STOMP WebSocket
        messagingTemplate.convertAndSend("/topic/role_ngo", Map.of(
                "event", "new_rescue_alert",
                "rescueId", rescue.getId(),
                "description", rescue.getDescription(),
                "location", rescue.getLocation()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(RescueResponse.builder()
                .success(true)
                .rescue(rescue)
                .message("Rescue request submitted successfully")
                .build());
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyRescues(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<RescueRequest> rescues = rescueRepository.findByUser(currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "rescues", rescues));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRescueById(@PathVariable String id) {
        Optional<RescueRequest> rescueOpt = rescueRepository.findById(id);
        if (rescueOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Rescue request not found"));
        }
        return ResponseEntity.ok(Map.of("success", true, "rescue", rescueOpt.get()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody StatusUpdateRequest request) {

        Optional<RescueRequest> rescueOpt = rescueRepository.findById(id);
        if (rescueOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Rescue request not found"));
        }

        RescueRequest rescue = rescueOpt.get();
        rescue.setStatus(request.getStatus());

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status(request.getStatus())
                .message(request.getMessage() != null ? request.getMessage() : "Status updated to " + request.getStatus())
                .timestamp(Instant.now())
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .video(request.getVideo())
                .build());

        if ("ambulance_pinged".equals(request.getStatus())) {
            ambulanceDispatchService.startAmbulanceDispatch(rescue.getId());
        }

        rescueRepository.save(rescue);

        // Broadcast status update to STOMP WebSocket topic for this rescue
        messagingTemplate.convertAndSend("/topic/rescue/" + id, Map.of(
                "rescueId", id,
                "status", request.getStatus(),
                "message", request.getMessage() != null ? request.getMessage() : ""
        ));

        return ResponseEntity.ok(Map.of("success", true, "rescue", rescue));
    }
}
