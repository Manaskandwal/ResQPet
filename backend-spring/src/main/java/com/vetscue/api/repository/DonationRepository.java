package com.vetscue.api.repository;

import com.vetscue.api.entity.Donation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends MongoRepository<Donation, String> {
    List<Donation> findByUser(String userId);
    List<Donation> findByRescueRequest(String rescueRequestId);
    List<Donation> findByIsGeneralAndStatus(Boolean isGeneral, String status);
}
