package com.vetscue.api.service;

import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.entity.WalletTransaction;
import com.vetscue.api.repository.DonationRepository;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.repository.WalletTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
public class RescueEscalationSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(RescueEscalationSchedulerService.class);

    private static final long TWENTY_MINUTES_SECONDS = 20 * 60;
    private static final long FORTY_FIVE_MINUTES_SECONDS = 45 * 60;
    private static final double SERVICE_FEE = 20.0;

    private final Map<String, ScheduledFuture<?>> timer20Map = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> timer45Map = new ConcurrentHashMap<>();

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ThreadPoolTaskScheduler taskScheduler;

    @EventListener(ApplicationReadyEvent.class)
    public void rehydrateEscalationJobs() {
        List<RescueRequest> pendingRescues = rescueRepository.findByStatus("pending");
        logger.info("[EscalationScheduler] Rehydrating {} pending rescues for escalation scheduling", pendingRescues.size());

        for (RescueRequest rescue : pendingRescues) {
            scheduleRescueEscalation(rescue.getId(), rescue.getCreatedAt() != null ? rescue.getCreatedAt() : Instant.now());
        }
    }

    public synchronized void scheduleRescueEscalation(String rescueId, Instant createdAt) {
        cancelRescueEscalation(rescueId);

        Instant now = Instant.now();
        long ageSeconds = Duration.between(createdAt, now).getSeconds();

        long delay20 = TWENTY_MINUTES_SECONDS - ageSeconds;
        long delay45 = FORTY_FIVE_MINUTES_SECONDS - ageSeconds;

        if (delay20 <= 0) {
            taskScheduler.submit(() -> execute20MinCheck(rescueId));
        } else {
            ScheduledFuture<?> f20 = taskScheduler.schedule(() -> execute20MinCheck(rescueId), now.plusSeconds(delay20));
            timer20Map.put(rescueId, f20);
        }

        if (delay45 <= 0) {
            taskScheduler.submit(() -> execute45MinClose(rescueId));
        } else {
            ScheduledFuture<?> f45 = taskScheduler.schedule(() -> execute45MinClose(rescueId), now.plusSeconds(delay45));
            timer45Map.put(rescueId, f45);
        }
    }

    public synchronized void cancelRescueEscalation(String rescueId) {
        ScheduledFuture<?> f20 = timer20Map.remove(rescueId);
        if (f20 != null) f20.cancel(true);

        ScheduledFuture<?> f45 = timer45Map.remove(rescueId);
        if (f45 != null) f45.cancel(true);
    }

    private void execute20MinCheck(String rescueId) {
        timer20Map.remove(rescueId);
        RescueRequest rescue = rescueRepository.findById(rescueId).orElse(null);
        if (rescue == null || !"pending".equals(rescue.getStatus())) {
            return;
        }

        logger.info("[EscalationScheduler] Executing 20-min escalation check for rescue {}", rescueId);
        if (Boolean.TRUE.equals(rescue.getWillingToPay())) {
            rescue.setStatus("hospital_broadcasted");
            rescue.setEscalatedAt(Instant.now());
            rescue.setFundSource("user");

            rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                    .status("hospital_broadcasted")
                    .message("No NGO responded in time. Case escalated to hospitals (User funded).")
                    .timestamp(Instant.now())
                    .build());

            messagingTemplate.convertAndSend("/topic/rescue/" + rescueId, Map.of("status", "hospital_broadcasted", "message", "Case escalated to hospitals"));
        } else {
            rescue.setStatus("closed_unresolved");
            rescue.setClosedAt(Instant.now());
            rescue.setOutcome("closed_unresolved");

            rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                    .status("closed_unresolved")
                    .message("No NGO responded in time. Case closed unresolved.")
                    .timestamp(Instant.now())
                    .build());

            maybeRefundUnresolvedFee(rescue);
            messagingTemplate.convertAndSend("/topic/rescue/" + rescueId, Map.of("status", "closed_unresolved", "message", "Case closed unresolved"));
        }

        rescueRepository.save(rescue);
    }

    private void execute45MinClose(String rescueId) {
        timer45Map.remove(rescueId);
        RescueRequest rescue = rescueRepository.findById(rescueId).orElse(null);
        if (rescue == null || List.of("closed_unresolved", "completed", "cancelled").contains(rescue.getStatus())) {
            return;
        }

        logger.info("[EscalationScheduler] Executing 45-min hard close for rescue {}", rescueId);
        rescue.setStatus("closed_unresolved");
        rescue.setClosedAt(Instant.now());
        rescue.setOutcome("closed_unresolved");

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status("closed_unresolved")
                .message("No responder accepted within 45 minutes. Case closed unresolved.")
                .timestamp(Instant.now())
                .build());

        maybeRefundUnresolvedFee(rescue);
        rescueRepository.save(rescue);

        messagingTemplate.convertAndSend("/topic/rescue/" + rescueId, Map.of("status", "closed_unresolved", "message", "Case closed unresolved after 45 minutes"));
    }

    private void maybeRefundUnresolvedFee(RescueRequest rescue) {
        if (Boolean.TRUE.equals(rescue.getDepositDeducted()) && !Boolean.TRUE.equals(rescue.getDepositRefunded())) {
            rescue.setDepositRefunded(true);
            userRepository.findById(rescue.getUser()).ifPresent(user -> {
                double refundAmount = rescue.getDepositAmount() != null && rescue.getDepositAmount() > 0 ? rescue.getDepositAmount() : SERVICE_FEE;
                user.setWalletBalance(user.getWalletBalance() + refundAmount);
                userRepository.save(user);

                walletTransactionRepository.save(WalletTransaction.builder()
                        .user(user.getId())
                        .amount(refundAmount)
                        .type("refund")
                        .description("₹" + refundAmount + " deposit refunded for unresolved rescue #" + rescue.getId())
                        .rescueRequest(rescue.getId())
                        .balanceAfter(user.getWalletBalance())
                        .createdAt(Instant.now())
                        .build());
            });
        }
    }
}
