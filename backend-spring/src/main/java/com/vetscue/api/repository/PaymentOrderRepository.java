package com.vetscue.api.repository;

import com.vetscue.api.entity.PaymentOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends MongoRepository<PaymentOrder, String> {
    Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId);
}
