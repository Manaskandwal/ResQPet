package com.vetscue.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "auditlogs")
public class AuditLog {

    @Id
    private String id;

    private String adminId;

    private String targetId;

    private String action; // impersonation_start, impersonation_stop

    private String ipAddress;

    private String userAgent;

    @CreatedDate
    @Builder.Default
    private Instant timestamp = Instant.now();

    private Map<String, Object> details;
}
