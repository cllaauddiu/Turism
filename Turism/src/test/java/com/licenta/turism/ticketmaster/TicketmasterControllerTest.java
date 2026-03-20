package com.licenta.turism.ticketmaster;

import com.licenta.turism.ticketmaster.dto.TourismEventDto;
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
class TicketmasterControllerTest {

    @Mock
    private TicketmasterService ticketmasterService;

    @InjectMocks
    private TicketmasterController ticketmasterController;

    private MockMvc mockMvc;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ticketmasterController)
                .setControllerAdvice(new TicketmasterExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnEvents() throws Exception {
        when(ticketmasterService.searchEvents(eq("music"), eq("Bucharest"), eq(null), eq(null), eq(20), eq(5)))
                .thenReturn(List.of(new TourismEventDto("id-1", "Concert", "https://example.test", "2026-03-20", "20:00:00", "Arena", "Bucharest", null)));

        mockMvc.perform(get("/api/turism/events")
                        .param("keyword", "music")
                        .param("city", "Bucharest")
                        .param("radius", "20")
                        .param("size", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("id-1"))
                .andExpect(jsonPath("$[0].name").value("Concert"));
    }

    @Test
    void shouldReturnBadRequestWhenOnlyLatIsProvided() throws Exception {
        mockMvc.perform(get("/api/turism/events")
                        .param("lat", "44.43"))
                .andExpect(status().isBadRequest());
    }
}



