package com.licenta.chatbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank(message = "Mesajul nu poate fi gol.")
        @Size(max = 4000, message = "Mesajul depaseste limita de 4000 de caractere.")
        String message
) {
}

