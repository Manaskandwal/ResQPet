package com.vetscue.api.dto;

import com.vetscue.api.entity.RescueRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class RescueDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRescueRequest {
        @NotBlank(message = "Description is required")
        private String description;

        private String animalType = "dog";
        private String animalTypeOther = "";
        private List<String> images;
        private String video;

        @NotNull(message = "Location is required")
        private RescueRequest.Location location;

        private Boolean willingToPay = false;
        private Boolean willingToGo = false;
        private String transportType = "na";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotBlank(message = "Status is required")
        private String status;
        private String message;
        private List<String> images;
        private String video;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RescueResponse {
        private Boolean success;
        private RescueRequest rescue;
        private String message;
    }
}
