package com.licenta.weather.controller;

import com.licenta.weather.dto.WeatherResponse;
import com.licenta.weather.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/weather")
@CrossOrigin(origins = "*")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    /**
     * GET /weather?lat=44.4268&lon=26.1025
     * Returns current weather data for the given coordinates.
     */
    @GetMapping
    public ResponseEntity<WeatherResponse> getWeather(
            @RequestParam double lat,
            @RequestParam double lon) {
        WeatherResponse weather = weatherService.getWeather(lat, lon);
        return ResponseEntity.ok(weather);
    }
}

