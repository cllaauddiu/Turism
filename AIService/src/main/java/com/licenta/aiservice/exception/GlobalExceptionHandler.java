package com.licenta.aiservice.exception;

import com.licenta.aiservice.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Erori de validare (@NotBlank, @Size etc.) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Bad Request", message));
    }

    /** Erori Gemini (API indisponibil, cheie invalida, etc.) */
    @ExceptionHandler(GeminiException.class)
    public ResponseEntity<ErrorResponse> handleGemini(GeminiException ex) {
        HttpStatus status = switch (ex.getStatusCode()) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401, 403 -> HttpStatus.UNAUTHORIZED;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            default -> HttpStatus.SERVICE_UNAVAILABLE;
        };

        return ResponseEntity
                .status(status)
                .body(new ErrorResponse(status.value(), status.getReasonPhrase(), ex.getMessage()));
    }

    /** Orice alta exceptie neasteptata */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "Internal Server Error",
                        "A aparut o eroare neasteptata: " + ex.getMessage()));
    }
}

