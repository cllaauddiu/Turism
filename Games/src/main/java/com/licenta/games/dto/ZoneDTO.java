package com.licenta.games.dto;

import com.licenta.games.entity.UserZoneProgress.ZoneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneDTO {
    private Long id;
    private String name;
    private String continent;
    private Double lat;
    private Double lng;
    private Double bboxSouth;
    private Double bboxWest;
    private Double bboxNorth;
    private Double bboxEast;
    private String landmarkDescription;
    private Integer difficulty;
    private String emoji;
    private ZoneStatus status; // user-specific
}

