package com.licenta.turism.ticketmaster;

import com.licenta.turism.ticketmaster.dto.TicketmasterApiResponse;
import com.licenta.turism.ticketmaster.dto.TourismEventDto;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Comparator;
import java.util.List;

@Service
public class TicketmasterService {

    private final RestTemplate restTemplate;
    private final TicketmasterProperties properties;

    public TicketmasterService(TicketmasterProperties properties) {
        this.restTemplate = new RestTemplate();
        this.properties = properties;
    }

    public List<TourismEventDto> searchEvents(String keyword,
                                              String city,
                                              Double latitude,
                                              Double longitude,
                                              Integer radius,
                                              Integer size) {
        if (!StringUtils.hasText(properties.getKey())) {
            throw new MissingApiKeyException();
        }

        int safeRadius = radius == null || radius <= 0 ? 30 : radius;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 200);

        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                    .path("/events.json")
                    .queryParam("apikey", properties.getKey())
                    .queryParam("radius", safeRadius)
                    .queryParam("size", safeSize)
                    .queryParam("unit", "km");

            if (StringUtils.hasText(keyword)) {
                uriBuilder.queryParam("keyword", keyword);
            }
            if (StringUtils.hasText(city)) {
                uriBuilder.queryParam("city", city);
            }
            if (latitude != null && longitude != null) {
                uriBuilder.queryParam("latlong", latitude + "," + longitude);
            }
            if (StringUtils.hasText(properties.getDefaultCountryCode())) {
                uriBuilder.queryParam("countryCode", properties.getDefaultCountryCode());
            }

            TicketmasterApiResponse response = restTemplate.getForObject(
                    uriBuilder.build(true).toUri(),
                    TicketmasterApiResponse.class
            );

            if (response == null) {
                return List.of();
            }

            return response.events().stream().map(this::toEventDto).toList();
        } catch (RestClientException ex) {
            throw new TicketmasterIntegrationException("Ticketmaster API request failed", ex);
        }
    }

    private TourismEventDto toEventDto(TicketmasterApiResponse.Event event) {
        String date = event.dates() != null && event.dates().start() != null ? event.dates().start().localDate() : null;
        String time = event.dates() != null && event.dates().start() != null ? event.dates().start().localTime() : null;

        String venueName = null;
        String cityName = null;
        if (event.embedded() != null && event.embedded().venues() != null && !event.embedded().venues().isEmpty()) {
            TicketmasterApiResponse.Venue firstVenue = event.embedded().venues().getFirst();
            venueName = firstVenue.name();
            cityName = firstVenue.city() != null ? firstVenue.city().name() : null;
        }

        String imageUrl = event.images() == null ? null : event.images().stream()
                .filter(image -> image.url() != null)
                .max(Comparator.comparing(image -> image.width() == null ? 0 : image.width()))
                .map(TicketmasterApiResponse.Image::url)
                .orElse(null);

        return new TourismEventDto(event.id(), event.name(), event.url(), date, time, venueName, cityName, imageUrl);
    }
}


