package com.licenta.games.service;

import com.licenta.games.dto.LeaderboardEntryDTO;
import com.licenta.games.repository.UserZoneProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserZoneProgressRepository progressRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<LeaderboardEntryDTO> getLeaderboard() {
        List<Object[]> rows = progressRepository.findLeaderboard();
        List<LeaderboardEntryDTO> result = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);
            result.add(LeaderboardEntryDTO.builder()
                    .rank(i + 1)
                    .username((String) row[0])
                    .unlockedZones(((Number) row[1]).longValue())
                    .score(((Number) row[2]).intValue())
                    .lastUnlockedZone(row[4] != null ? (String) row[4] : null)
                    .build());
        }

        return result;
    }

    /**
     * Apelat dupa fiecare deblocare de zona — trimite leaderboard-ul actualizat
     * tuturor clientilor conectati via WebSocket.
     */
    public void broadcastLeaderboard() {
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard();
        messagingTemplate.convertAndSend("/topic/leaderboard", leaderboard);
    }
}
