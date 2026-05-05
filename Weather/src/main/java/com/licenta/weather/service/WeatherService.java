package com.licenta.weather.service;

import com.licenta.weather.dto.WeatherResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * Apeleaza Open-Meteo (https://open-meteo.com) — gratuit, fara API key.
 */
@Service
public class WeatherService {

    @Value("${openmeteo.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public WeatherResponse getWeather(double lat, double lon) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("latitude", lat)
                .queryParam("longitude", lon)
                .queryParam("current",
                        "temperature_2m,apparent_temperature,relative_humidity_2m," +
                        "wind_speed_10m,wind_direction_10m,uv_index,visibility," +
                        "cloud_cover,precipitation_probability,surface_pressure," +
                        "dew_point_2m,weather_code")
                .queryParam("daily",
                        "temperature_2m_max,temperature_2m_min,sunrise,sunset")
                .queryParam("wind_speed_unit", "kmh")
                .queryParam("timezone", "auto")
                .queryParam("forecast_days", 1)
                .toUriString();

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null) {
            throw new RuntimeException("Empty response from Open-Meteo API");
        }

        Map<String, Object> current = (Map<String, Object>) response.getOrDefault("current", Map.of());
        Map<String, Object> daily = (Map<String, Object>) response.getOrDefault("daily", Map.of());

        double temperature = toDouble(current.get("temperature_2m"));
        double feelsLike = toDouble(current.get("apparent_temperature"));
        double humidity = toDouble(current.get("relative_humidity_2m"));
        double windSpeed = toDouble(current.get("wind_speed_10m"));
        double windDir = toDouble(current.get("wind_direction_10m"));
        double uvIndex = toDouble(current.get("uv_index"));
        double visibilityMeters = toDouble(current.get("visibility"));
        double cloudCover = toDouble(current.get("cloud_cover"));
        double precipProb = toDouble(current.get("precipitation_probability"));
        double pressure = toDouble(current.get("surface_pressure"));
        double dewPoint = toDouble(current.get("dew_point_2m"));
        int weatherCode = (int) toDouble(current.get("weather_code"));

        // Daily array: extragem prima zi
        double tempMax = firstDouble(daily.get("temperature_2m_max"));
        double tempMin = firstDouble(daily.get("temperature_2m_min"));
        String sunrise = firstStringTime(daily.get("sunrise"));
        String sunset = firstStringTime(daily.get("sunset"));

        String conditions = WmoCodeMapper.toCondition(weatherCode);
        String icon = WmoCodeMapper.toIcon(weatherCode);

        // Open-Meteo returneaza locatia ca lat/lon — nu are reverse geocoding
        String resolvedAddress = String.format("%.4f, %.4f", lat, lon);

        return WeatherResponse.builder()
                .resolvedAddress(resolvedAddress)
                .temperature(temperature)
                .feelsLike(feelsLike)
                .humidity(humidity)
                .windSpeed(windSpeed)
                .windDirection(windDir)
                .windDirectionLabel(degreesToDirection(windDir))
                .uvIndex(uvIndex)
                .visibility(visibilityMeters / 1000.0) // m -> km
                .cloudCover(cloudCover)
                .precipProbability(precipProb)
                .pressure(pressure)
                .dewPoint(dewPoint)
                .conditions(conditions)
                .icon(icon)
                .description(conditions)
                .tempMax(tempMax)
                .tempMin(tempMin)
                .sunrise(sunrise)
                .sunset(sunset)
                .build();
    }

    @SuppressWarnings("unchecked")
    private double firstDouble(Object value) {
        if (value instanceof List<?> list && !list.isEmpty()) {
            return toDouble(list.get(0));
        }
        return 0.0;
    }

    @SuppressWarnings("unchecked")
    private String firstStringTime(Object value) {
        if (value instanceof List<?> list && !list.isEmpty() && list.get(0) != null) {
            String iso = list.get(0).toString();
            // Open-Meteo: "2026-05-06T05:42" — pastram doar HH:mm
            int tIdx = iso.indexOf('T');
            return tIdx > 0 ? iso.substring(tIdx + 1) : iso;
        }
        return "";
    }

    private double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(value.toString()); } catch (Exception e) { return 0.0; }
    }

    private String degreesToDirection(double degrees) {
        String[] dirs = {"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                         "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"};
        int index = (int) Math.round(degrees / 22.5) % 16;
        return dirs[index];
    }
}
