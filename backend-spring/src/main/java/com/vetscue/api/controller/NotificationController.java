package com.vetscue.api.controller;

import com.vetscue.api.entity.Notification;
import com.vetscue.api.repository.NotificationRepository;
import com.vetscue.api.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "count", notifications.size(), "notifications", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserPrincipal currentUser) {
        long count = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser.getId())
                .stream().filter(n -> Boolean.FALSE.equals(n.getIsRead())).count();
        return ResponseEntity.ok(Map.of("success", true, "unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser.getId());
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }
}
