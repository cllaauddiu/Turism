package com.licenta.games.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiddleDTO {
    private Long zoneId;
    private String zoneName;
    private String question;
    private String hint;
    private Integer difficulty;
    /** 4 variante de raspuns (A, B, C, D) */
    private List<String> options;
    /** Indexul raspunsului corect (0-3) — NU se trimite la frontend */
    // correctIndex este ascuns, validarea se face pe server
}
