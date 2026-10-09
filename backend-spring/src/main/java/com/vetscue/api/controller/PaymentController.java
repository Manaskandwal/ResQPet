package com.vetscue.api.controller;

import com.vetscue.api.entity.PaymentOrder;
import com.vetscue.api.entity.User;
import com.vetscue.api.entity.WalletTransaction;
import com.vetscue.api.repository.PaymentOrderRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.repository.WalletTransactionRepository;
import com.vetscue.api.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @PostMapping("/mock-topup")
    public ResponseEntity<?> mockTopup(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body) {

        double amount = Double.parseDouble(body.getOrDefault("amount", 100.0).toString());
        double creditAmount = Math.max(1.0, Math.abs(amount));

        Optional<User> userOpt = userRepository.findById(currentUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "User not found"));
        }

        User user = userOpt.get();
        user.setWalletBalance(user.getWalletBalance() + creditAmount);
        userRepository.save(user);

        WalletTransaction txn = WalletTransaction.builder()
                .user(user.getId())
                .amount(creditAmount)
                .type("credit")
                .description("Wallet top-up of ₹" + creditAmount + " (Mock)")
                .razorpayOrderId("mock_order_" + System.currentTimeMillis())
                .razorpayPaymentId("mock_pay_" + System.currentTimeMillis())
                .balanceAfter(user.getWalletBalance())
                .createdAt(Instant.now())
                .build();

        walletTransactionRepository.save(txn);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "₹" + creditAmount + " added to your wallet successfully!",
                "walletBalance", user.getWalletBalance(),
                "transaction", txn
        ));
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body) {

        double amount = Double.parseDouble(body.getOrDefault("amount", 10.0).toString());
        if (amount < 10.0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Minimum top-up amount is ₹10"));
        }

        String mockOrderId = "order_" + System.currentTimeMillis();
        PaymentOrder order = PaymentOrder.builder()
                .user(currentUser.getId())
                .razorpayOrderId(mockOrderId)
                .amount(amount)
                .currency("INR")
                .status("pending")
                .build();

        paymentOrderRepository.save(order);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "order", Map.of("id", mockOrderId, "amount", (long)(amount * 100), "currency", "INR"),
                "keyId", razorpayKeyId
        ));
    }
}
