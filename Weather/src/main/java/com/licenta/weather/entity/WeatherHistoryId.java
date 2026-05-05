package com.licenta.weather.entity;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

public class WeatherHistoryId implements Serializable {

    private Instant recordedAt;
    private String city;

    public WeatherHistoryId() {
    }

    public WeatherHistoryId(Instant recordedAt, String city) {
        this.recordedAt = recordedAt;
        this.city = city;
    }

    public Instant getRecordedAt() { return recordedAt; }
    public String getCity() { return city; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WeatherHistoryId that)) return false;
        return Objects.equals(recordedAt, that.recordedAt) && Objects.equals(city, that.city);
    }

    @Override
    public int hashCode() {
        return Objects.hash(recordedAt, city);
    }
}
