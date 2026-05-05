-- TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Tabela cu istoricul vremii pentru cele 20 de orase
CREATE TABLE IF NOT EXISTS weather_history (
    recorded_at          TIMESTAMPTZ      NOT NULL,
    city                 VARCHAR(100)     NOT NULL,
    country              VARCHAR(100)     NOT NULL,
    latitude             DOUBLE PRECISION NOT NULL,
    longitude            DOUBLE PRECISION NOT NULL,
    temperature          DOUBLE PRECISION,
    feels_like           DOUBLE PRECISION,
    humidity             DOUBLE PRECISION,
    wind_speed           DOUBLE PRECISION,
    wind_direction       DOUBLE PRECISION,
    wind_direction_label VARCHAR(10),
    uv_index             DOUBLE PRECISION,
    visibility           DOUBLE PRECISION,
    cloud_cover          DOUBLE PRECISION,
    precip_probability   DOUBLE PRECISION,
    pressure             DOUBLE PRECISION,
    dew_point            DOUBLE PRECISION,
    conditions           VARCHAR(100),
    icon                 VARCHAR(50),
    temp_max             DOUBLE PRECISION,
    temp_min             DOUBLE PRECISION,
    sunrise              VARCHAR(20),
    sunset               VARCHAR(20),
    PRIMARY KEY (recorded_at, city)
);

-- Convertim tabela in hypertable TimescaleDB (partitionata dupa timp)
SELECT create_hypertable('weather_history', 'recorded_at', if_not_exists => TRUE);

-- Index pentru interogari rapide pe oras + interval de timp
CREATE INDEX IF NOT EXISTS idx_weather_city_time
    ON weather_history (city, recorded_at DESC);
