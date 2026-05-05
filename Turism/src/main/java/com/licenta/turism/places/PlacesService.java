package com.licenta.turism.places;

import com.licenta.turism.places.dto.TourismPlaceDto;
import com.licenta.turism.places.entity.Place;
import com.licenta.turism.places.repository.PlaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

/**
 * Serviciu cu strategie cache-aside:
 *   1. Cauta in DB (PostGIS) locuri in raza ceruta cu cache valid.
 *   2. Daca rezultatele sunt insuficiente, fetch din Overpass si salveaza in DB.
 *   3. Returneaza ce gaseste in DB.
 */
@Service
public class PlacesService {

    private static final Logger log = LoggerFactory.getLogger(PlacesService.class);

    private final PlaceRepository repository;
    private final OverpassService overpassService;

    @Value("${overpass.cache.ttl-days:7}")
    private int cacheTtlDays;

    public PlacesService(PlaceRepository repository, OverpassService overpassService) {
        this.repository = repository;
        this.overpassService = overpassService;
    }

    @Transactional
    public List<TourismPlaceDto> searchNearby(Double latitude,
                                              Double longitude,
                                              Integer radius,
                                              Integer size,
                                              String keyword,
                                              String type) {
        int safeRadius = (radius == null || radius <= 0) ? 3000 : Math.min(radius, 50000);
        int safeSize = (size == null || size <= 0) ? 10 : Math.min(size, 20);
        String primaryType = StringUtils.hasText(type) ? type.toLowerCase(Locale.ROOT) : null;
        Instant cacheValidSince = Instant.now().minus(cacheTtlDays, ChronoUnit.DAYS);

        // 1. Verific cache-ul DB (PostGIS spatial query)
        long cached = repository.countNearby(latitude, longitude, safeRadius, primaryType, cacheValidSince);
        log.debug("Cache hit count for ({}, {}, r={}, type={}): {}",
                latitude, longitude, safeRadius, primaryType, cached);

        // 2. Daca cache-ul are mai putin de jumatate din ce s-a cerut, refresh
        if (cached < Math.max(safeSize / 2, 3)) {
            log.info("Cache insuficient ({}), fetch din Overpass pentru ({}, {})",
                    cached, latitude, longitude);
            refreshFromOverpass(latitude, longitude, safeRadius, primaryType);
        }

        // 3. Returnez din DB ce gasesc dupa eventualul refresh
        List<Place> places = repository.findNearby(
                latitude, longitude, safeRadius, primaryType, cacheValidSince, safeSize);

        // 4. Filtrez optional dupa keyword (in nume/adresa)
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.toLowerCase(Locale.ROOT);
            places = places.stream()
                    .filter(p -> matchesKeyword(p, kw))
                    .toList();
        }

        return places.stream().map(this::toDto).toList();
    }

    private void refreshFromOverpass(double lat, double lon, int radius, String primaryType) {
        List<Place> fetched = overpassService.fetchNearby(lat, lon, radius, primaryType);
        if (fetched.isEmpty()) return;

        // Save sau update — in practica osm_id e stabil deci save-ul peste un id existent face update
        for (Place place : fetched) {
            try {
                repository.save(place);
            } catch (Exception e) {
                log.warn("Esec save place {}: {}", place.getOsmId(), e.getMessage());
            }
        }
        log.info("Salvate {} locuri in cache", fetched.size());
    }

    private boolean matchesKeyword(Place p, String keyword) {
        return (p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(keyword))
                || (p.getAddress() != null && p.getAddress().toLowerCase(Locale.ROOT).contains(keyword));
    }

    private TourismPlaceDto toDto(Place p) {
        String mapsUrl = "https://www.openstreetmap.org/" + p.getOsmId();
        return new TourismPlaceDto(
                p.getOsmId(),
                p.getName(),
                p.getAddress(),
                null, // OSM nu are rating
                null, // OSM nu are review count
                p.getTypes() != null ? p.getTypes() : List.of(),
                p.getLatitude(),
                p.getLongitude(),
                mapsUrl,
                null  // OSM nu are imagini
        );
    }
}
