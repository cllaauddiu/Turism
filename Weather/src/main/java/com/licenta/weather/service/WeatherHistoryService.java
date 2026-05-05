package com.licenta.weather.service;

import com.licenta.weather.dto.WeatherHistoryDTO;
import com.licenta.weather.entity.WeatherHistory;
import com.licenta.weather.repository.WeatherHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class WeatherHistoryService {

    private final WeatherHistoryRepository repository;

    public WeatherHistoryService(WeatherHistoryRepository repository) {
        this.repository = repository;
    }

    public List<WeatherHistoryDTO> getHistory(List<String> cities, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<WeatherHistory> records = repository.findByCitiesSince(cities, since);
        return records.stream().map(this::toDto).toList();
    }

    private WeatherHistoryDTO toDto(WeatherHistory w) {
        return WeatherHistoryDTO.builder()
                .recordedAt(w.getRecordedAt())
                .city(w.getCity())
                .country(w.getCountry())
                .temperature(w.getTemperature())
                .feelsLike(w.getFeelsLike())
                .humidity(w.getHumidity())
                .windSpeed(w.getWindSpeed())
                .uvIndex(w.getUvIndex())
                .cloudCover(w.getCloudCover())
                .precipProbability(w.getPrecipProbability())
                .pressure(w.getPressure())
                .conditions(w.getConditions())
                .icon(w.getIcon())
                .tempMax(w.getTempMax())
                .tempMin(w.getTempMin())
                .build();
    }
}
