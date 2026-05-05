package com.licenta.chatbox.support.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

public class SupportSession {

    private final String id;
    private final String clientUsername;
    private final List<SupportMessage> messages;
    private final Instant createdAt;
    private volatile Instant lastMessageAt;
    private volatile String status;

    public SupportSession(String clientUsername) {
        this.id = UUID.randomUUID().toString();
        this.clientUsername = clientUsername;
        this.messages = new CopyOnWriteArrayList<>();
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
        lastMessageAt = message.createdAt();
    }

    public void close() {
        this.status = "CLOSED";
    }
}
