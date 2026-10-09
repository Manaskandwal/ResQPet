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
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rescuerequests")
@CompoundIndex(name = "status_created_idx", def = "{'status': 1, 'createdAt': 1}")
@CompoundIndex(name = "location_idx", def = "{'location.lat': 1, 'location.lng': 1}")
public class RescueRequest {

    @Id
    private String id;

    private String user; // UserId reference

    private String description;

    @Builder.Default
    private String animalType = "dog";

    @Builder.Default
    private String animalTypeOther = "";

    @Builder.Default
    private List<String> images = new ArrayList<>();

    private String video;

    private Location location;

    @Builder.Default
    private String status = "pending";

    @Builder.Default
    private Boolean depositDeducted = false;

    @Builder.Default
    private Boolean depositRefunded = false;

    @Builder.Default
    private Double depositAmount = 0.0;

    private String assignedNGO;

    private String assignedHospital;

    private String assignedAmbulance;

    private Instant acceptedAt;
    private Instant scheduleDate;
    private Instant escalatedAt;
    private Instant ambulanceAssignedAt;
    private Instant enRouteAt;
    private Instant pickedUpAt;
    private Instant deliveredAt;
    private Instant completedAt;
    private Instant closedAt;
    private Instant workStartedAt;

    @Builder.Default
    private String outcome = "pending";

    @Builder.Default
    private String adminNotes = "";

    @Builder.Default
    private List<String> rejectedBy = new ArrayList<>();

    @Builder.Default
    private List<String> rejectedHospitals = new ArrayList<>();

    @Builder.Default
    private List<String> pingRejectors = new ArrayList<>();

    @Builder.Default
    private List<ActivePing> activeAmbulancePings = new ArrayList<>();

    @Builder.Default
    private String transportType = "na";

    @Builder.Default
    private Boolean ngoTransporting = false;

    @Builder.Default
    private Boolean willingToPay = false;

    @Builder.Default
    private Boolean willingToGo = false;

    @Builder.Default
    private String fundSource = "pending";

    @Builder.Default
    private Boolean isFundraiser = false;

    @Builder.Default
    private FundraiserDetails fundraiser = new FundraiserDetails();

    @Builder.Default
    private Double estimatedCost = 0.0;

    @Builder.Default
    private Double amountRaised = 0.0;

    @Builder.Default
    private List<FollowUp> followUps = new ArrayList<>();

    @Builder.Default
    private List<StatusLog> statusLogs = new ArrayList<>();

    @Builder.Default
    private String serviceType = "rescue";

    @Builder.Default
    private String paymentStatus = "na";

    @Builder.Default
    private ImpactDetails impact = new ImpactDetails();

    private String commission;

    @Builder.Default
    private BillDetails bill = new BillDetails();

    @Builder.Default
    private String treatmentStatus = "not_started";

    @Builder.Default
    private String hospitalNote = "";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Location {
        private Double lat;
        private Double lng;
        @Builder.Default
        private String address = "";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivePing {
        private String ambulanceId;
        @Builder.Default
        private Instant pingedAt = Instant.now();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FundraiserDetails {
        @Builder.Default
        private String status = "none";
        @Builder.Default
        private Double requestedGoal = 0.0;
        private String billImage;
        @Builder.Default
        private String billText = "";
        @Builder.Default
        private String storyText = "";
        @Builder.Default
        private String caption = "";
        @Builder.Default
        private List<String> media = new ArrayList<>();
        private Instant requestedAt;
        @Builder.Default
        private String adminNotes = "";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowUp {
        private Instant scheduledFor;
        @Builder.Default
        private String notes = "";
        @Builder.Default
        private String status = "scheduled"; // scheduled, completed, cancelled, escalated
        @Builder.Default
        private Instant createdAt = Instant.now();
        private Instant completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusLog {
        private String status;
        private String message;
        @Builder.Default
        private Instant timestamp = Instant.now();
        @Builder.Default
        private List<String> images = new ArrayList<>();
        private String video;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactDetails {
        @Builder.Default
        private List<String> likes = new ArrayList<>();
        @Builder.Default
        private List<Comment> comments = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Comment {
        private String user;
        private String name;
        private String message;
        @Builder.Default
        private Instant createdAt = Instant.now();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillDetails {
        @Builder.Default
        private List<BillItem> items = new ArrayList<>();
        private String prescriptionImageUrl;
        @Builder.Default
        private Double totalAmount = 0.0;
        private String sentTo; // user, ngo, null
        @Builder.Default
        private String paidStatus = "pending"; // pending, paid, waived
        private String walletTransactionId;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillItem {
        private String name;
        private Double amount;
    }
}
