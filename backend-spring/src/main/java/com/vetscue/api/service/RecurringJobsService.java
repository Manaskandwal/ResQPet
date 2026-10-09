package com.vetscue.api.service;

import com.vetscue.api.entity.Donation;
import com.vetscue.api.entity.Notification;
import com.vetscue.api.entity.User;
import com.vetscue.api.entity.WalletTransaction;
import com.vetscue.api.repository.DonationRepository;
import com.vetscue.api.repository.NotificationRepository;
import com.vetscue.api.repository.UserRepository;
import com.vetscue.api.repository.WalletTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class RecurringJobsService {

    private static final Logger logger = LoggerFactory.getLogger(RecurringJobsService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Scheduled(cron = "0 * * * * *") // Check every minute
    public void processRecurringEmergencyDeductions() {
        List<User> subscribers = userRepository.findByRole(User.Role.user).stream()
                .filter(u -> u.getMonthlySubscription() != null && Boolean.TRUE.equals(u.getMonthlySubscription().getIsSubscribed()))
                .toList();

        Instant now = Instant.now();

        for (User user : subscribers) {
            User.MonthlySubscription sub = user.getMonthlySubscription();
            if ("paused".equals(sub.getStatus()) && sub.getPausedUntil() != null && sub.getPausedUntil().isAfter(now)) {
                continue;
            }

            if (sub.getNextPaymentDate() != null && sub.getNextPaymentDate().isAfter(now)) {
                continue;
            }

            double amount = sub.getAmount() != null ? sub.getAmount() : 0.0;
            if (user.getWalletBalance() < amount) {
                notificationRepository.save(Notification.builder()
                        .recipient(user.getId())
                        .title("Recurring Contribution Skipped")
                        .message("Wallet balance too low for next ₹" + amount + " emergency contribution.")
                        .type("system")
                        .createdAt(now)
                        .build());
                continue;
            }

            user.setWalletBalance(user.getWalletBalance() - amount);
            sub.setLastDeductedAt(now);
            sub.setNextPaymentDate(ZonedDateTime.ofInstant(now, ZoneId.systemDefault()).plusMonths(1).toInstant());
            sub.setStatus("active");
            user.setMonthlySubscription(sub);
            userRepository.save(user);

            walletTransactionRepository.save(WalletTransaction.builder()
                    .user(user.getId())
                    .amount(amount)
                    .type("debit")
                    .description("Recurring emergency fund contribution deducted from wallet")
                    .balanceAfter(user.getWalletBalance())
                    .createdAt(now)
                    .build());

            donationRepository.save(Donation.builder()
                    .user(user.getId())
                    .amount(amount)
                    .type("subscription")
                    .status("successful")
                    .paymentMethod("wallet")
                    .paymentSource("wallet_test")
                    .isGeneral(true)
                    .subscriptionStartedAt(sub.getStartedAt())
                    .nextPaymentDate(sub.getNextPaymentDate())
                    .note("Recurring contribution processed from wallet.")
                    .createdAt(now)
                    .build());

            notificationRepository.save(Notification.builder()
                    .recipient(user.getId())
                    .title("Emergency Fund Contribution")
                    .message("₹" + amount + " was deducted from your wallet for the emergency fund.")
                    .type("wallet_debit")
                    .createdAt(now)
                    .build());

            logger.info("[RecurringJobs] Processed ₹{} emergency contribution for user {}", amount, user.getId());
        }
    }
}
