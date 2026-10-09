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
@Document(collection = "donations")
@CompoundIndex(name = "user_type_idx", def = "{'user': 1, 'type': 1}")
@CompoundIndex(name = "rescue_status_idx", def = "{'rescueRequest': 1, 'status': 1}")
@CompoundIndex(name = "general_status_idx", def = "{'isGeneral': 1, 'status': 1}")
public class Donation {

    @Id
    private String id;

    private String user;

    private String rescueRequest;

    private Double amount;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String type = "one-time"; // one-time, subscription

    @Builder.Default
    private String status = "pending"; // pending, successful, failed, refunded, active, cancelled

    @Builder.Default
    private String paymentMethod = "razorpay";

    @Builder.Default
    private String paymentSource = "razorpay";

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySubscriptionId;

    @Builder.Default
    private String message = "";

    @Builder.Default
    private Boolean isGeneral = false;

    private Instant subscriptionStartedAt;
    private Instant nextPaymentDate;

    @Builder.Default
    private String note = "";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
