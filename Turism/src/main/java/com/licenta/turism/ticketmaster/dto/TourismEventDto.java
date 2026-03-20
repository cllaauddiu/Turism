package com.licenta.turism.ticketmaster.dto;

public record TourismEventDto(
        String id,
        String name,
        String url,
        String date,
        String time,
        String venue,
        String city,
        String imageUrl
) {
}

