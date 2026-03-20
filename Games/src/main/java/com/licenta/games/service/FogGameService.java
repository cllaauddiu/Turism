package com.licenta.games.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.licenta.games.dto.*;
import com.licenta.games.entity.UserZoneProgress;
import com.licenta.games.entity.UserZoneProgress.ZoneStatus;
import com.licenta.games.entity.Zone;
import com.licenta.games.repository.UserZoneProgressRepository;
import com.licenta.games.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FogGameService {

    private final ZoneRepository zoneRepository;
    private final UserZoneProgressRepository progressRepository;
    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Returns all zones with per-user status.
     */
    public List<ZoneDTO> getZonesForUser(String username) {
        List<Zone> allZones = zoneRepository.findAll();
        List<UserZoneProgress> userProgress = progressRepository.findByUsername(username);

        Map<Long, ZoneStatus> statusMap = userProgress.stream()
                .collect(Collectors.toMap(p -> p.getZone().getId(), UserZoneProgress::getStatus));

        return allZones.stream()
                .map(zone -> ZoneDTO.builder()
                        .id(zone.getId())
                        .name(zone.getName())
                        .continent(zone.getContinent())
                        .lat(zone.getLat())
                        .lng(zone.getLng())
                        .bboxSouth(zone.getBboxSouth())
                        .bboxWest(zone.getBboxWest())
                        .bboxNorth(zone.getBboxNorth())
                        .bboxEast(zone.getBboxEast())
                        .landmarkDescription(statusMap.getOrDefault(zone.getId(), ZoneStatus.LOCKED) == ZoneStatus.UNLOCKED
                                ? zone.getLandmarkDescription() : null)
                        .difficulty(zone.getDifficulty())
                        .emoji(zone.getEmoji())
                        .status(statusMap.getOrDefault(zone.getId(), ZoneStatus.LOCKED))
                        .build())
                .toList();
    }

    /**
     * Generates or retrieves a riddle for the zone and marks it RIDDLE_ACTIVE.
     */
    @Transactional
    public RiddleDTO getRiddleForZone(Long zoneId, String username) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + zoneId));

        Optional<UserZoneProgress> existing = progressRepository.findByUsernameAndZone(username, zone);

        // If already unlocked, return info
        if (existing.isPresent() && existing.get().getStatus() == ZoneStatus.UNLOCKED) {
            return RiddleDTO.builder()
                    .zoneId(zoneId)
                    .zoneName(zone.getName())
                    .question("Zone already unlocked! " + zone.getLandmarkDescription())
                    .hint("")
                    .difficulty(zone.getDifficulty())
                    .options(List.of())
                    .build();
        }

        // If riddle already active, return existing riddle
        if (existing.isPresent() && existing.get().getStatus() == ZoneStatus.RIDDLE_ACTIVE) {
            UserZoneProgress progress = existing.get();
            List<String> options = parseOptions(progress.getRiddleOptions());
            return RiddleDTO.builder()
                    .zoneId(zoneId)
                    .zoneName(zone.getName())
                    .question(progress.getRiddleQuestion())
                    .hint(progress.getRiddleHint())
                    .difficulty(zone.getDifficulty())
                    .options(options)
                    .build();
        }

        // Generate new riddle via AI
        AiClientService.RiddleResponse riddleResponse = aiClientService.generateRiddle(
                zone.getName(), zone.getContinent(), zone.getLandmarkDescription(), zone.getDifficulty()
        );

        UserZoneProgress progress = existing.orElseGet(() ->
                UserZoneProgress.builder()
                        .username(username)
                        .zone(zone)
                        .build()
        );

        progress.setStatus(ZoneStatus.RIDDLE_ACTIVE);
        progress.setRiddleQuestion(riddleResponse.question());
        progress.setRiddleAnswer(riddleResponse.correctAnswer());
        progress.setRiddleHint(riddleResponse.hint());
        progress.setRiddleOptions(serializeOptions(riddleResponse.options()));
        progressRepository.save(progress);

        return RiddleDTO.builder()
                .zoneId(zoneId)
                .zoneName(zone.getName())
                .question(riddleResponse.question())
                .hint(riddleResponse.hint())
                .difficulty(zone.getDifficulty())
                .options(riddleResponse.options())
                .build();
    }

    /**
     * Submits an answer for a zone riddle. Uses fuzzy matching + AI fallback.
     */
    @Transactional
    public UnlockResultDTO submitAnswer(Long zoneId, String username, String userAnswer) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + zoneId));

        Optional<UserZoneProgress> optProgress = progressRepository.findByUsernameAndZone(username, zone);

        if (optProgress.isEmpty() || optProgress.get().getStatus() == ZoneStatus.LOCKED) {
            return UnlockResultDTO.builder()
                    .success(false)
                    .message("You need to get a riddle first!")
                    .build();
        }

        UserZoneProgress progress = optProgress.get();

        if (progress.getStatus() == ZoneStatus.UNLOCKED) {
            return UnlockResultDTO.builder()
                    .success(true)
                    .message("Zone already unlocked!")
                    .landmarkDescription(zone.getLandmarkDescription())
                    .zoneName(zone.getName())
                    .emoji(zone.getEmoji())
                    .zoneId(zoneId)
                    .build();
        }

        // userAnswer can be the selected index ("0","1","2","3") or the text of the option
        List<String> options = parseOptions(progress.getRiddleOptions());
        String correctAnswer = progress.getRiddleAnswer();
        boolean correct = false;

        // Check by index (multiple choice)
        try {
            int selectedIndex = Integer.parseInt(userAnswer.trim());
            if (selectedIndex >= 0 && selectedIndex < options.size()) {
                String selectedOption = options.get(selectedIndex);
                correct = selectedOption.equals(correctAnswer);
            }
        } catch (NumberFormatException e) {
            // Fallback: textual comparison
            correct = isAnswerCorrect(userAnswer, correctAnswer);
        }

        if (correct) {
            progress.setStatus(ZoneStatus.UNLOCKED);
            progress.setUnlockedAt(LocalDateTime.now());
            progressRepository.save(progress);

            return UnlockResultDTO.builder()
                    .success(true)
                    .message("Correct! Zone unlocked! 🎉")
                    .landmarkDescription(zone.getLandmarkDescription())
                    .zoneName(zone.getName())
                    .emoji(zone.getEmoji())
                    .zoneId(zoneId)
                    .build();
        } else {
            return UnlockResultDTO.builder()
                    .success(false)
                    .message("Not quite right. Try again!")
                    .hint(progress.getRiddleHint())
                    .zoneId(zoneId)
                    .build();
        }
    }

    /**
     * Returns progress summary for the user.
     */
    public ProgressDTO getProgress(String username) {
        List<Zone> allZones = zoneRepository.findAll();
        List<UserZoneProgress> userProgress = progressRepository.findByUsername(username);

        long unlocked = userProgress.stream().filter(p -> p.getStatus() == ZoneStatus.UNLOCKED).count();
        long active = userProgress.stream().filter(p -> p.getStatus() == ZoneStatus.RIDDLE_ACTIVE).count();

        // Calculate score
        int score = userProgress.stream()
                .filter(p -> p.getStatus() == ZoneStatus.UNLOCKED)
                .mapToInt(p -> {
                    int diff = p.getZone().getDifficulty();
                    return diff == 1 ? 10 : diff == 2 ? 20 : 30;
                })
                .sum();

        String lastUnlocked = userProgress.stream()
                .filter(p -> p.getStatus() == ZoneStatus.UNLOCKED && p.getUnlockedAt() != null)
                .max(Comparator.comparing(UserZoneProgress::getUnlockedAt))
                .map(p -> p.getZone().getName())
                .orElse(null);

        return ProgressDTO.builder()
                .totalZones(allZones.size())
                .unlockedZones(unlocked)
                .activeRiddles(active)
                .lastUnlockedZone(lastUnlocked)
                .score(score)
                .build();
    }

    private boolean isAnswerCorrect(String userAnswer, String correctAnswer) {
        if (userAnswer == null || correctAnswer == null) return false;
        String ua = userAnswer.trim().toLowerCase();
        String ca = correctAnswer.trim().toLowerCase();
        return ua.equals(ca) || ca.contains(ua) || ua.contains(ca);
    }

    private String serializeOptions(List<String> options) {
        try {
            return objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseOptions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
