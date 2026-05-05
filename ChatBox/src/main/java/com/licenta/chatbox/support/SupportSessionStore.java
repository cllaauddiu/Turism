package com.licenta.chatbox.support;

import com.licenta.chatbox.support.model.SupportMessage;
import com.licenta.chatbox.support.model.SupportSession;
import com.licenta.chatbox.support.repository.SupportMessageRepository;
import com.licenta.chatbox.support.repository.SupportSessionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
@Transactional
public class SupportSessionStore {

    private final SupportSessionRepository sessionRepository;
    private final SupportMessageRepository messageRepository;

    public SupportSessionStore(SupportSessionRepository sessionRepository, SupportMessageRepository messageRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }

    public SupportSession createForClient(String clientUsername) {
        SupportSession session = new SupportSession(clientUsername);
        return sessionRepository.save(session);
    }

    public Optional<SupportSession> get(String sessionId) {
        Optional<SupportSession> s = sessionRepository.findById(sessionId);
        s.ifPresent(session -> {
            session.getMessages().clear();
            session.getMessages().addAll(messageRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId));
        });
        return s;
    }

    public Optional<SupportSession> findActiveByClient(String clientUsername) {
        Optional<SupportSession> s = sessionRepository.findFirstByClientUsernameAndStatus(clientUsername, "OPEN");
        s.ifPresent(session -> {
            session.getMessages().clear();
            session.getMessages().addAll(messageRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId()));
        });
        return s;
    }

    public Collection<SupportSession> all() {
        List<SupportSession> sessions = sessionRepository.findAllByOrderByLastMessageAtDesc();
        sessions.forEach(session -> {
            session.getMessages().clear();
            session.getMessages().addAll(messageRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId()));
        });
        return sessions;
    }

    public void addMessage(String sessionId, SupportMessage message) {
        Optional<SupportSession> s = sessionRepository.findById(sessionId);
        if (s.isPresent()) {
            SupportSession session = s.get();
            messageRepository.save(message);
            session.addMessage(message);
            sessionRepository.save(session);
        }
    }

    public boolean close(String sessionId) {
        Optional<SupportSession> s = sessionRepository.findById(sessionId);
        if (s.isEmpty()) return false;
        SupportSession session = s.get();
        session.close();
        sessionRepository.save(session);
        return true;
    }

    public List<SupportMessage> getMessages(String sessionId) {
        return messageRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
    }
}
