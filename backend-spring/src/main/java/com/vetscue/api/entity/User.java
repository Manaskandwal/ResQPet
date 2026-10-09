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
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    @Indexed(unique = true, sparse = true)
    private String googleId;

    @Builder.Default
    private Role role = Role.user;

    @Builder.Default
    private Boolean isAdmin = false;

    @Builder.Default
    private Double walletBalance = 0.0;

    @Builder.Default
    private List<PaymentRecord> paymentHistory = new ArrayList<>();

    private Boolean isApproved;

    private GeoLocation location;

    private Instant locationUpdatedAt;

    @Builder.Default
    private String phone = "";

    @Builder.Default
    private String profileImage = "";

    @Builder.Default
    private String orgName = "";

    @Builder.Default
    private String regNumber = "";

    @Builder.Default
    private String address = "";

    private String linkedHospital;

    @Builder.Default
    private AmbulanceType ambulanceType = AmbulanceType.na;

    @Builder.Default
    private String vehicleNumber = "";

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isGovernment = false;

    @Builder.Default
    private Integer capacity = 10;

    @Builder.Default
    private MonthlySubscription monthlySubscription = new MonthlySubscription();

    @Builder.Default
    private PaymentDetails paymentDetails = new PaymentDetails();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum Role {
        user, ngo, hospital, ambulance, admin
    }

    public enum AmbulanceType {
        linked, independent, na
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeoLocation {
        private Double lat;
        private Double lng;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRecord {
        private Double amount;
        private String type; // deduction, deposit, refund, credit
        private String description;
        private Instant timestamp;
        private String rescueId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySubscription {
        @Builder.Default
        private Boolean isSubscribed = false;
        @Builder.Default
        private Double amount = 0.0;
        private Instant startedAt;
        private Instant lastDeductedAt;
        private Instant nextPaymentDate;
        @Builder.Default
        private String status = "inactive"; // inactive, active, paused, cancelled
        private Instant pausedUntil;
        private Instant cancelledAt;
        @Builder.Default
        private String paymentSource = "wallet_test";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDetails {
        @Builder.Default
        private String upiId = "";
        @Builder.Default
        private String accountHolder = "";
        @Builder.Default
        private String accountNumber = "";
        @Builder.Default
        private String bankName = "";
        @Builder.Default
        private String ifsc = "";
    }
}
