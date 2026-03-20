package com.licenta.chatbox.dto;

public record TurismEventDto(
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

