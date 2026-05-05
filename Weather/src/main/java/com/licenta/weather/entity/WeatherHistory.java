package com.licenta.weather.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "weather_history")
@IdClass(WeatherHistoryId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherHistory {

    @Id
    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Id
    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "feels_like")
    private Double feelsLike;

    @Column(name = "humidity")
    private Double humidity;

    @Column(name = "wind_speed")
    private Double windSpeed;

    @Column(name = "wind_direction")
    private Double windDirection;

    @Column(name = "wind_direction_label", length = 10)
    private String windDirectionLabel;

    @Column(name = "uv_index")
    private Double uvIndex;

    @Column(name = "visibility")
    private Double visibility;

    @Column(name = "cloud_cover")
    private Double cloudCover;

    @Column(name = "precip_probability")
    private Double precipProbability;

    @Column(name = "pressure")
    private Double pressure;

    @Column(name = "dew_point")
    private Double dewPoint;

    @Column(name = "conditions", length = 100)
    private String conditions;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "temp_max")
    private Double tempMax;

    @Column(name = "temp_min")
    private Double tempMin;

    @Column(name = "sunrise", length = 20)
    private String sunrise;

    @Column(name = "sunset", length = 20)
    private String sunset;
}
