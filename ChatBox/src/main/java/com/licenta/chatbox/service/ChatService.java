package com.licenta.chatbox.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.licenta.chatbox.dto.AiGenerateRequest;
import com.licenta.chatbox.dto.AiGenerateResponse;
import com.licenta.chatbox.dto.ChatResponse;
import com.licenta.chatbox.dto.HolidayAiPayload;
import com.licenta.chatbox.dto.HolidayRecommendationRequest;
import com.licenta.chatbox.dto.HolidayRecommendationResponse;
import com.licenta.chatbox.dto.TurismEventDto;
import com.licenta.chatbox.dto.TurismPlaceDto;
import com.licenta.chatbox.exception.ChatBoxIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class ChatService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String aiServiceUrl;
    private final String turismServiceUrl;

    public ChatService(@Value("${ai.service.url}") String aiServiceUrl,
                       @Value("${turism.service.url}") String turismServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.aiServiceUrl = aiServiceUrl;
        this.turismServiceUrl = turismServiceUrl;
    }

    public ChatResponse ask(String message) {
        AiGenerateResponse body = generateWithAi(message);
        return new ChatResponse(body.response(), body.model(), body.prompt());
    }

    public HolidayRecommendationResponse recommendHoliday(HolidayRecommendationRequest request) {
        String prompt = buildHolidayPrompt(request);
        AiGenerateResponse aiResponse = generateWithAi(prompt);

        List<HolidayRecommendationResponse.HolidayOption> recommendations = mapHolidayRecommendations(
                aiResponse.response(),
                request.safeRecommendationsCount(),
                request.shouldEnrichWithTurismData()
        );

        return new HolidayRecommendationResponse(recommendations, aiResponse.model(), "ai+turism");
    }

    private AiGenerateResponse generateWithAi(String prompt) {
        String endpoint = aiServiceUrl + "/ai/generate";

        try {
            ResponseEntity<AiGenerateResponse> response = restTemplate.postForEntity(
                    endpoint,
                    new AiGenerateRequest(prompt),
                    AiGenerateResponse.class
            );

            AiGenerateResponse body = response.getBody();
            if (body == null || !StringUtils.hasText(body.response())) {
                throw new ChatBoxIntegrationException("AI service returned an empty response.");
            }
            return body;
        } catch (RestClientException ex) {
            throw new ChatBoxIntegrationException("ChatBox could not reach AI service.", ex);
        }
    }

    private String buildHolidayPrompt(HolidayRecommendationRequest request) {
        HolidayRecommendationRequest.LogisticsCriteria logistics = request.logistics();
        HolidayRecommendationRequest.ExperienceCriteria experience = request.experience();
        HolidayRecommendationRequest.ComfortCriteria comfort = request.comfort();

        return "You are a senior travel planner. " +
                "Return ONLY valid JSON with this exact schema: " +
                "{\"recommendations\":[{" +
                "\"destinationCity\":\"...\"," +
                "\"destinationCountry\":\"...\"," +
                "\"title\":\"...\"," +
                "\"reason\":\"...\"," +
                "\"bestSeason\":\"...\"," +
                "\"estimatedBudget\":\"...\"," +
                "\"suggestedDuration\":\"...\"," +
                "\"climate\":\"...\"," +
                "\"pace\":\"...\"," +
                "\"highlights\":[\"...\",\"...\"]," +
                "\"latitude\":0.0," +
                "\"longitude\":0.0}]} " +
                "and include max " + request.safeRecommendationsCount() + " recommendations. " +
                "Keep suggestions feasible and concise. " +
                "User criteria: " +
                "Budget=" + logistics.budget().label() + ", " +
                "Duration=" + logistics.duration().label() + ", " +
                "Distance/Region=" + logistics.distanceRegion().label() + ", " +
                "Companion=" + logistics.companion().label() + ", " +
                "Goal=" + experience.goal().label() + ", " +
                "Climate=" + experience.climate().label() + ", " +
                "Pace=" + experience.pace().label() + ", " +
                "Accommodation=" + comfort.accommodation().label() + ", " +
                "Gastronomy=" + comfort.gastronomy().label() + ", " +
                "Crowd preference=" + comfort.crowd().label() + ".";
    }

    private List<HolidayRecommendationResponse.HolidayOption> mapHolidayRecommendations(String rawAiText,
                                                                                         int maxCount,
                                                                                         boolean enrichWithTurism) {
        HolidayAiPayload payload = parseHolidayPayload(rawAiText);

        if (payload == null || payload.recommendations() == null || payload.recommendations().isEmpty()) {
            return List.of(
                    new HolidayRecommendationResponse.HolidayOption(
                            "N/A",
                            "N/A",
                            "Nu am putut genera recomandari structurate",
                            rawAiText,
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            "N/A",
                            List.of("Incearca din nou cu aceleasi criterii"),
                            null,
                            null,
                            List.of(),
                            List.of()
                    )
            );
        }

        return payload.recommendations().stream()
                .limit(maxCount)
                .map(option -> toHolidayOption(option, enrichWithTurism))
                .toList();
    }

    private HolidayRecommendationResponse.HolidayOption toHolidayOption(HolidayAiPayload.HolidayAiOption option,
                                                                        boolean enrichWithTurism) {
        List<TurismEventDto> events = List.of();
        List<TurismPlaceDto> places = List.of();

        if (enrichWithTurism) {
            events = fetchEvents(option.destinationCity());
            if (option.latitude() != null && option.longitude() != null) {
                places = fetchPlaces(option.latitude(), option.longitude());
            }
        }

        return new HolidayRecommendationResponse.HolidayOption(
                option.destinationCity(),
                option.destinationCountry(),
                option.title(),
                option.reason(),
                option.bestSeason(),
                option.estimatedBudget(),
                option.suggestedDuration(),
                option.climate(),
                option.pace(),
                option.highlights() == null ? List.of() : option.highlights(),
                option.latitude(),
                option.longitude(),
                events,
                places
        );
    }

    private List<TurismEventDto> fetchEvents(String city) {
        if (!StringUtils.hasText(city)) {
            return List.of();
        }

        try {
            var uri = UriComponentsBuilder.fromUriString(turismServiceUrl)
                    .path("/api/turism/events")
                    .queryParam("city", city)
                    .queryParam("size", 3)
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<TurismEventDto[]> response = restTemplate.getForEntity(uri, TurismEventDto[].class);
            TurismEventDto[] body = response.getBody();
            if (body == null) {
                return List.of();
            }

            return Arrays.stream(body)
                    .sorted(Comparator.comparing(event -> event.date() == null ? "9999-99-99" : event.date()))
                    .toList();
        } catch (RestClientException ex) {
            return List.of();
        }
    }

    private List<TurismPlaceDto> fetchPlaces(Double lat, Double lon) {
        try {
            var uri = UriComponentsBuilder.fromUriString(turismServiceUrl)
                    .path("/api/turism/places")
                    .queryParam("lat", lat)
                    .queryParam("lon", lon)
                    .queryParam("size", 3)
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<TurismPlaceDto[]> response = restTemplate.getForEntity(uri, TurismPlaceDto[].class);
            TurismPlaceDto[] body = response.getBody();
            return body == null ? List.of() : List.of(body);
        } catch (RestClientException ex) {
            return List.of();
        }
    }

    private HolidayAiPayload parseHolidayPayload(String rawAiText) {
        String json = extractJson(rawAiText);
        if (!StringUtils.hasText(json)) {
            return null;
        }

        try {
            return objectMapper.readValue(json, HolidayAiPayload.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private String extractJson(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }

        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        return text.substring(start, end + 1);
    }
}
