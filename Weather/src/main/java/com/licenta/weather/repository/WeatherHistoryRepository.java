package com.licenta.weather.repository;

import com.licenta.weather.entity.WeatherHistory;
import com.licenta.weather.entity.WeatherHistoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface WeatherHistoryRepository extends JpaRepository<WeatherHistory, WeatherHistoryId> {

    @Query("SELECT w FROM WeatherHistory w " +
            "WHERE w.city IN :cities AND w.recordedAt >= :since " +
            "ORDER BY w.recordedAt ASC")
    List<WeatherHistory> findByCitiesSince(@Param("cities") List<String> cities,
                                           @Param("since") Instant since);

    @Query("SELECT DISTINCT w.city FROM WeatherHistory w ORDER BY w.city")
    List<String> findAllTrackedCities();
}
