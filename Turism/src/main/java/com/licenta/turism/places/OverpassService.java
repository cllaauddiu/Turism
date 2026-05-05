package com.licenta.turism.places;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.licenta.turism.places.entity.Place;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Apeleaza Overpass API (https://overpass-api.de) — gratuit, fara API key.
 * Returneaza date OpenStreetMap pentru locuri turistice.
 */
@Service
public class OverpassService {

    private static final Logger log = LoggerFactory.getLogger(OverpassService.class);

    @Value("${overpass.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Mapare tip "logic" -> filtre OSM.
     * Cheile sunt cele acceptate de la frontend (ex: "restaurant", "museum", "hotel").
     */
    private static final Map<String, String> TYPE_FILTERS = Map.of(
            "restaurant",  "[\"amenity\"~\"restaurant|cafe|fast_food|pub|bar\"]",
            "hotel",       "[\"tourism\"~\"hotel|hostel|guest_house|motel|apartment\"]",
            "museum",      "[\"tourism\"~\"museum|gallery\"]",
            "attraction",  "[\"tourism\"~\"attraction|viewpoint|theme_park|zoo\"]",
            "historic",    "[\"historic\"]"
    );

    /**
     * Construieste lista de Place (NESALVATE in DB) pe baza unui apel Overpass.
     */
    public List<Place> fetchNearby(double lat, double lon, int radiusMeters, String type) {
        String query = buildQuery(lat, lon, radiusMeters, type);
        List<Place> results = new ArrayList<>();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<String> request = new HttpEntity<>("data=" + query, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(baseUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Overpass API returned non-2xx: {}", response.getStatusCode());
                return results;
            }

            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");
            if (elements == null || !elements.isArray()) {
                return results;
            }

            Instant now = Instant.now();
            for (JsonNode el : elements) {
                Place place = parseElement(el, now);
                if (place != null) {
                    results.add(place);
                }
            }
        } catch (Exception e) {
            log.error("Eroare apel Overpass: {}", e.getMessage());
        }

        return results;
    }

    private String buildQuery(double lat, double lon, int radius, String type) {
        StringBuilder sb = new StringBuilder("[out:json][timeout:25];(");

        String filter = type != null ? TYPE_FILTERS.get(type.toLowerCase()) : null;

        if (filter != null) {
            sb.append("node(around:").append(radius).append(",").append(lat).append(",").append(lon).append(")")
              .append(filter).append(";");
            sb.append("way(around:").append(radius).append(",").append(lat).append(",").append(lon).append(")")
              .append(filter).append(";");
        } else {
            // Fara filtru — toate POI-urile turistice + amenities populare
            for (String f : TYPE_FILTERS.values()) {
                sb.append("node(around:").append(radius).append(",").append(lat).append(",").append(lon).append(")")
                  .append(f).append(";");
            }
        }

        sb.append(");out body;");
        return sb.toString();
    }

    private Place parseElement(JsonNode el, Instant cachedAt) {
        String osmType = el.path("type").asText();
        long id = el.path("id").asLong();
        String osmId = osmType + "/" + id;

        // Coordonate: pentru "node" sunt direct in lat/lon, pentru "way" sunt in "center"
        double lat, lon;
        if (el.has("lat") && el.has("lon")) {
            lat = el.get("lat").asDouble();
            lon = el.get("lon").asDouble();
        } else if (el.has("center")) {
            lat = el.get("center").get("lat").asDouble();
            lon = el.get("center").get("lon").asDouble();
        } else {
            return null;
        }

        JsonNode tags = el.path("tags");
        if (tags.isMissingNode() || !tags.has("name")) {
            // Fara nume nu ne foloseste
            return null;
        }

        String name = tags.path("name").asText();
        String address = buildAddress(tags);
        String website = firstNonEmpty(tags, "website", "contact:website");
        String phone = firstNonEmpty(tags, "phone", "contact:phone");
        String openingHours = tags.path("opening_hours").asText(null);

        List<String> typeList = new ArrayList<>();
        String primaryType = null;
        for (String tagKey : List.of("amenity", "tourism", "historic", "shop")) {
            String value = tags.path(tagKey).asText(null);
            if (value != null && !value.isBlank()) {
                typeList.add(tagKey + "=" + value);
                if (primaryType == null) {
                    primaryType = mapToPrimaryType(tagKey, value);
                }
            }
        }
        // Cuisine ca tip auxiliar
        String cuisine = tags.path("cuisine").asText(null);
        if (cuisine != null && !cuisine.isBlank()) {
            typeList.add("cuisine=" + cuisine);
        }

        if (primaryType == null) {
            primaryType = "other";
        }

        return new Place(osmId, name, address, lat, lon, typeList, primaryType,
                website, phone, openingHours, cachedAt);
    }

    private String buildAddress(JsonNode tags) {
        String street = tags.path("addr:street").asText(null);
        String housenumber = tags.path("addr:housenumber").asText(null);
        String city = tags.path("addr:city").asText(null);

        StringBuilder sb = new StringBuilder();
        if (street != null) {
            sb.append(street);
            if (housenumber != null) sb.append(" ").append(housenumber);
        }
        if (city != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(city);
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    private String firstNonEmpty(JsonNode tags, String... keys) {
        for (String key : keys) {
            String value = tags.path(key).asText(null);
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private String mapToPrimaryType(String tagKey, String value) {
        return switch (tagKey) {
            case "amenity" -> switch (value) {
                case "restaurant", "cafe", "fast_food", "pub", "bar" -> "restaurant";
                default -> value;
            };
            case "tourism" -> switch (value) {
                case "hotel", "hostel", "guest_house", "motel", "apartment" -> "hotel";
                case "museum", "gallery" -> "museum";
                case "attraction", "viewpoint", "theme_park", "zoo" -> "attraction";
                default -> value;
            };
            case "historic" -> "historic";
            default -> value;
        };
    }
}
