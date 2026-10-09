package com.vetscue.api.service;

import com.vetscue.api.entity.RescueRequest;
import com.vetscue.api.entity.User;
import com.vetscue.api.repository.RescueRequestRepository;
import com.vetscue.api.repository.UserRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
public class AmbulanceDispatchService {

    private static final Logger logger = LoggerFactory.getLogger(AmbulanceDispatchService.class);

    private static final long PING_EXPIRY_SECONDS = 20 * 60; // 20 min
    private static final long STALE_TIMEOUT_SECONDS = 30 * 60; // 30 min
    private static final long PING_INTERVAL_SECONDS = 10 * 60; // 10 min

    private final Map<String, ScheduledFuture<?>> activeTaskMap = new ConcurrentHashMap<>();

    @Autowired
    private RescueRequestRepository rescueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ThreadPoolTaskScheduler taskScheduler;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeActiveDispatches() {
        List<RescueRequest> activeDispatches = rescueRepository.findActiveDispatches();
        logger.info("[AmbulanceDispatch] Rehydrating {} active dispatches from MongoDB on startup", activeDispatches.size());
        for (RescueRequest rescue : activeDispatches) {
            startAmbulanceDispatch(rescue.getId());
        }
    }

    public void startAmbulanceDispatch(String rescueId) {
        rescueRepository.findById(rescueId).ifPresent(rescue -> {
            if (!"ambulance_pinged".equals(rescue.getStatus())) {
                logger.info("[AmbulanceDispatch] Rescue {} is not in ambulance_pinged status. Skipping.", rescueId);
                return;
            }

            logger.info("[AmbulanceDispatch] Starting dispatch lifecycle for rescue {}", rescueId);
            boolean hasActivePings = rescue.getActiveAmbulancePings() != null && !rescue.getActiveAmbulancePings().isEmpty();

            if (!hasActivePings) {
                boolean pingSent = pingNearestAmbulance(rescue);
                if (pingSent) {
                    rescueRepository.save(rescue);
                }
            }

            scheduleRescueChecks(rescueId);
        });
    }

    private synchronized void scheduleRescueChecks(String rescueId) {
        stopRescueChecks(rescueId);

        ScheduledFuture<?> future = taskScheduler.scheduleAtFixedRate(() -> {
            try {
                checkRescueDispatchStatus(rescueId);
            } catch (Exception ex) {
                logger.error("[AmbulanceDispatch] Error checking rescue {}: {}", rescueId, ex.getMessage());
            }
        }, Duration.ofSeconds(60));

        activeTaskMap.put(rescueId, future);
        logger.info("[AmbulanceDispatch] Scheduled 60s periodic checks for rescue {}", rescueId);
    }

    public synchronized void stopRescueChecks(String rescueId) {
        ScheduledFuture<?> future = activeTaskMap.remove(rescueId);
        if (future != null) {
            future.cancel(true);
            logger.info("[AmbulanceDispatch] Stopped checks for rescue {}", rescueId);
        }
    }

    private void checkRescueDispatchStatus(String rescueId) {
        RescueRequest rescue = rescueRepository.findById(rescueId).orElse(null);
        if (rescue == null || !"ambulance_pinged".equals(rescue.getStatus())) {
            stopRescueChecks(rescueId);
            return;
        }

        Instant now = Instant.now();
        Instant twentyMinAgo = now.minusSeconds(PING_EXPIRY_SECONDS);
        Instant tenMinAgo = now.minusSeconds(PING_INTERVAL_SECONDS);
        Instant thirtyMinAgo = now.minusSeconds(STALE_TIMEOUT_SECONDS);

        boolean modified = false;

        // 1. Expire old pings
        List<RescueRequest.ActivePing> activePings = rescue.getActiveAmbulancePings();
        List<RescueRequest.ActivePing> expiredPings = activePings.stream()
                .filter(p -> p.getPingedAt() != null && p.getPingedAt().isBefore(twentyMinAgo))
                .toList();

        if (!expiredPings.isEmpty()) {
            for (RescueRequest.ActivePing expired : expiredPings) {
                if (!rescue.getPingRejectors().contains(expired.getAmbulanceId())) {
                    rescue.getPingRejectors().add(expired.getAmbulanceId());
                }
            }
            rescue.getActiveAmbulancePings().removeIf(p -> p.getPingedAt() != null && p.getPingedAt().isBefore(twentyMinAgo));
            modified = true;
            logger.info("[AmbulanceDispatch] Expired {} pings for rescue {}", expiredPings.size(), rescueId);
        }

        // 2. Check total timeout condition (30 min or 3+ rejects)
        Instant pingStartedAt = rescue.getCreatedAt();
        if (rescue.getStatusLogs() != null) {
            rescue.getStatusLogs().stream()
                    .filter(log -> "ambulance_pinged".equals(log.getStatus()))
                    .findFirst()
                    .ifPresent(log -> {});
        }

        if (rescue.getPingRejectors().size() >= 3 || (pingStartedAt != null && pingStartedAt.isBefore(thirtyMinAgo))) {
            logger.info("[AmbulanceDispatch] Rescue {} stalled. Handling fallback.", rescueId);
            handleStalledRescue(rescue);
            stopRescueChecks(rescueId);
            return;
        }

        // 3. Ping next available ambulance if needed
        boolean needsNewPing = false;
        if (rescue.getActiveAmbulancePings().isEmpty()) {
            needsNewPing = true;
        } else {
            RescueRequest.ActivePing newestPing = rescue.getActiveAmbulancePings().get(rescue.getActiveAmbulancePings().size() - 1);
            if (newestPing.getPingedAt() != null && newestPing.getPingedAt().isBefore(tenMinAgo)) {
                needsNewPing = true;
            }
        }

        if (needsNewPing) {
            boolean pingSent = pingNearestAmbulance(rescue);
            modified = modified || pingSent;
        }

        if (modified) {
            rescueRepository.save(rescue);
        }
    }

    private boolean pingNearestAmbulance(RescueRequest rescue) {
        List<String> excludeIds = new ArrayList<>(rescue.getPingRejectors());
        if (rescue.getActiveAmbulancePings() != null) {
            rescue.getActiveAmbulancePings().forEach(p -> excludeIds.add(p.getAmbulanceId()));
        }

        List<User> candidates = userRepository.findAvailableIndependentAmbulancesExcluding(excludeIds);
        User nearestAmbulance = null;
        double minDistance = Double.MAX_VALUE;

        if (candidates != null && !candidates.isEmpty() && rescue.getLocation() != null) {
            for (User amb : candidates) {
                if (amb.getLocation() != null && amb.getLocation().getLat() != null && amb.getLocation().getLng() != null) {
                    double dist = haversineDistance(
                            rescue.getLocation().getLat(), rescue.getLocation().getLng(),
                            amb.getLocation().getLat(), amb.getLocation().getLng()
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestAmbulance = amb;
                    }
                }
            }
            if (nearestAmbulance == null) {
                nearestAmbulance = candidates.get(0);
            }
        }

        if (nearestAmbulance != null) {
            rescue.getActiveAmbulancePings().add(RescueRequest.ActivePing.builder()
                    .ambulanceId(nearestAmbulance.getId())
                    .pingedAt(Instant.now())
                    .build());

            messagingTemplate.convertAndSend("/queue/user-" + nearestAmbulance.getId(), Map.of(
                    "rescueRequestId", rescue.getId(),
                    "lat", rescue.getLocation().getLat(),
                    "lng", rescue.getLocation().getLng(),
                    "message", "New Emergency Pickup Request Nearby!"
            ));

            logger.info("[AmbulanceDispatch] Pinged ambulance {} for rescue {}", nearestAmbulance.getId(), rescue.getId());
            return true;
        }

        logger.info("[AmbulanceDispatch] No available ambulances to ping for rescue {}", rescue.getId());
        return false;
    }

    private void handleStalledRescue(RescueRequest rescue) {
        Instant now = Instant.now();
        if (rescue.getAssignedHospital() != null) {
            rescue.setStatus("manual_transport_accepted");
            rescue.setAdminNotes((rescue.getAdminNotes() != null ? rescue.getAdminNotes() : "") +
                    "\n[System] Auto-changed to Manual Transport: No ambulance responded.");

            rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                    .status("manual_transport_accepted")
                    .message("No ambulance available. Hospital accepted. Please arrange manual transport.")
                    .timestamp(now)
                    .build());

            rescueRepository.save(rescue);
            messagingTemplate.convertAndSend("/topic/rescue/" + rescue.getId(), Map.of(
                    "status", "manual_transport_accepted",
                    "message", "No ambulance available. Please arrange manual transport to the assigned hospital."
            ));
            return;
        }

        // Unresolved case closure
        rescue.setStatus("closed_unresolved");
        rescue.setOutcome("closed_unresolved");
        rescue.setClosedAt(now);
        rescue.setAdminNotes((rescue.getAdminNotes() != null ? rescue.getAdminNotes() : "") +
                "\n[System] Auto-closed: No ambulance responded within SLA.");

        rescue.getStatusLogs().add(RescueRequest.StatusLog.builder()
                .status("closed_unresolved")
                .message("System timeout: No ambulance accepted within the SLA period.")
                .timestamp(now)
                .build());

        rescueRepository.save(rescue);
        messagingTemplate.convertAndSend("/topic/rescue/" + rescue.getId(), Map.of(
                "status", "closed_unresolved",
                "message", "No ambulance accepted the request within the timeout."
        ));
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
