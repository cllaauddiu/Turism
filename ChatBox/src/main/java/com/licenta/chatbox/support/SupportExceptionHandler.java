package com.licenta.chatbox.support;

import com.licenta.chatbox.security.AuthHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "com.licenta.chatbox.support")
public class SupportExceptionHandler {

    @ExceptionHandler(AuthHelper.UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(AuthHelper.UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
    }
}
