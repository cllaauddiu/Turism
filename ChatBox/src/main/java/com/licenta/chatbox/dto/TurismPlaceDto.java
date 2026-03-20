package com.licenta.chatbox.dto;

import java.util.List;

public record TurismPlaceDto(
        String id,
        String name,
        String address,
        Double rating,
        Integer userRatingsTotal,
        List<String> types,
        Double latitude,
        Double longitude,
        String googleMapsUrl,
        String imageUrl
) {
}

