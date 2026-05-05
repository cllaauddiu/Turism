package com.licenta.turism.places.repository;

import com.licenta.turism.places.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, String> {

    /**
     * Cautare spatiala cu PostGIS: toate locurile in raza :radius (metri)
     * fata de (:lat, :lon), filtrate optional dupa primary_type.
     * Returnam doar inregistrarile mai noi de :since (cache valid).
     */
    @Query(value = """
            SELECT * FROM places
            WHERE ST_DWithin(
                location,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                :radius
            )
            AND cached_at >= :since
            AND (:primaryType IS NULL OR primary_type = :primaryType)
            ORDER BY ST_Distance(
                location,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            )
            LIMIT :size
            """, nativeQuery = true)
    List<Place> findNearby(@Param("lat") double lat,
                           @Param("lon") double lon,
                           @Param("radius") int radiusMeters,
                           @Param("primaryType") String primaryType,
                           @Param("since") Instant since,
                           @Param("size") int size);

    /**
     * Numar locuri valide intr-o anumita zona — folosim sa decidem daca cache-ul e suficient.
     */
    @Query(value = """
            SELECT COUNT(*) FROM places
            WHERE ST_DWithin(
                location,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                :radius
            )
            AND cached_at >= :since
            AND (:primaryType IS NULL OR primary_type = :primaryType)
            """, nativeQuery = true)
    long countNearby(@Param("lat") double lat,
                     @Param("lon") double lon,
                     @Param("radius") int radiusMeters,
                     @Param("primaryType") String primaryType,
                     @Param("since") Instant since);
}
