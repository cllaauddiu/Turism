package com.licenta.games.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiClientService {

    private static final Logger log = LoggerFactory.getLogger(AiClientService.class);

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generează o întrebare grilă cu 4 opțiuni despre zona geografică dată.
     * Răspunsul corect este stocat pe server (correctOptionIndex).
     */
    public RiddleResponse generateRiddle(String zoneName, String continent, String landmarkDescription, int difficulty) {
        String diffLabel = difficulty == 1 ? "easy" : difficulty == 2 ? "medium" : "hard";

        String prompt = String.format(
            "You are a geography quiz master. Generate a %s difficulty multiple-choice question about %s (%s continent).\n" +
            "Context: %s\n\n" +
            "Rules:\n" +
            "- Write ONE clear geographic question about this place\n" +
            "- Provide exactly 4 answer options (A, B, C, D)\n" +
            "- Only ONE option is correct\n" +
            "- The 3 wrong options must be plausible but clearly incorrect\n" +
            "- correctIndex is 0 for A, 1 for B, 2 for C, 3 for D\n" +
            "- Respond ONLY with valid JSON, no markdown, no explanation\n\n" +
            "Required JSON format:\n" +
            "{\"question\": \"...\", \"options\": [\"A: ...\", \"B: ...\", \"C: ...\", \"D: ...\"], \"correctIndex\": 0, \"hint\": \"...\"}\n\n" +
            "Example: {\"question\": \"What river flows through Paris?\", \"options\": [\"A: Seine\", \"B: Thames\", \"C: Rhine\", \"D: Loire\"], \"correctIndex\": 0, \"hint\": \"It flows through the heart of the city\"}",
            diffLabel, zoneName, continent, landmarkDescription
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = Map.of("prompt", prompt);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/ai/generate", entity, Map.class
            );

            if (response.getBody() == null) return fallbackRiddle(zoneName);

            String rawText = (String) response.getBody().get("response");
            if (rawText == null) return fallbackRiddle(zoneName);

            // Curăță markdown code fences dacă există
            rawText = rawText.trim();
            if (rawText.startsWith("```")) {
                rawText = rawText.replaceAll("```[a-zA-Z]*\\n?", "").replace("```", "").trim();
            }

            JsonNode json = objectMapper.readTree(rawText);

            String question = json.path("question").asText("What place is this?");
            int correctIndex = json.path("correctIndex").asInt(0);
            String hint = json.path("hint").asText("Think about its geographic location.");

            JsonNode optionsNode = json.path("options");
            List<String> options;
            if (optionsNode.isArray() && optionsNode.size() == 4) {
                options = List.of(
                    optionsNode.get(0).asText(),
                    optionsNode.get(1).asText(),
                    optionsNode.get(2).asText(),
                    optionsNode.get(3).asText()
                );
            } else {
                return fallbackRiddle(zoneName);
            }

            // Extrage textul răspunsului corect (ex: "A: Paris" → "Paris")
            String correctAnswer = options.get(correctIndex);

            return new RiddleResponse(question, correctAnswer, hint, options, correctIndex);

        } catch (Exception e) {
            log.error("Error calling AI service for riddle generation: {}", e.getMessage());
            return fallbackRiddle(zoneName);
        }
    }

    private RiddleResponse fallbackRiddle(String zoneName) {
        List<String> options = List.of(
            "A: " + zoneName,
            "B: Unknown Location",
            "C: Somewhere Else",
            "D: Another Place"
        );
        return new RiddleResponse(
            "Which famous geographic location is described in the landmark info?",
            "A: " + zoneName,
            "It's a well-known place on the world map.",
            options,
            0
        );
    }

    public record RiddleResponse(
        String question,
        String correctAnswer,
        String hint,
        List<String> options,
        int correctIndex
    ) {}
}
