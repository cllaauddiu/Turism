package com.licenta.chatbox.controller;

import com.licenta.chatbox.dto.ChatResponse;
import com.licenta.chatbox.dto.HolidayRecommendationRequest;
import com.licenta.chatbox.dto.HolidayRecommendationResponse;
import com.licenta.chatbox.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatController chatController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
    }

    @Test
    void shouldReturnAiAnswer() throws Exception {
        when(chatService.ask(eq("Salut")))
                .thenReturn(new ChatResponse("Salut! Cu ce te pot ajuta?", "gemini-2.5-flash-lite", "Salut"));

        mockMvc.perform(post("/chatbox/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Salut\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Salut! Cu ce te pot ajuta?"));
    }

    @Test
    void shouldReturnHolidayRecommendations() throws Exception {
        HolidayRecommendationRequest request = new HolidayRecommendationRequest(
                new HolidayRecommendationRequest.LogisticsCriteria(
                        HolidayRecommendationRequest.BudgetLevel.MEDIUM,
                        HolidayRecommendationRequest.TripDuration.ONE_WEEK,
                        HolidayRecommendationRequest.DistanceRegion.MEDIUM_FLIGHT,
                        HolidayRecommendationRequest.TravelCompanion.COUPLE
                ),
                new HolidayRecommendationRequest.ExperienceCriteria(
                        HolidayRecommendationRequest.VacationGoal.RELAX,
                        HolidayRecommendationRequest.ClimatePreference.WARM,
                        HolidayRecommendationRequest.VacationPace.BALANCED
                ),
                new HolidayRecommendationRequest.ComfortCriteria(
                        HolidayRecommendationRequest.AccommodationType.BOUTIQUE,
                        HolidayRecommendationRequest.GastronomyStyle.BALANCED,
                        HolidayRecommendationRequest.CrowdPreference.HIDDEN_GEMS
                ),
                3,
                true
        );

        when(chatService.recommendHoliday(eq(request)))
                .thenReturn(new HolidayRecommendationResponse(
                        java.util.List.of(new HolidayRecommendationResponse.HolidayOption(
                                "Lisbon",
                                "Portugal",
                                "Lisbon Slow Escape",
                                "Perfect blend of cafes, coast and culture.",
                                "Spring",
                                "700 EUR",
                                "6 zile",
                                "Temperat",
                                "Echilibrat",
                                java.util.List.of("Alfama", "Sintra"),
                                38.7223,
                                -9.1393,
                                java.util.List.of(),
                                java.util.List.of()
                        )),
                        "gemini-2.5-flash-lite",
                        "ai+turism"
                ));

        String body = """
                {
                  "logistics": {
                    "budget": "MEDIUM",
                    "duration": "ONE_WEEK",
                    "distanceRegion": "MEDIUM_FLIGHT",
                    "companion": "COUPLE"
                  },
                  "experience": {
                    "goal": "RELAX",
                    "climate": "WARM",
                    "pace": "BALANCED"
                  },
                  "comfort": {
                    "accommodation": "BOUTIQUE",
                    "gastronomy": "BALANCED",
                    "crowd": "HIDDEN_GEMS"
                  },
                  "recommendationsCount": 3,
                  "enrichWithTurismData": true
                }
                """;

        mockMvc.perform(post("/chatbox/holiday/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendations[0].destinationCity").value("Lisbon"));
    }
}

