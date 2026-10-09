package com.vetscue.api.repository;

import com.vetscue.api.entity.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByAdminId(String adminId);
    List<AuditLog> findByTargetId(String targetId);
}
