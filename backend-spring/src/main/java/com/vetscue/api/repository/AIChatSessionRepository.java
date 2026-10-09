package com.vetscue.api.repository;

import com.vetscue.api.entity.AIChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIChatSessionRepository extends MongoRepository<AIChatSession, String> {
    Optional<AIChatSession> findByUserId(String userId);
    void deleteByUserId(String userId);
}
