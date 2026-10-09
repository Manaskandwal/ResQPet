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
@Document(collection = "wallettransactions")
@CompoundIndex(name = "user_created_idx", def = "{'user': 1, 'createdAt': -1}")
public class WalletTransaction {

    @Id
    private String id;

    private String user;

    private Double amount;

    private String type; // credit, debit, refund

    private String description;

    private String razorpayOrderId;
    private String razorpayPaymentId;

    private String rescueRequest;

    private Double balanceAfter;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
