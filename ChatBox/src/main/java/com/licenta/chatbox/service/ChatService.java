package com.licenta.chatbox.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.licenta.chatbox.config.RabbitMQConfig;
import com.licenta.chatbox.dto.AiGenerateRequest;
import com.licenta.chatbox.dto.AiGenerateResponse;
import com.licenta.chatbox.dto.ChatResponse;
import com.licenta.chatbox.dto.HolidayAiPayload;
import com.licenta.chatbox.dto.HolidayRecommendationRequest;
import com.licenta.chatbox.dto.HolidayRecommendationResponse;
import com.licenta.chatbox.dto.TurismEventDto;
import com.licenta.chatbox.dto.TurismEventsRequest;
import com.licenta.chatbox.dto.TurismEventsResponse;
import com.licenta.chatbox.dto.TurismPlaceDto;
import com.licenta.chatbox.dto.TurismPlacesRequest;
import com.licenta.chatbox.dto.TurismPlacesResponse;
import com.licenta.chatbox.exception.ChatBoxIntegrationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public ChatService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = new ObjectMapper();
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
        try {
            AiGenerateResponse response = (AiGenerateResponse) rabbitTemplate.convertSendAndReceive(
                    RabbitMQConfig.AI_GENERATE_QUEUE, new AiGenerateRequest(prompt)
            );
            if (response == null || !StringUtils.hasText(response.response())) {
                throw new ChatBoxIntegrationException("AI service returned an empty response.");
            }
            return response;
        } catch (ChatBoxIntegrationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ChatBoxIntegrationException("ChatBox could not reach AI service via RabbitMQ.", ex);
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
                            "N/A", "N/A",
                            "Nu am putut genera recomandari structurate",
                            rawAiText,
                            "N/A", "N/A", "N/A", "N/A", "N/A",
                            List.of("Incearca din nou cu aceleasi criterii"),
                            null, null, List.of(), List.of()
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
        if (!StringUtils.hasText(city)) return List.of();
        try {
            TurismEventsResponse response = (TurismEventsResponse) rabbitTemplate.convertSendAndReceive(
                    RabbitMQConfig.TURISM_EVENTS_QUEUE, new TurismEventsRequest(city, 3)
            );
            if (response == null || response.events() == null) return List.of();
            return response.events().stream()
                    .sorted(Comparator.comparing(e -> e.date() == null ? "9999-99-99" : e.date()))
                    .toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch events via RabbitMQ for city={}: {}", city, ex.getMessage());
            return List.of();
        }
    }

    private List<TurismPlaceDto> fetchPlaces(Double lat, Double lon) {
        try {
            TurismPlacesResponse response = (TurismPlacesResponse) rabbitTemplate.convertSendAndReceive(
                    RabbitMQConfig.TURISM_PLACES_QUEUE, new TurismPlacesRequest(lat, lon, 3)
            );
            if (response == null || response.places() == null) return List.of();
            return response.places();
        } catch (Exception ex) {
            log.warn("Failed to fetch places via RabbitMQ for lat={}, lon={}: {}", lat, lon, ex.getMessage());
            return List.of();
        }
    }

    private HolidayAiPayload parseHolidayPayload(String rawAiText) {
        String json = extractJson(rawAiText);
        if (!StringUtils.hasText(json)) return null;
        try {
            return objectMapper.readValue(json, HolidayAiPayload.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private String extractJson(String text) {
        if (!StringUtils.hasText(text)) return null;
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        return text.substring(start, end + 1);
    }
}
