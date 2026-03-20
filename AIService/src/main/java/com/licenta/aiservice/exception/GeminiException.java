package com.licenta.aiservice.exception;

/**
 * Aruncata cand Google Gemini API returneaza o eroare sau nu raspunde.
 */
public class GeminiException extends RuntimeException {

    private final int statusCode;

    public GeminiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public GeminiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 503;
    }

    public int getStatusCode() {
        return statusCode;
    }
}

