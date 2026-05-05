package com.licenta.weather.controller;

import com.licenta.weather.config.City;
import com.licenta.weather.dto.CityDTO;
import com.licenta.weather.dto.WeatherHistoryDTO;
import com.licenta.weather.dto.WeatherResponse;
import com.licenta.weather.service.WeatherHistoryService;
import com.licenta.weather.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/weather")
@CrossOrigin(origins = "*")
public class WeatherController {

    private final WeatherService weatherService;
    private final WeatherHistoryService historyService;

    public WeatherController(WeatherService weatherService, WeatherHistoryService historyService) {
        this.weatherService = weatherService;
        this.historyService = historyService;
    }

    /**
     * GET /weather?lat=44.4268&lon=26.1025
     */
    @GetMapping
    public ResponseEntity<WeatherResponse> getWeather(
            @RequestParam double lat,
            @RequestParam double lon) {
        return ResponseEntity.ok(weatherService.getWeather(lat, lon));
    }

    /**
     * GET /weather/cities
     * Lista celor 20 de orase urmarite.
     */
    @GetMapping("/cities")
    public ResponseEntity<List<CityDTO>> getCities() {
        List<CityDTO> cities = City.TRACKED_CITIES.stream()
                .map(c -> new CityDTO(c.name(), c.country(), c.latitude(), c.longitude()))
                .toList();
        return ResponseEntity.ok(cities);
    }

    /**
     * GET /weather/history?cities=Paris,Tokyo&days=30
     */
    @GetMapping("/history")
    public ResponseEntity<List<WeatherHistoryDTO>> getHistory(
            @RequestParam List<String> cities,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(historyService.getHistory(cities, days));
    }
}
