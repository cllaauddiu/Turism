package com.licenta.games.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressDTO {
    private long totalZones;
    private long unlockedZones;
    private long activeRiddles;
    private String lastUnlockedZone;
    private int score; // points: 10 per easy, 20 per medium, 30 per hard
}

