package com.licenta.turism.messaging;

import com.licenta.turism.ticketmaster.dto.TourismEventDto;

import java.util.List;

public record TurismEventsResponse(List<TourismEventDto> events) {}
