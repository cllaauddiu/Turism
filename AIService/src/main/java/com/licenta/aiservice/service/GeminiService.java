package com.licenta.aiservice.service;

import com.licenta.aiservice.dto.AiResponse;
import com.licenta.aiservice.exception.GeminiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.base-url}")
    private String baseUrl;

    @Value("${gemini.api.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Trimite un prompt catre Google Gemini si returneaza raspunsul generat.
     *
     * @param prompt textul trimis modelului
     * @return AiResponse cu textul generat, modelul folosit si promptul original
     * @throws GeminiException daca API-ul Google nu raspunde sau returneaza eroare
     */
    @SuppressWarnings("unchecked")
    public AiResponse generate(String prompt) {

        // URL: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
        String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;

        // Construim body-ul cererii conform specificatiei Gemini REST API
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Trimitere prompt catre Gemini (model={}), lungime={} chars", model, prompt.length());

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = responseEntity.getBody();

            if (body == null) {
                throw new GeminiException("Raspuns gol de la Gemini API.", 502);
            }

            // Navigam prin structura JSON: candidates[0].content.parts[0].text
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new GeminiException("Gemini nu a returnat niciun candidat in raspuns.", 502);
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) {
                throw new GeminiException("Campul 'content' lipseste din raspunsul Gemini.", 502);
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new GeminiException("Campul 'parts' este gol in raspunsul Gemini.", 502);
            }

            String generatedText = (String) parts.get(0).get("text");
            if (generatedText == null || generatedText.isBlank()) {
                throw new GeminiException("Textul generat de Gemini este gol.", 502);
            }

            log.info("Raspuns Gemini primit cu succes ({} chars)", generatedText.length());

            return AiResponse.builder()
                    .response(generatedText)
                    .model(model)
                    .prompt(prompt)
                    .build();

        } catch (HttpClientErrorException ex) {
            // 4xx – cheie invalida, quota depasita etc.
            log.error("Eroare client Gemini API: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            int code = ex.getStatusCode().value();
            String userMessage;
            if (code == 429) {
                userMessage = "Limita de cereri Gemini API a fost depasita. Te rugam sa astepti cateva secunde si sa incerci din nou.";
            } else if (code == 401 || code == 403) {
                userMessage = "Cheia API Gemini este invalida sau nu are permisiunile necesare.";
            } else {
                userMessage = "Eroare de la Gemini API (" + ex.getStatusCode() + ").";
            }
            throw new GeminiException(userMessage, code);
        } catch (HttpServerErrorException ex) {
            // 5xx – eroare pe serverul Google
            log.error("Eroare server Gemini API: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new GeminiException(
                    "Serverul Gemini a returnat o eroare (" + ex.getStatusCode() + ").",
                    ex.getStatusCode().value()
            );
        } catch (ResourceAccessException ex) {
            // Timeout / retea inaccesibila
            log.error("Gemini API inaccesibil: {}", ex.getMessage());
            throw new GeminiException("Gemini API este inaccesibil. Verifica conexiunea la internet.", ex);
        }
    }
}


