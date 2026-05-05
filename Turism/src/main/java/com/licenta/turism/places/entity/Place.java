package com.licenta.turism.places.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @Column(name = "osm_id", length = 50)
    private String osmId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    // Coloana "location" este generata automat de PostgreSQL — read-only pentru JPA
    // (nu o mapam ca @Column, e folosita doar de query-urile native cu ST_DWithin)

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "types", columnDefinition = "text[]")
    private List<String> types;

    @Column(name = "primary_type", length = 50)
    private String primaryType;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "phone", length = 100)
    private String phone;

    @Column(name = "opening_hours", length = 500)
    private String openingHours;

    @Column(name = "cached_at", nullable = false)
    private Instant cachedAt;

    public Place() {}

    public Place(String osmId, String name, String address,
                 Double latitude, Double longitude,
                 List<String> types, String primaryType,
                 String website, String phone, String openingHours,
                 Instant cachedAt) {
        this.osmId = osmId;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.types = types;
        this.primaryType = primaryType;
        this.website = website;
        this.phone = phone;
        this.openingHours = openingHours;
        this.cachedAt = cachedAt;
    }

    public String getOsmId() { return osmId; }
    public void setOsmId(String osmId) { this.osmId = osmId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public List<String> getTypes() { return types; }
    public void setTypes(List<String> types) { this.types = types; }

    public String getPrimaryType() { return primaryType; }
    public void setPrimaryType(String primaryType) { this.primaryType = primaryType; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public Instant getCachedAt() { return cachedAt; }
    public void setCachedAt(Instant cachedAt) { this.cachedAt = cachedAt; }
}
