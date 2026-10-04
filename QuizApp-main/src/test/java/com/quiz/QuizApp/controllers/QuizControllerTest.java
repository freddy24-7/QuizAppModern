package com.quiz.QuizApp.controllers;

import com.quiz.QuizApp.config.GlobalExceptionHandler;
import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.dto.LobbyStatusDTO;
import com.quiz.QuizApp.exception.QuizNotFoundException;
import com.quiz.QuizApp.exception.QuizStateException;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
                }]
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

        String payload = """
                {
                    "title": "",
                    "durationInSeconds": 120,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [{
                        "text": "What is the Java programming language?",
                        "options": [{"text": "A", "correct": true}, {"text": "B", "correct": false}]
                    }]
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

        String payload = """
                {
                    "title": "No Questions Quiz",
                    "durationInSeconds": 120,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": []
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

        String payload = """
                {
                    "title": "Short Duration Quiz",
                    "durationInSeconds": 5,
                    "startTime": "2025-01-01T10:00:00",
                    "questions": [{
                        "text": "What is the Java programming language?",
                        "options": [{"text": "A", "correct": true}, {"text": "B", "correct": false}]
                    }]
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

    @Test
    void shouldJoinQuizAndReturnParticipantId() throws Exception {
        when(rateLimiterService.tryConsumeJoin(anyString())).thenReturn(true);

        Participant participant = new Participant();
        participant.setId(42L);
        participant.setUsername("Alice");
        when(quizService.joinQuiz(1L, "Alice")).thenReturn(participant);

        mockMvc.perform(post("/api/quizzes/1/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"Alice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participantId").value(42))
                .andExpect(jsonPath("$.username").value("Alice"));
    }

    @Test
    void shouldReturn400WhenJoinNameIsBlank() throws Exception {
        when(rateLimiterService.tryConsumeJoin(anyString())).thenReturn(true);

        mockMvc.perform(post("/api/quizzes/1/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.username").exists());

        verify(quizService, never()).joinQuiz(any(), any());
    }

    @Test
    void shouldReturn404WhenJoiningUnknownQuiz() throws Exception {
        when(rateLimiterService.tryConsumeJoin(anyString())).thenReturn(true);
        when(quizService.joinQuiz(99L, "Alice")).thenThrow(new QuizNotFoundException(99L));

        mockMvc.perform(post("/api/quizzes/99/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"Alice\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn409WhenJoiningStartedQuiz() throws Exception {
        when(rateLimiterService.tryConsumeJoin(anyString())).thenReturn(true);
        when(quizService.joinQuiz(1L, "Alice"))
                .thenThrow(new QuizStateException("This quiz has already started."));

        mockMvc.perform(post("/api/quizzes/1/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"Alice\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("This quiz has already started."));
    }

    @Test
    void shouldReturn429WhenJoinRateLimitExceeded() throws Exception {
        when(rateLimiterService.tryConsumeJoin(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/quizzes/1/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"Alice\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void shouldStartQuiz() throws Exception {
        when(quizService.startQuiz(1L)).thenReturn(new LobbyStatusDTO(2, true, List.of("Alice", "Bob")));

        mockMvc.perform(post("/api/quizzes/1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.started").value(true))
                .andExpect(jsonPath("$.joinedCount").value(2));
    }
}
