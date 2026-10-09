package com.vetscue.api.repository;

import com.vetscue.api.entity.RescueRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RescueRequestRepository extends MongoRepository<RescueRequest, String> {

    List<RescueRequest> findByUser(String userId);

    List<RescueRequest> findByStatus(String status);

    List<RescueRequest> findByAssignedNGO(String ngoId);

    List<RescueRequest> findByAssignedHospital(String hospitalId);

    List<RescueRequest> findByAssignedAmbulance(String ambulanceId);

    @Query("{ 'status': 'ambulance_pinged' }")
    List<RescueRequest> findActiveDispatches();
}
