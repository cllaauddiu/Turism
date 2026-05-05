package com.licenta.turism.ticketmaster;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class TicketmasterExceptionHandler {

    @ExceptionHandler(MissingApiKeyException.class)
    public ResponseEntity<Map<String, String>> handleMissingApiKey(MissingApiKeyException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(TicketmasterIntegrationException.class)
    public ResponseEntity<Map<String, String>> handleIntegrationError(TicketmasterIntegrationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage()));
    }
}
