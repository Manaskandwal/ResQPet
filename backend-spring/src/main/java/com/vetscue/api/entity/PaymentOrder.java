package com.vetscue.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "paymentorders")
public class PaymentOrder {

    @Id
    private String id;

    private String user;

    @Indexed(unique = true)
    private String razorpayOrderId;

    private Double amount;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String status = "pending"; // pending, completed, failed

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
