package com.licenta.chatbox.dto;

public record ChatResponse(
        String answer,
        String model,
        String prompt
) {
}

