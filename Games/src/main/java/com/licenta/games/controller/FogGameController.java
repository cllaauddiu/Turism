package com.licenta.games.controller;

import com.licenta.games.dto.*;
import com.licenta.games.security.JwtService;
import com.licenta.games.service.FogGameService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/games/fog")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FogGameController {

    private final FogGameService fogGameService;
    private final JwtService jwtService;

    /** GET /games/fog/zones — all zones with user status */
    @GetMapping("/zones")
    public ResponseEntity<List<ZoneDTO>> getZones(HttpServletRequest request) {
        String username = extractUsername(request);
        return ResponseEntity.ok(fogGameService.getZonesForUser(username));
    }

    /** GET /games/fog/zones/{zoneId}/riddle — get/generate riddle for a zone */
    @GetMapping("/zones/{zoneId}/riddle")
    public ResponseEntity<RiddleDTO> getRiddle(@PathVariable Long zoneId, HttpServletRequest request) {
        String username = extractUsername(request);
        return ResponseEntity.ok(fogGameService.getRiddleForZone(zoneId, username));
    }

    /** POST /games/fog/zones/{zoneId}/unlock — submit answer */
    @PostMapping("/zones/{zoneId}/unlock")
    public ResponseEntity<UnlockResultDTO> unlock(
            @PathVariable Long zoneId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String username = extractUsername(request);
        String answer = body.getOrDefault("answer", "");
        return ResponseEntity.ok(fogGameService.submitAnswer(zoneId, username, answer));
    }

    /** GET /games/fog/progress — user progress summary */
    @GetMapping("/progress")
    public ResponseEntity<ProgressDTO> getProgress(HttpServletRequest request) {
        String username = extractUsername(request);
        return ResponseEntity.ok(fogGameService.getProgress(username));
    }

    private String extractUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        return jwtService.extractUsername(token);
    }
}

