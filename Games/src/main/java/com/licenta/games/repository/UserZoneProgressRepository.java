package com.licenta.games.repository;

import com.licenta.games.entity.UserZoneProgress;
import com.licenta.games.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserZoneProgressRepository extends JpaRepository<UserZoneProgress, Long> {
    List<UserZoneProgress> findByUsername(String username);
    Optional<UserZoneProgress> findByUsernameAndZone(String username, Zone zone);
    long countByUsernameAndStatus(String username, UserZoneProgress.ZoneStatus status);
}

