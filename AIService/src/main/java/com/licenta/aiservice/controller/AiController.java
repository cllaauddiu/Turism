package com.licenta.aiservice.controller;

import com.licenta.aiservice.dto.AiResponse;
import com.licenta.aiservice.dto.PromptRequest;
import com.licenta.aiservice.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * POST /ai/generate
     * Body: { "prompt": "..." }
     *
     * Returneaza raspunsul generat de Gemini in format JSON:
     * {
     *   "response": "...",
     *   "model": "gemini-2.0-flash",
     *   "prompt": "..."
     * }
     */
    @PostMapping("/generate")
    public ResponseEntity<AiResponse> generate(@Valid @RequestBody PromptRequest request) {
        AiResponse result = geminiService.generate(request.getPrompt());
        return ResponseEntity.ok(result);
    }

    /**
     * GET /ai/health
     * Endpoint simplu pentru a verifica daca serviciul ruleaza.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AIService is up and running.");
    }
}

