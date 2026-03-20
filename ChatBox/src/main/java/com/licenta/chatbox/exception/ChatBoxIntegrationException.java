package com.licenta.chatbox.exception;

public class ChatBoxIntegrationException extends RuntimeException {

    public ChatBoxIntegrationException(String message) {
        super(message);
    }

    public ChatBoxIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

