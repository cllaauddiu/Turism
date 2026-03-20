package com.licenta.chatbox.dto;

import java.util.List;

public record HolidayAiPayload(
        List<HolidayAiOption> recommendations
) {
    public record HolidayAiOption(
            String destinationCity,
            String destinationCountry,
            String title,
            String reason,
            String bestSeason,
            String estimatedBudget,
            String suggestedDuration,
            String climate,
            String pace,
            List<String> highlights,
            Double latitude,
            Double longitude
    ) {
    }
}

