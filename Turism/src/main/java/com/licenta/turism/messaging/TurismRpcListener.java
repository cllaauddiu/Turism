package com.licenta.turism.messaging;

import com.licenta.turism.config.RabbitMQConfig;
import com.licenta.turism.places.PlacesService;
import com.licenta.turism.ticketmaster.TicketmasterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TurismRpcListener {

    private static final Logger log = LoggerFactory.getLogger(TurismRpcListener.class);

    private final TicketmasterService ticketmasterService;
    private final PlacesService placesService;

    public TurismRpcListener(TicketmasterService ticketmasterService,
                             PlacesService placesService) {
        this.ticketmasterService = ticketmasterService;
        this.placesService = placesService;
    }

    @RabbitListener(queues = RabbitMQConfig.TURISM_EVENTS_QUEUE)
    public TurismEventsResponse handleEvents(TurismEventsRequest request) {
        log.info("RabbitMQ: events request for city={}", request.city());
        try {
            var events = ticketmasterService.searchEvents(null, request.city(), null, null, 30, request.size());
            return new TurismEventsResponse(events);
        } catch (Exception ex) {
            log.warn("Events fetch failed: {}", ex.getMessage());
            return new TurismEventsResponse(List.of());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.TURISM_PLACES_QUEUE)
    public TurismPlacesResponse handlePlaces(TurismPlacesRequest request) {
        log.info("RabbitMQ: places request for lat={}, lon={}", request.lat(), request.lon());
        try {
            var places = placesService.searchNearby(request.lat(), request.lon(), 3000, request.size(), null, null);
            return new TurismPlacesResponse(places);
        } catch (Exception ex) {
            log.warn("Places fetch failed: {}", ex.getMessage());
            return new TurismPlacesResponse(List.of());
        }
    }
}
