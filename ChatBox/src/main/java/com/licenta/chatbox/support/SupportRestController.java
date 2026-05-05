package com.licenta.chatbox.support;

import com.licenta.chatbox.security.AuthHelper;
import com.licenta.chatbox.security.StompPrincipal;
import com.licenta.chatbox.support.model.SupportMessage;
import com.licenta.chatbox.support.model.SupportSession;
import com.licenta.chatbox.support.model.SupportSessionSummary;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chatbox/support")
@CrossOrigin(origins = "*")
public class SupportRestController {

    private final SupportSessionStore store;
    private final AuthHelper authHelper;

    public SupportRestController(SupportSessionStore store, AuthHelper authHelper) {
        this.store = store;
        this.authHelper = authHelper;
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SupportSessionSummary>> listSessions(HttpServletRequest request) {
        authHelper.requireAdmin(request);
        List<SupportSessionSummary> summaries = store.all().stream()
                .map(SupportSessionSummary::from)
                .toList();
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<SupportMessage>> getMessages(@PathVariable String sessionId, HttpServletRequest request) {
        StompPrincipal user = authHelper.requireUser(request);
        SupportSession session = store.get(sessionId)
                .orElseThrow(() -> new AuthHelper.UnauthorizedException("Session not found"));

        if (!user.isAdmin() && !session.getClientUsername().equals(user.getName())) {
            throw new AuthHelper.UnauthorizedException("You cannot access this session");
        }

        return ResponseEntity.ok(store.getMessages(sessionId));
    }

    @GetMapping("/sessions/me")
    public ResponseEntity<SupportSessionSummary> getMyActiveSession(HttpServletRequest request) {
        StompPrincipal user = authHelper.requireUser(request);
        return store.findActiveByClient(user.getName())
                .map(s -> ResponseEntity.ok(SupportSessionSummary.from(s)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
