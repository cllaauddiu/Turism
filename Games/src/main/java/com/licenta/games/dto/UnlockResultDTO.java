package com.licenta.games.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnlockResultDTO {
    private boolean success;
    private String message;
    private String landmarkDescription;
    private String zoneName;
    private String emoji;
    private Long zoneId;
    /** Only present when success=false and player has used a riddle attempt */
    private String hint;
}

