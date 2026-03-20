package com.licenta.turism.places;

import com.licenta.turism.places.dto.GooglePlacesApiResponse;
import com.licenta.turism.places.dto.TourismPlaceDto;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
public class GooglePlacesService {

    private final RestTemplate restTemplate;
    private final GooglePlacesProperties properties;

    public GooglePlacesService(GooglePlacesProperties properties) {
        this.restTemplate = new RestTemplate();
        this.properties = properties;
    }

    public List<TourismPlaceDto> searchNearby(Double latitude,
                                              Double longitude,
                                              Integer radius,
                                              Integer size,
                                              String keyword,
                                              String type) {
        if (!StringUtils.hasText(properties.getKey())) {
            throw new MissingGooglePlacesApiKeyException();
        }

        int safeRadius = radius == null || radius <= 0 ? 3000 : Math.min(radius, 50000);
        int safeSize = size == null || size <= 0 ? 10 : Math.min(size, 20);

        try {
            String query = buildSearchQuery(keyword, type);
            int zoom = radiusToZoom(safeRadius);

            UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                    .queryParam("api_key", properties.getKey())
                    .queryParam("engine", "google_maps")
                    .queryParam("type", "search")
                    .queryParam("q", query)
                    .queryParam("ll", "@" + latitude + "," + longitude + "," + zoom + "z");

            if (StringUtils.hasText(properties.getDefaultLanguage())) {
                uriBuilder.queryParam("hl", properties.getDefaultLanguage());
            }

            GooglePlacesApiResponse response = restTemplate.getForObject(
                    uriBuilder.build().encode().toUri(),
                    GooglePlacesApiResponse.class
            );

            if (response == null) {
                return List.of();
            }
            if (StringUtils.hasText(response.error())) {
                throw new GooglePlacesIntegrationException(
                        "SerpApi request failed: " + response.error()
                );
            }

            return response.safeLocalResults().stream()
                    .limit(safeSize)
                    .map(this::toPlaceDto)
                    .toList();
        } catch (RestClientException ex) {
            throw new GooglePlacesIntegrationException("SerpApi request failed", ex);
        } catch (IllegalArgumentException ex) {
            throw new GooglePlacesIntegrationException("SerpApi request could not be built", ex);
        }
    }

    private String buildSearchQuery(String keyword, String type) {
        if (StringUtils.hasText(keyword) && StringUtils.hasText(type)) {
            return keyword + " " + type;
        }
        if (StringUtils.hasText(keyword)) {
            return keyword;
        }
        if (StringUtils.hasText(type)) {
            return type;
        }
        return "tourist attractions";
    }

    private int radiusToZoom(int radiusMeters) {
        if (radiusMeters <= 1000) return 15;
        if (radiusMeters <= 3000) return 14;
        if (radiusMeters <= 10000) return 13;
        if (radiusMeters <= 30000) return 11;
        return 10;
    }

    private TourismPlaceDto toPlaceDto(GooglePlacesApiResponse.LocalResult result) {
        Double lat = result.gpsCoordinates() != null
                ? result.gpsCoordinates().latitude()
                : null;
        Double lng = result.gpsCoordinates() != null
                ? result.gpsCoordinates().longitude()
                : null;

        String imageUrl = result.thumbnail();

        String mapsUrl = result.links() != null && StringUtils.hasText(result.links().directions())
                ? result.links().directions()
                : StringUtils.hasText(result.placeId())
                ? "https://www.google.com/maps/place/?q=place_id:" + result.placeId()
                : null;

        String placeId = StringUtils.hasText(result.placeId()) ? result.placeId() : result.dataId();
        List<String> types = StringUtils.hasText(result.type()) ? List.of(result.type()) : List.of();

        return new TourismPlaceDto(
                placeId,
                result.title(),
                result.address(),
                result.rating(),
                result.reviews(),
                types,
                lat,
                lng,
                mapsUrl,
                imageUrl
        );
    }
}

