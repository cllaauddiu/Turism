package com.licenta.weather.service;

/**
 * Mapeaza codurile WMO de la Open-Meteo la descrieri si iconite.
 * Lista oficiala: https://open-meteo.com/en/docs#weathervariables
 */
public final class WmoCodeMapper {

    private WmoCodeMapper() {}

    public static String toCondition(int code) {
        return switch (code) {
            case 0 -> "Senin";
            case 1 -> "Predominant senin";
            case 2 -> "Partial noros";
            case 3 -> "Innorat";
            case 45, 48 -> "Ceata";
            case 51, 53, 55 -> "Burnita";
            case 56, 57 -> "Burnita inghetata";
            case 61, 63, 65 -> "Ploaie";
            case 66, 67 -> "Ploaie inghetata";
            case 71, 73, 75 -> "Ninsoare";
            case 77 -> "Granule de zapada";
            case 80, 81, 82 -> "Aversa";
            case 85, 86 -> "Aversa de zapada";
            case 95 -> "Furtuna";
            case 96, 99 -> "Furtuna cu grindina";
            default -> "Necunoscut";
        };
    }

    public static String toIcon(int code) {
        return switch (code) {
            case 0, 1 -> "clear-day";
            case 2 -> "partly-cloudy-day";
            case 3 -> "cloudy";
            case 45, 48 -> "fog";
            case 51, 53, 55, 56, 57 -> "drizzle";
            case 61, 63, 65, 66, 67, 80, 81, 82 -> "rain";
            case 71, 73, 75, 77, 85, 86 -> "snow";
            case 95, 96, 99 -> "thunderstorm";
            default -> "cloudy";
        };
    }
}
