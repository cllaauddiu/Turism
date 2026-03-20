package com.licenta.chatbox.dto;

public record AiGenerateResponse(
        String response,
        String model,
        String prompt
) {
}

