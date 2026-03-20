package com.licenta.turism.places;

import com.licenta.turism.places.dto.TourismPlaceDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/turism")
public class GooglePlacesController {

    private final GooglePlacesService googlePlacesService;

    public GooglePlacesController(GooglePlacesService googlePlacesService) {
        this.googlePlacesService = googlePlacesService;
    }

    @GetMapping("/places")
    @ResponseStatus(HttpStatus.OK)
    public List<TourismPlaceDto> getPlaces(@RequestParam Double lat,
                                           @RequestParam Double lon,
                                           @RequestParam(required = false) Integer radius,
                                           @RequestParam(required = false) Integer size,
                                           @RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) String type) {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coordinates.");
        }

        return googlePlacesService.searchNearby(lat, lon, radius, size, keyword, type);
    }
}

