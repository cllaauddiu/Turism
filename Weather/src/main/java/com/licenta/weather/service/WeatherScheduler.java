package com.licenta.weather.service;

import com.licenta.weather.config.City;
import com.licenta.weather.dto.WeatherResponse;
import com.licenta.weather.entity.WeatherHistory;
import com.licenta.weather.repository.WeatherHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class WeatherScheduler {

    private static final Logger log = LoggerFactory.getLogger(WeatherScheduler.class);

    private final WeatherService weatherService;
    private final WeatherHistoryRepository repository;

    public WeatherScheduler(WeatherService weatherService, WeatherHistoryRepository repository) {
        this.weatherService = weatherService;
        this.repository = repository;
    }

    /**
     * La pornirea containerului — fetch pentru toate cele 20 de orase.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void fetchOnStartup() {
        log.info("Pornire fetch initial pentru {} orase...", City.TRACKED_CITIES.size());
        fetchAllCities();
    }

    /**
     * In fiecare zi la miezul noptii — daca containerul este pornit.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void fetchDaily() {
        log.info("Fetch programat zilnic pentru {} orase...", City.TRACKED_CITIES.size());
        fetchAllCities();
    }

    private void fetchAllCities() {
        Instant now = Instant.now();
        int success = 0;
        int failed = 0;

        for (City city : City.TRACKED_CITIES) {
            try {
                WeatherResponse weather = weatherService.getWeather(city.latitude(), city.longitude());

                WeatherHistory record = WeatherHistory.builder()
                        .recordedAt(now)
                        .city(city.name())
                        .country(city.country())
                        .latitude(city.latitude())
                        .longitude(city.longitude())
                        .temperature(weather.getTemperature())
                        .feelsLike(weather.getFeelsLike())
                        .humidity(weather.getHumidity())
                        .windSpeed(weather.getWindSpeed())
                        .windDirection(weather.getWindDirection())
                        .windDirectionLabel(weather.getWindDirectionLabel())
                        .uvIndex(weather.getUvIndex())
                        .visibility(weather.getVisibility())
                        .cloudCover(weather.getCloudCover())
                        .precipProbability(weather.getPrecipProbability())
                        .pressure(weather.getPressure())
                        .dewPoint(weather.getDewPoint())
                        .conditions(weather.getConditions())
                        .icon(weather.getIcon())
                        .tempMax(weather.getTempMax())
                        .tempMin(weather.getTempMin())
                        .sunrise(weather.getSunrise())
                        .sunset(weather.getSunset())
                        .build();

                repository.save(record);
                success++;
                // Pauza scurta intre requesturi sa nu suprasolicitam Open-Meteo
                Thread.sleep(150);
            } catch (Exception e) {
                failed++;
                log.warn("Esec fetch pentru {}: {}", city.name(), e.getMessage());
            }
        }

        log.info("Fetch finalizat: {} reusite, {} esuate", success, failed);
    }
}
