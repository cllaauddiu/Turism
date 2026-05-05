package com.licenta.weather.config;

import java.util.List;

public record City(String name, String country, double latitude, double longitude) {

    public static final List<City> TRACKED_CITIES = List.of(
            new City("Paris",          "Franta",                   48.8566,   2.3522),
            new City("Tokyo",          "Japonia",                  35.6762, 139.6503),
            new City("New York",       "Statele Unite ale Americii", 40.7128, -74.0060),
            new City("Roma",           "Italia",                   41.9028,  12.4964),
            new City("Londra",         "Regatul Unit",             51.5074,  -0.1278),
            new City("Berlin",         "Germania",                 52.5200,  13.4050),
            new City("Sydney",         "Australia",               -33.8688, 151.2093),
            new City("Rio de Janeiro", "Brazilia",                -22.9068, -43.1729),
            new City("Beijing",        "China",                    39.9042, 116.4074),
            new City("Toronto",        "Canada",                   43.6532, -79.3832),
            new City("Cairo",          "Egipt",                    30.0444,  31.2357),
            new City("Moscova",        "Rusia",                    55.7558,  37.6173),
            new City("Madrid",         "Spania",                   40.4168,  -3.7038),
            new City("Istanbul",       "Turcia",                   41.0082,  28.9784),
            new City("Buenos Aires",   "Argentina",               -34.6037, -58.3816),
            new City("Seul",           "Coreea de Sud",            37.5665, 126.9780),
            new City("Mumbai",         "India",                    19.0760,  72.8777),
            new City("Cape Town",      "Africa de Sud",           -33.9249,  18.4241),
            new City("Cluj-Napoca",    "Romania",                  46.7712,  23.6236),
            new City("Dubai",          "Emiratele Arabe Unite",    25.2048,  55.2708)
    );
}
