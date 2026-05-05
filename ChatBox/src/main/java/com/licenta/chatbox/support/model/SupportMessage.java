package com.licenta.chatbox.support.model;

import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "support_messages")
public class SupportMessage {

    @Id
    private String id;
    private String sessionId;
    private String senderUsername;
    private String senderRole;
    private String content;
    private Instant createdAt;

    protected SupportMessage() {
    }

    public SupportMessage(String id, String sessionId, String senderUsername, String senderRole, String content, Instant createdAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.senderUsername = senderUsername;
        this.senderRole = senderRole;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getSessionId() { return sessionId; }
    public String getSenderUsername() { return senderUsername; }
    public String getSenderRole() { return senderRole; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }

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
