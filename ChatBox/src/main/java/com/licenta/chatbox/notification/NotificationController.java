package com.licenta.chatbox.notification;

import com.licenta.chatbox.security.StompPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);
    private final SimpMessagingTemplate broker;

    public NotificationController(SimpMessagingTemplate broker) {
        this.broker = broker;
    }

    @MessageMapping("/notify/send")
    public void sendNotification(@Payload NotificationPayload payload, Principal principal) {
        StompPrincipal user = requirePrincipal(principal);
        log.info("Received notification request from {} for {}", user.getName(), payload.title());

        NotificationEvent event = new NotificationEvent(
                payload.type(),
                payload.title(),
                payload.message(),
                System.currentTimeMillis()
        );

        broker.convertAndSendToUser(user.getName(), "/queue/notifications", event);
    }

    private StompPrincipal requirePrincipal(Principal principal) {
        if (!(principal instanceof StompPrincipal sp)) {
            throw new IllegalStateException("WebSocket message without authenticated principal");
        }
        return sp;
    }
}

