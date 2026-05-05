package com.licenta.turism.messaging;

import com.licenta.turism.places.dto.TourismPlaceDto;

import java.util.List;

public record TurismPlacesResponse(List<TourismPlaceDto> places) {}
