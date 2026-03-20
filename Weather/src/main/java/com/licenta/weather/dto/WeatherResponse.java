package com.licenta.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {

    // Location
    private String resolvedAddress;

    // Current conditions
    private Double temperature;       // °C
    private Double feelsLike;         // °C
    private Double humidity;          // %
    private Double windSpeed;         // km/h
    private Double windDirection;     // degrees
    private String windDirectionLabel;// N, NE, E, SE, S, SW, W, NW
    private Double uvIndex;
    private Double visibility;        // km
    private Double cloudCover;        // %
    private Double precipProbability; // %
    private Double pressure;          // hPa
    private Double dewPoint;          // °C
    private String conditions;        // e.g. "Partly cloudy"
    private String icon;              // e.g. "partly-cloudy-day"
    private String description;       // daily description

    // Today summary
    private Double tempMax;           // °C
    private Double tempMin;           // °C
    private String sunrise;           // HH:mm
    private String sunset;            // HH:mm
}

