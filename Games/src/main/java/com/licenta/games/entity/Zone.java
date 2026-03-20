package com.licenta.games.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String continent;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    /** Bounding box: south,west,north,east */
    @Column(nullable = false)
    private Double bboxSouth;
    @Column(nullable = false)
    private Double bboxWest;
    @Column(nullable = false)
    private Double bboxNorth;
    @Column(nullable = false)
    private Double bboxEast;

    @Column(nullable = false, length = 1000)
    private String landmarkDescription;

    @Column(nullable = false)
    private Integer difficulty; // 1=easy, 2=medium, 3=hard

    @Column(nullable = false)
    private String emoji;
}

