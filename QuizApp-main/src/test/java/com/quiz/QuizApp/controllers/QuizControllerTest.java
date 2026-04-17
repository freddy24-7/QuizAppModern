package com.quiz.QuizApp.controllers;

import com.quiz.QuizApp.config.GlobalExceptionHandler;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.service.QuizInviteService;
import com.quiz.QuizApp.service.QuizService;
import com.quiz.QuizApp.service.RateLimiterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuizController.class)
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class QuizControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private QuizService quizService;

    @MockitoBean
    private QuizInviteService quizInviteService;

    @MockitoBean
    private RateLimiterService rateLimiterService;

    private static final String VALID_PAYLOAD = """
            {
                "title": "Valid Quiz Title",
                "durationInSeconds": 120,
                "startTime": "2025-01-01T10:00:00",
                "questions": [{
                    "text": "What is the Java programming language?",
                    "options": [
                        {"text": "A language", "correct": true},
                        {"text": "A coffee", "correct": false}
                    ]
                }],
                "participants": [{"phoneNumber": "+31612345678"}]
            }
            """;

    @Test
    void shouldReturnAllQuizzes() throws Exception {
        when(quizService.getAllQuizzes()).thenReturn(List.of());

        mockMvc.perform(get("/api/quizzes"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn400WhenTitleIsBlank() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(true);
        when(rateLimiterService.tryConsumeSmsSubmission(anyString())).thenReturn(true);

        String payload = """
                {
                    "title": "",
                    "durationInSeconds": 120,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [{
                        "text": "What is the Java programming language?",
                        "options": [{"text": "A", "correct": true}, {"text": "B", "correct": false}]
                    }],
                    "participants": [{"phoneNumber": "+31612345678"}]
                }
                """;

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenNoQuestions() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(true);
        when(rateLimiterService.tryConsumeSmsSubmission(anyString())).thenReturn(true);

        String payload = """
                {
                    "title": "No Questions Quiz",
                    "durationInSeconds": 120,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [],
                    "participants": [{"phoneNumber": "+31612345678"}]
                }
                """;

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenPhoneNumberInvalidFormat() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(true);
        when(rateLimiterService.tryConsumeSmsSubmission(anyString())).thenReturn(true);

        String payload = """
                {
                    "title": "Valid Title",
                    "durationInSeconds": 120,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [{
                        "text": "What is the Java programming language?",
                        "options": [{"text": "A", "correct": true}, {"text": "B", "correct": false}]
                    }],
                    "participants": [{"phoneNumber": "0612345678"}]
                }
                """;

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenDurationTooShort() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(true);
        when(rateLimiterService.tryConsumeSmsSubmission(anyString())).thenReturn(true);

        String payload = """
                {
                    "title": "Short Duration Quiz",
                    "durationInSeconds": 5,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [{
                        "text": "What is the Java programming language?",
                        "options": [{"text": "A", "correct": true}, {"text": "B", "correct": false}]
                    }],
                    "participants": [{"phoneNumber": "+31612345678"}]
                }
                """;

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn429WhenRateLimitExceeded() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void shouldReturn200ForValidQuiz() throws Exception {
        when(rateLimiterService.tryConsumeQuizSubmission(anyString())).thenReturn(true);
        when(rateLimiterService.tryConsumeSmsSubmission(anyString())).thenReturn(true);

        Quiz saved = new Quiz();
        saved.setId(1L);
        saved.setTitle("Valid Quiz Title");
        saved.setDurationInSeconds(120);
        saved.setQuestions(List.of());
        saved.setParticipants(List.of());

        when(quizService.createQuiz(any())).thenReturn(saved);

        mockMvc.perform(post("/api/quizzes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PAYLOAD))
                .andExpect(status().isOk());
    }
}
