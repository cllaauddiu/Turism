package com.licenta.chatbox.support;

import com.licenta.chatbox.security.StompPrincipal;
import com.licenta.chatbox.support.dto.SendMessagePayload;
import com.licenta.chatbox.support.dto.SessionEvent;
import com.licenta.chatbox.support.model.SupportMessage;
import com.licenta.chatbox.support.model.SupportSession;
import com.licenta.chatbox.support.model.SupportSessionSummary;
import com.licenta.chatbox.notification.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class SupportWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(SupportWebSocketController.class);

    private final SupportSessionStore store;
    private final SimpMessagingTemplate broker;

    public SupportWebSocketController(SupportSessionStore store, SimpMessagingTemplate broker) {
        this.store = store;
        this.broker = broker;
    }

    @MessageMapping("/support/start")
    public void startSession(Principal principal) {
        StompPrincipal user = requirePrincipal(principal);
        if (user.isAdmin()) {
            log.warn("Admin tried to start a support session: {}", user.getName());
            return;
        }

        SupportSession session = store.findActiveByClient(user.getName())
                .orElseGet(() -> store.createForClient(user.getName()));

        SupportSessionSummary summary = SupportSessionSummary.from(session);

        // Notify the client
        broker.convertAndSendToUser(user.getName(), "/queue/support/session",
                SessionEvent.created(summary));

        // Notify all admins of the new/active session
        broker.convertAndSend("/topic/admin/sessions", SessionEvent.created(summary));

        log.info("Support session ready: {} for client {}", session.getId(), user.getName());
    }

    @MessageMapping("/support/send")
    public void sendMessage(@Payload SendMessagePayload payload, Principal principal) {
        StompPrincipal user = requirePrincipal(principal);

        SupportSession session = store.get(payload.sessionId()).orElse(null);
        if (session == null) {
            log.warn("Message to non-existent session {}", payload.sessionId());
            return;
        }

        if ("CLOSED".equals(session.getStatus())) {
            log.warn("Message to closed session {}", session.getId());
            return;
        }

        if (!user.isAdmin() && !session.getClientUsername().equals(user.getName())) {
            log.warn("User {} cannot post to session {}", user.getName(), session.getId());
            return;
        }

        SupportMessage message = SupportMessage.create(
                session.getId(),
                user.getName(),
                user.isAdmin() ? "ADMIN" : "CLIENT",
                payload.content()
        );
        store.addMessage(session.getId(), message);

        // Broadcast to everyone subscribed to this session
        broker.convertAndSend("/topic/support/" + session.getId(), message);

        // Send Notification Event to the recipient
        if (user.isAdmin()) {
            broker.convertAndSendToUser(session.getClientUsername(), "/queue/notifications",
                new NotificationEvent("CHAT", "Mesaj Nou de la Admin", payload.content(), System.currentTimeMillis()));
        } else {
            broker.convertAndSend("/topic/admin/notifications",
                new NotificationEvent("CHAT", "Mesaj Nou de la " + user.getName(), payload.content(), System.currentTimeMillis()));
        }

        // Update admins' session list
        broker.convertAndSend("/topic/admin/sessions",
                SessionEvent.updated(SupportSessionSummary.from(session)));
    }

    @MessageMapping("/support/close")
    public void closeSession(@Payload String sessionId, Principal principal) {
        StompPrincipal user = requirePrincipal(principal);

        SupportSession session = store.get(sessionId).orElse(null);
        if (session == null) return;

        if (!user.isAdmin() && !session.getClientUsername().equals(user.getName())) {
            return;
        }

        store.close(sessionId);
        SupportSessionSummary summary = SupportSessionSummary.from(session);

        broker.convertAndSend("/topic/support/" + sessionId, SessionEvent.closed(summary));
        broker.convertAndSend("/topic/admin/sessions", SessionEvent.closed(summary));
    }

    private StompPrincipal requirePrincipal(Principal principal) {
        if (!(principal instanceof StompPrincipal sp)) {
            throw new IllegalStateException("WebSocket message without authenticated principal");
        }
        return sp;
    }
}
