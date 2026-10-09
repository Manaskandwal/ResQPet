package com.vetscue.api.dto;

import com.vetscue.api.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private User.Role role = User.Role.user;
        private String phone = "";
        private String orgName = "";
        private String regNumber = "";
        private String address = "";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private Boolean success;
        private String token;
        private UserDTO user;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private String id;
        private String name;
        private String email;
        private User.Role role;
        private Boolean isAdmin;
        private Double walletBalance;
        private Boolean isApproved;
        private User.GeoLocation location;
        private String phone;
        private String profileImage;
        private String orgName;

        public static UserDTO fromEntity(User user) {
            return UserDTO.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .isAdmin(user.getIsAdmin())
                    .walletBalance(user.getWalletBalance())
                    .isApproved(user.getIsApproved())
                    .location(user.getLocation())
                    .phone(user.getPhone())
                    .profileImage(user.getProfileImage())
                    .orgName(user.getOrgName())
                    .build();
        }
    }
}
