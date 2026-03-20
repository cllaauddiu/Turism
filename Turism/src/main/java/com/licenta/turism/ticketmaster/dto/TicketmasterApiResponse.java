package com.licenta.turism.ticketmaster.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TicketmasterApiResponse(
        @JsonProperty("_embedded") Embedded embedded
) {

    public List<Event> events() {
        if (embedded == null || embedded.events() == null) {
            return List.of();
        }
        return embedded.events();
    }

    public record Embedded(List<Event> events) {
    }

    public record Event(
            String id,
            String name,
            String url,
            Dates dates,
            @JsonProperty("_embedded") EventEmbedded embedded,
            List<Image> images
    ) {
    }

    public record Dates(Start start) {
    }

    public record Start(String localDate, String localTime) {
    }

    public record EventEmbedded(List<Venue> venues) {
    }

    public record Venue(String name, City city) {
    }

    public record City(String name) {
    }

    public record Image(String url, Integer width) {
    }
}

