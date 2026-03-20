package com.licenta.games.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_zone_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"username", "zone_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserZoneProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneStatus status;

    @Column(length = 2000)
    private String riddleQuestion;

    @Column(length = 500)
    private String riddleAnswer;

    @Column(length = 500)
    private String riddleHint;

    /** JSON array string: ["Option A", "Option B", "Option C", "Option D"] */
    @Column(length = 1000)
    private String riddleOptions;

    private LocalDateTime unlockedAt;

    public enum ZoneStatus {
        LOCKED, RIDDLE_ACTIVE, UNLOCKED
    }
}

