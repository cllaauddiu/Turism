package com.licenta.turism.ticketmaster;

import com.licenta.turism.ticketmaster.dto.TourismEventDto;
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
public class TicketmasterController {

    private final TicketmasterService ticketmasterService;

    public TicketmasterController(TicketmasterService ticketmasterService) {
        this.ticketmasterService = ticketmasterService;
    }

    @GetMapping("/events")
    @ResponseStatus(HttpStatus.OK)
    public List<TourismEventDto> getEvents(@RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) String city,
                                           @RequestParam(required = false) Double lat,
                                           @RequestParam(required = false) Double lon,
                                           @RequestParam(required = false) Integer radius,
                                           @RequestParam(required = false) Integer size) {
        boolean hasLat = lat != null;
        boolean hasLon = lon != null;
        if (hasLat != hasLon) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both lat and lon are required together.");
        }

        return ticketmasterService.searchEvents(keyword, city, lat, lon, radius, size);
    }
}

