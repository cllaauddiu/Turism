package com.licenta.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResult {

    private String locationName;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private String confidence;
}
