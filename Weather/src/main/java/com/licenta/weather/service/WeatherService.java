package com.licenta.weather.service;

import com.licenta.weather.dto.WeatherResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    @Value("${visualcrossing.api.key}")
    private String apiKey;

    @Value("${visualcrossing.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public WeatherResponse getWeather(double lat, double lon) {
        String location = lat + "," + lon;

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/" + location + "/today")
                .queryParam("unitGroup", "metric")
                .queryParam("include", "current,days")
                .queryParam("key", apiKey)
                .queryParam("contentType", "json")
                .toUriString();

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        if (response == null) {
            throw new RuntimeException("Empty response from Visual Crossing API");
        }

        // Parse current conditions
        Map<String, Object> current = (Map<String, Object>) response.get("currentConditions");
        // Parse today's day summary
        List<Map<String, Object>> days = (List<Map<String, Object>>) response.get("days");
        Map<String, Object> today = (days != null && !days.isEmpty()) ? days.get(0) : Map.of();

        String resolvedAddress = (String) response.getOrDefault("resolvedAddress", location);
        String description = (String) today.getOrDefault("description", "");

        double tempC = toDouble(current.get("temp"));
        double feelsLike = toDouble(current.get("feelslike"));
        double humidity = toDouble(current.get("humidity"));
        double windSpeed = toDouble(current.get("windspeed"));
        double windDir = toDouble(current.get("winddir"));
        double uvIndex = toDouble(current.get("uvindex"));
        double visibility = toDouble(current.get("visibility"));
        double cloudCover = toDouble(current.get("cloudcover"));
        double precipProb = toDouble(current.get("precipprob"));
        double pressure = toDouble(current.get("pressure"));
        double dewPoint = toDouble(current.get("dew"));
        String conditions = (String) current.getOrDefault("conditions", "");
        String icon = (String) current.getOrDefault("icon", "");

        double tempMax = toDouble(today.get("tempmax"));
        double tempMin = toDouble(today.get("tempmin"));
        String sunrise = (String) today.getOrDefault("sunrise", "");
        String sunset = (String) today.getOrDefault("sunset", "");

        return WeatherResponse.builder()
                .resolvedAddress(resolvedAddress)
                .temperature(tempC)
                .feelsLike(feelsLike)
                .humidity(humidity)
                .windSpeed(windSpeed)
                .windDirection(windDir)
                .windDirectionLabel(degreesToDirection(windDir))
                .uvIndex(uvIndex)
                .visibility(visibility)
                .cloudCover(cloudCover)
                .precipProbability(precipProb)
                .pressure(pressure)
                .dewPoint(dewPoint)
                .conditions(conditions)
                .icon(icon)
                .description(description)
                .tempMax(tempMax)
                .tempMin(tempMin)
                .sunrise(sunrise)
                .sunset(sunset)
                .build();
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

