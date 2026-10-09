package com.vetscue.api.repository;

import com.vetscue.api.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    Boolean existsByEmail(String email);

    List<User> findByRole(User.Role role);

    @Query("{ 'role': 'ambulance', 'ambulanceType': 'independent', 'isAvailable': true, 'isApproved': true, '_id': { '$nin': ?0 } }")
    List<User> findAvailableIndependentAmbulancesExcluding(List<String> excludedIds);
}
