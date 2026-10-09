package com.vetscue.api.controller;

import com.vetscue.api.entity.AuditLog;
import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.AuditLogRepository;
import com.vetscue.api.repository.DonationRepository;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        long totalUsers = userRepository.count();
        long totalRequests = rescueRepository.count();
        long pendingRequests = rescueRepository.findByStatus("pending").size();
        long completedRequests = rescueRepository.findByStatus("completed").size();

        return ResponseEntity.ok(Map.of("success", true, "analytics", Map.of(
                "totalUsers", totalUsers,
                "totalRequests", totalRequests,
                "pendingRequests", pendingRequests,
                "completedRequests", completedRequests
        )));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(Map.of("success", true, "count", users.size(), "users", users));
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<?> getPendingApprovals() {
        List<User> pending = userRepository.findAll().stream()
                .filter(u -> Boolean.FALSE.equals(u.getIsApproved()) && u.getRole() != User.Role.user)
                .toList();

        return ResponseEntity.ok(Map.of("success", true, "count", pending.size(), "users", pending));
    }

    @PutMapping("/approve/{userId}")
    public ResponseEntity<?> approveUser(
            @PathVariable String userId,
            @RequestBody Map<String, Object> body) {

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "User not found"));
        }

        User user = userOpt.get();
        Boolean approve = (Boolean) body.getOrDefault("approve", true);
        user.setIsApproved(approve);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", approve ? "User approved" : "Approval revoked", "user", user));
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "User not found"));
        }
        userRepository.deleteById(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
    }

    @GetMapping("/rescue-requests")
    public ResponseEntity<?> getAllRescues() {
        List<RescueRequest> rescues = rescueRepository.findAll();
        return ResponseEntity.ok(Map.of("success", true, "count", rescues.size(), "rescues", rescues));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAll();
        return ResponseEntity.ok(Map.of("success", true, "count", logs.size(), "logs", logs));
    }
}
