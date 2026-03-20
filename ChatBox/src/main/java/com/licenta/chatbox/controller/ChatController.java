package com.licenta.chatbox.controller;

import com.licenta.chatbox.dto.ChatRequest;
import com.licenta.chatbox.dto.ChatResponse;
import com.licenta.chatbox.dto.HolidayRecommendationRequest;
import com.licenta.chatbox.dto.HolidayRecommendationResponse;
import com.licenta.chatbox.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chatbox")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.ask(request.message()));
    }

    @PostMapping("/holiday/recommend")
    public ResponseEntity<HolidayRecommendationResponse> recommendHoliday(@Valid @RequestBody HolidayRecommendationRequest request) {
        return ResponseEntity.ok(chatService.recommendHoliday(request));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ChatBox is up and running.");
    }
}

