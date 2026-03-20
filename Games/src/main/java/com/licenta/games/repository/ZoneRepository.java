package com.licenta.games.repository;

import com.licenta.games.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {
    boolean existsByName(String name);
}

