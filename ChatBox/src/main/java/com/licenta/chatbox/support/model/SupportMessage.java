package com.licenta.chatbox.support.model;

import java.time.Instant;
import java.util.UUID;

public record SupportMessage(
        String id,
        String sessionId,
        String senderUsername,
        String senderRole,
        String content,
        Instant createdAt
) {
    public static SupportMessage create(String sessionId, String senderUsername, String senderRole, String content) {
        return new SupportMessage(
                UUID.randomUUID().toString(),
                sessionId,
                senderUsername,
                senderRole,
                content,
                Instant.now()
        );
    }
}
