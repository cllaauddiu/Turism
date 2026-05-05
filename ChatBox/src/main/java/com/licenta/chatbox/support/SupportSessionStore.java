package com.licenta.chatbox.support;

import com.licenta.chatbox.support.model.SupportMessage;
import com.licenta.chatbox.support.model.SupportSession;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class SupportSessionStore {

    private final ConcurrentMap<String, SupportSession> sessions = new ConcurrentHashMap<>();

    public SupportSession createForClient(String clientUsername) {
        SupportSession session = new SupportSession(clientUsername);
        sessions.put(session.getId(), session);
        return session;
    }

    public Optional<SupportSession> get(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    public Optional<SupportSession> findActiveByClient(String clientUsername) {
        return sessions.values().stream()
                .filter(s -> "OPEN".equals(s.getStatus()))
                .filter(s -> s.getClientUsername().equals(clientUsername))
                .findFirst();
    }

    public Collection<SupportSession> all() {
        return sessions.values().stream()
                .sorted(Comparator.comparing(SupportSession::getLastMessageAt).reversed())
                .toList();
    }

    public void addMessage(String sessionId, SupportMessage message) {
        SupportSession session = sessions.get(sessionId);
        if (session != null) session.addMessage(message);
    }

    public boolean close(String sessionId) {
        SupportSession session = sessions.get(sessionId);
        if (session == null) return false;
        session.close();
        return true;
    }

    public List<SupportMessage> getMessages(String sessionId) {
        SupportSession session = sessions.get(sessionId);
        return session == null ? List.of() : List.copyOf(session.getMessages());
    }
}
