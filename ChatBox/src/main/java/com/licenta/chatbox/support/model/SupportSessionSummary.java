package com.licenta.chatbox.support.model;

import java.time.Instant;

public record SupportSessionSummary(
        String id,
        String clientUsername,
        Instant createdAt,
        Instant lastMessageAt,
        String status,
        int messageCount,
        String lastMessagePreview
) {
    public static SupportSessionSummary from(SupportSession session) {
        var msgs = session.getMessages();
        String preview = msgs.isEmpty() ? "" : msgs.get(msgs.size() - 1).content();
        if (preview.length() > 80) preview = preview.substring(0, 80) + "...";
        return new SupportSessionSummary(
                session.getId(),
                session.getClientUsername(),
                session.getCreatedAt(),
                session.getLastMessageAt(),
                session.getStatus(),
                msgs.size(),
                preview
        );
    }
}
