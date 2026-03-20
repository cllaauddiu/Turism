package com.licenta.chatbox.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HolidayRecommendationRequest(
        @Valid @NotNull LogisticsCriteria logistics,
        @Valid @NotNull ExperienceCriteria experience,
        @Valid @NotNull ComfortCriteria comfort,
        @Min(1) @Max(6) Integer recommendationsCount,
        Boolean enrichWithTurismData
) {
    public int safeRecommendationsCount() {
        return recommendationsCount == null ? 3 : recommendationsCount;
    }

    public boolean shouldEnrichWithTurismData() {
        return enrichWithTurismData == null || enrichWithTurismData;
    }

    public record LogisticsCriteria(
            @NotNull BudgetLevel budget,
            @NotNull TripDuration duration,
            @NotNull DistanceRegion distanceRegion,
            @NotNull TravelCompanion companion
    ) {
    }

    public record ExperienceCriteria(
            @NotNull VacationGoal goal,
            @NotNull ClimatePreference climate,
            @NotNull VacationPace pace
    ) {
    }

    public record ComfortCriteria(
            @NotNull AccommodationType accommodation,
            @NotNull GastronomyStyle gastronomy,
            @NotNull CrowdPreference crowd
    ) {
    }

    public enum BudgetLevel {
        ECONOMIC("Economic (sub 300 EUR)"),
        MEDIUM("Mediu (300 EUR - 800 EUR)"),
        PREMIUM("Premium (800 EUR - 2000 EUR)"),
        LUXURY("Lux (peste 2000 EUR)");

        private final String label;

        BudgetLevel(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum TripDuration {
        CITY_BREAK("City Break (1-3 zile)"),
        ONE_WEEK("O saptamana de deconectare (4-7 zile)"),
        EXTENDED("Calatorie extinsa (peste 8 zile)");

        private final String label;

        TripDuration(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum DistanceRegion {
        NEAR_HOME("Aproape de casa (Europa de Est / Balcani)"),
        MEDIUM_FLIGHT("Zbor mediu (oriunde in Europa, 2-4 ore)"),
        EXOTIC("Destinatie exotica/indepartata (Asia, Americi, Africa)");

        private final String label;

        DistanceRegion(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum TravelCompanion {
        SOLO("Calator singur (Solo)"),
        COUPLE("In cuplu"),
        FAMILY("Familie cu copii"),
        FRIENDS("Grup de prieteni");

        private final String label;

        TravelCompanion(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum VacationGoal {
        RELAX("Relaxare totala"),
        CULTURE("Explorare culturala"),
        ADVENTURE("Aventura in natura"),
        NIGHTLIFE("Viata de noapte si distractie");

        private final String label;

        VacationGoal(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum ClimatePreference {
        WARM("Cald si soare"),
        TEMPERATE("Temperat"),
        COLD("Racoros / Zapada");

        private final String label;

        ClimatePreference(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum VacationPace {
        SLOW("Lent"),
        BALANCED("Echilibrat"),
        INTENSE("Intens");

        private final String label;

        VacationPace(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum AccommodationType {
        ALL_INCLUSIVE("Resort All-Inclusive"),
        CHAIN_HOTEL("Hotel de lant"),
        BOUTIQUE("Pensiune / Boutique Hotel"),
        APARTMENT("Apartament / Airbnb");

        private final String label;

        AccommodationType(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum GastronomyStyle {
        EXPLORER("Explorator (street-food, piete locale)"),
        BALANCED("Echilibrat (restaurante cu recenzii bune)"),
        FINE_DINING("Fine Dining");

        private final String label;

        GastronomyStyle(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum CrowdPreference {
        FAMOUS("Obiective faimoase"),
        HIDDEN_GEMS("Ascunse / Off-the-beaten-path");

        private final String label;

        CrowdPreference(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }
}

