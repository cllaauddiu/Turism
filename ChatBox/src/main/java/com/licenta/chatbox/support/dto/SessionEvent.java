package com.licenta.chatbox.support.dto;

import com.licenta.chatbox.support.model.SupportSessionSummary;

public record SessionEvent(String type, SupportSessionSummary session) {

    public static SessionEvent created(SupportSessionSummary session) {
        return new SessionEvent("CREATED", session);
    }

    public static SessionEvent updated(SupportSessionSummary session) {
        return new SessionEvent("UPDATED", session);
    }

    public static SessionEvent closed(SupportSessionSummary session) {
        return new SessionEvent("CLOSED", session);
    }
}
