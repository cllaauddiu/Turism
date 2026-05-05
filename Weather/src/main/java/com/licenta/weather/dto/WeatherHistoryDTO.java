package com.licenta.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherHistoryDTO {
    private Instant recordedAt;
    private String city;
    private String country;
    private Double temperature;
    private Double feelsLike;
    private Double humidity;
    private Double windSpeed;
    private Double uvIndex;
    private Double cloudCover;
    private Double precipProbability;
    private Double pressure;
    private String conditions;
    private String icon;
    private Double tempMax;
    private Double tempMin;
}
