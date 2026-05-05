#!/bin/bash
set -e

# Cream bazele de date pentru fiecare microserviciu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE gamedb;
    CREATE DATABASE chatboxdb;
    CREATE DATABASE placesdb;
EOSQL

# Initializam placesdb cu PostGIS si tabela places
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "placesdb" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS places (
        osm_id        VARCHAR(50)  PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        address       VARCHAR(500),
        latitude      DOUBLE PRECISION NOT NULL,
        longitude     DOUBLE PRECISION NOT NULL,
        location      geography(Point, 4326) GENERATED ALWAYS AS
                      (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
        types         TEXT[],
        primary_type  VARCHAR(50),
        website       VARCHAR(500),
        phone         VARCHAR(100),
        opening_hours VARCHAR(500),
        cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Index spatial GiST pentru cautari rapide pe distanta
    CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (location);

    -- Index pentru filtrare pe tip primar
    CREATE INDEX IF NOT EXISTS idx_places_primary_type ON places (primary_type);

    -- Index pe cached_at pentru invalidare cache
    CREATE INDEX IF NOT EXISTS idx_places_cached_at ON places (cached_at);
EOSQL
