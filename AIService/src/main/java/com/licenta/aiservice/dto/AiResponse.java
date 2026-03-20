package com.licenta.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {

    /** Textul generat de Gemini. */
    private String response;

    /** Modelul folosit (ex: gemini-2.0-flash). */
    private String model;

    /** Promptul original trimis. */
    private String prompt;
}

