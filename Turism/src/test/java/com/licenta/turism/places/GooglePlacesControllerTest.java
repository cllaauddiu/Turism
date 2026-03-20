package com.licenta.turism.places;

import com.licenta.turism.places.dto.TourismPlaceDto;
import com.licenta.turism.ticketmaster.TicketmasterExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GooglePlacesControllerTest {

    @Mock
    private GooglePlacesService googlePlacesService;

    @InjectMocks
    private GooglePlacesController googlePlacesController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(googlePlacesController)
                .setControllerAdvice(new TicketmasterExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnPlaces() throws Exception {
        when(googlePlacesService.searchNearby(eq(44.4268), eq(26.1025), eq(3000), eq(6), eq("museum"), eq(null)))
                .thenReturn(List.of(new TourismPlaceDto(
                        "place-1",
                        "Muzeul National",
                        "Calea Victoriei",
                        4.7,
                        1200,
                        List.of("museum", "tourist_attraction"),
                        44.43,
                        26.09,
                        "https://www.google.com/maps/place/?q=place_id:place-1",
                        null
                )));

        mockMvc.perform(get("/api/turism/places")
                        .param("lat", "44.4268")
                        .param("lon", "26.1025")
                        .param("radius", "3000")
                        .param("size", "6")
                        .param("keyword", "museum")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("place-1"))
                .andExpect(jsonPath("$[0].name").value("Muzeul National"));
    }

    @Test
    void shouldReturnBadRequestWhenCoordinatesAreInvalid() throws Exception {
        mockMvc.perform(get("/api/turism/places")
                        .param("lat", "101")
                        .param("lon", "26.1025"))
                .andExpect(status().isBadRequest());
    }
}

