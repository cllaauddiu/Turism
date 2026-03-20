package com.licenta.turism.places.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record GooglePlacesApiResponse(
        String error,
        @JsonProperty("local_results") List<LocalResult> localResults
) {
    public List<LocalResult> safeLocalResults() {
        return localResults == null ? List.of() : localResults;
    }

    public record LocalResult(
            @JsonProperty("place_id") String placeId,
            @JsonProperty("data_id") String dataId,
            String title,
            String address,
            Double rating,
            Integer reviews,
            String type,
            @JsonProperty("gps_coordinates") GpsCoordinates gpsCoordinates,
            String thumbnail,
            Links links
    ) {
    }

    public record GpsCoordinates(
            Double latitude,
            Double longitude
    ) {
    }

    public record Links(
            String directions
    ) {
    }
}

