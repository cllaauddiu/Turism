package com.licenta.chatbox.dto;

import java.util.List;

public record HolidayRecommendationResponse(
        List<HolidayOption> recommendations,
        String model,
        String source
) {
    public record HolidayOption(
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
            Double longitude,
            List<TurismEventDto> events,
            List<TurismPlaceDto> places
    ) {
    }
}

