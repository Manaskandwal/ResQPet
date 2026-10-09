package com.vetscue.api.controller;

import com.vetscue.api.dto.AuthDto.*;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.security.JwtTokenProvider;
import com.vetscue.api.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().success(false).message("Invalid email or password").build());
        }

        User user = userOpt.get();
        if (user.getPassword() == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().success(false).message("Invalid email or password").build());
        }

        String jwt = tokenProvider.generateToken(user.getId(), user.getRole().name(), user.getIsAdmin());

        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .token(jwt)
                .user(UserDTO.fromEntity(user))
                .message("Login successful")
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail().toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthResponse.builder().success(false).message("Email is already registered").build());
        }

        User.Role role = registerRequest.getRole() != null ? registerRequest.getRole() : User.Role.user;
        Boolean isApproved = (role == User.Role.user || role == User.Role.admin);

        User user = User.builder()
                .name(registerRequest.getName())
                .email(registerRequest.getEmail().toLowerCase())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(role)
                .isAdmin(false)
                .walletBalance(0.0)
                .isApproved(isApproved)
                .phone(registerRequest.getPhone())
                .orgName(registerRequest.getOrgName())
                .regNumber(registerRequest.getRegNumber())
                .address(registerRequest.getAddress())
                .build();

        userRepository.save(user);
        String jwt = tokenProvider.generateToken(user.getId(), user.getRole().name(), user.getIsAdmin());

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.builder()
                .success(true)
                .token(jwt)
                .user(UserDTO.fromEntity(user))
                .message("User registered successfully")
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().success(false).message("Not authenticated").build());
        }

        Optional<User> userOpt = userRepository.findById(currentUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(AuthResponse.builder().success(false).message("User not found").build());
        }

        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .user(UserDTO.fromEntity(userOpt.get()))
                .build());
    }
}
