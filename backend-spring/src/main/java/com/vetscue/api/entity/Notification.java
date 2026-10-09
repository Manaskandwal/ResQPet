package com.vetscue.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndex(name = "unread_notifications_idx", def = "{'recipient': 1, 'isRead': 1, 'createdAt': -1}")
public class Notification {

    @Id
    private String id;

    private String recipient;

    private String title;

    private String message;

    @Builder.Default
    private String type = "system";

    @Builder.Default
    private Boolean isRead = false;

    private String rescueRequest;

    private String transaction;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
