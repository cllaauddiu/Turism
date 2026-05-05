package com.licenta.chatbox.support.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "support_sessions")
public class SupportSession {

    @Id
    private String id;
    private String clientUsername;
    private Instant createdAt;
    private Instant lastMessageAt;
    private String status;

    @Transient
    private List<SupportMessage> messages = new ArrayList<>();

    protected SupportSession() {
    }

    public SupportSession(String clientUsername) {
        this.id = UUID.randomUUID().toString();
        this.clientUsername = clientUsername;
        this.createdAt = Instant.now();
        this.lastMessageAt = this.createdAt;
        this.status = "OPEN";
    }

    public String getId() { return id; }
    public String getClientUsername() { return clientUsername; }
    public List<SupportMessage> getMessages() { return messages; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public String getStatus() { return status; }

    public void addMessage(SupportMessage message) {
        messages.add(message);
        lastMessageAt = message.getCreatedAt();
    }

    public void close() {
        this.status = "CLOSED";
    }
}
