package com.licenta.aiservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PromptRequest {

    @NotBlank(message = "Promptul nu poate fi gol.")
    @Size(max = 10000, message = "Promptul depaseste lungimea maxima de 10000 de caractere.")
    private String prompt;
}

