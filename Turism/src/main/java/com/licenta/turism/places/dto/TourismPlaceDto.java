package com.licenta.turism.places.dto;

import java.util.List;

public record TourismPlaceDto(
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

