package com.licenta.games.repository;

import com.licenta.games.entity.UserZoneProgress;
import com.licenta.games.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserZoneProgressRepository extends JpaRepository<UserZoneProgress, Long> {

    List<UserZoneProgress> findByUsername(String username);
    Optional<UserZoneProgress> findByUsernameAndZone(String username, Zone zone);
    long countByUsernameAndStatus(String username, UserZoneProgress.ZoneStatus status);

    /**
     * Top 20 jucatori ordonati dupa scor descrescator.
     * Scor: difficulty 1 = 10pts, 2 = 20pts, 3 = 30pts
     */
    @Query(value = """
            SELECT
                uzp.username,
                COUNT(uzp.id)                                     AS unlocked_zones,
                SUM(CASE z.difficulty WHEN 1 THEN 10
                                      WHEN 2 THEN 20
                                      WHEN 3 THEN 30 ELSE 0 END)  AS score,
                MAX(uzp.unlocked_at)                               AS last_unlocked_at,
                (SELECT z2.name FROM zones z2
                 JOIN user_zone_progress uzp2 ON uzp2.zone_id = z2.id
                 WHERE uzp2.username = uzp.username
                   AND uzp2.status = 'UNLOCKED'
                 ORDER BY uzp2.unlocked_at DESC
                 LIMIT 1)                                          AS last_zone_name
            FROM user_zone_progress uzp
            JOIN zones z ON uzp.zone_id = z.id
            WHERE uzp.status = 'UNLOCKED'
            GROUP BY uzp.username
            ORDER BY score DESC
            LIMIT 20
            """, nativeQuery = true)
    List<Object[]> findLeaderboard();
}
