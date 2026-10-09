package com.vetscue.api.repository;

import com.vetscue.api.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipientId);
    List<Notification> findByRecipientAndIsReadOrderByCreatedAtDesc(String recipientId, Boolean isRead);
}
