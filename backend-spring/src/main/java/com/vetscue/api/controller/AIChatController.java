package com.vetscue.api.controller;

import com.vetscue.api.entity.AIChatSession;
import com.vetscue.api.repository.AIChatSessionRepository;
import com.vetscue.api.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/chat")
public class AIChatController {

    @Autowired
    private AIChatSessionRepository chatSessionRepository;

    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter handleChat(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body) {

        SseEmitter emitter = new SseEmitter(180000L); // 3-minute timeout
        String message = body.get("message");

        if (message == null || message.trim().isEmpty()) {
            try {
                emitter.send(SseEmitter.event().data("Message is required"));
                emitter.complete();
            } catch (Exception ignored) {}
            return emitter;
        }

        CompletableFuture.runAsync(() -> {
            try {
                AIChatSession session = chatSessionRepository.findByUserId(currentUser.getId())
                        .orElseGet(() -> AIChatSession.builder()
                                .userId(currentUser.getId())
                                .messages(new ArrayList<>())
                                .build());

                String aiResponseText = "I am PawSaarthi VetsCue Assistant. " +
                        "For urgent animal medical emergencies, please submit a rescue request or contact a nearby verified hospital.";

                // Stream response in small chunks
                String[] words = aiResponseText.split(" ");
                for (String word : words) {
                    emitter.send(SseEmitter.event().data("{\"text\":\"" + word + " \"}"));
                    Thread.sleep(80);
                }

                session.getMessages().add(AIChatSession.ChatMessage.builder()
                        .role("user")
                        .content(message)
                        .timestamp(Instant.now())
                        .build());

                session.getMessages().add(AIChatSession.ChatMessage.builder()
                        .role("ai")
                        .content(aiResponseText)
                        .timestamp(Instant.now())
                        .build());

                if (session.getMessages().size() > 20) {
                    session.setMessages(session.getMessages().subList(session.getMessages().size() - 20, session.getMessages().size()));
                }

                session.setLastUpdated(Instant.now());
                chatSessionRepository.save(session);

                emitter.send(SseEmitter.event().data("[DONE]"));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(@AuthenticationPrincipal UserPrincipal currentUser) {
        Optional<AIChatSession> sessionOpt = chatSessionRepository.findByUserId(currentUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "messages", sessionOpt.map(AIChatSession::getMessages).orElseGet(ArrayList::new)
        ));
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearChatHistory(@AuthenticationPrincipal UserPrincipal currentUser) {
        chatSessionRepository.deleteByUserId(currentUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Chat history cleared"));
    }
}
