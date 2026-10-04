package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.dto.AnswerOptionDTO;
import com.quiz.QuizApp.dto.LobbyStatusDTO;
import com.quiz.QuizApp.dto.QuestionDTO;
import com.quiz.QuizApp.dto.QuizDTO;
import com.quiz.QuizApp.exception.QuizNotFoundException;
import com.quiz.QuizApp.exception.QuizStateException;
import com.quiz.QuizApp.repository.ParticipantRepository;
import com.quiz.QuizApp.repository.QuizRepository;
import com.quiz.QuizApp.repository.ResponseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class QuizServiceTest {

    @Mock
    private QuizRepository quizRepo;

    @Mock
    private ParticipantRepository participantRepo;

    @Mock
    private ResponseRepository responseRepo;

    @InjectMocks
    private QuizService quizService;

    private QuizDTO buildValidQuizDto() {
        AnswerOptionDTO opt1 = new AnswerOptionDTO();
        opt1.setText("A programming language");
        opt1.setCorrect(true);

        AnswerOptionDTO opt2 = new AnswerOptionDTO();
        opt2.setText("A type of coffee");
        opt2.setCorrect(false);

        QuestionDTO question = new QuestionDTO();
        question.setText("What is Java?");
        question.setOptions(List.of(opt1, opt2));

        QuizDTO dto = new QuizDTO();
        dto.setTitle("Unit Test Quiz");
        dto.setDurationInSeconds(120);
        dto.setQuestions(List.of(question));
        return dto;
    }

    @Test
    void shouldCreateQuizSuccessfully() {
        QuizDTO dto = buildValidQuizDto();
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        Quiz quiz = quizService.createQuiz(dto);

        assertEquals("Unit Test Quiz", quiz.getTitle());
        assertEquals(120, quiz.getDurationInSeconds());
        assertEquals(1, quiz.getQuestions().size());
        assertTrue(quiz.getParticipants().isEmpty());
    }

    @Test
    void shouldMapQuestionsAndOptionsCorrectly() {
        QuizDTO dto = buildValidQuizDto();
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        Quiz quiz = quizService.createQuiz(dto);

        var question = quiz.getQuestions().get(0);
        assertEquals("What is Java?", question.getText());
        assertEquals(2, question.getOptions().size());
        assertTrue(question.getOptions().stream().anyMatch(o -> o.isCorrect()));
    }

    @Test
    void shouldReturnNullWhenQuizNotFoundForUpdate() {
        when(quizRepo.existsById(99L)).thenReturn(false);

        Quiz result = quizService.updateQuiz(99L, buildValidQuizDto());

        assertNull(result);
    }

    @Test
    void shouldReturnFalseWhenQuizNotFoundForDelete() {
        when(quizRepo.existsById(99L)).thenReturn(false);

        boolean result = quizService.deleteQuiz(99L);

        assertFalse(result);
    }

    private Quiz quizWithParticipants(String... usernames) {
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        List<Participant> participants = new ArrayList<>();
        for (String username : usernames) {
            Participant p = new Participant();
            p.setUsername(username);
            p.setQuiz(quiz);
            participants.add(p);
        }
        quiz.setParticipants(participants);
        return quiz;
    }

    @Test
    void shouldJoinQuizWithTrimmedName() {
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quizWithParticipants()));
        when(participantRepo.save(any(Participant.class))).thenAnswer(inv -> inv.getArgument(0));

        Participant joined = quizService.joinQuiz(1L, "  Alice ");

        assertEquals("Alice", joined.getUsername());
        assertEquals(1L, joined.getQuiz().getId());
    }

    @Test
    void shouldRejectJoinForUnknownQuiz() {
        when(quizRepo.findByIdWithParticipants(99L)).thenReturn(Optional.empty());

        assertThrows(QuizNotFoundException.class, () -> quizService.joinQuiz(99L, "Alice"));
    }

    @Test
    void shouldRejectJoinAfterQuizStarted() {
        Quiz quiz = quizWithParticipants("Bob");
        quiz.setStarted(true);
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quiz));

        assertThrows(QuizStateException.class, () -> quizService.joinQuiz(1L, "Alice"));
        verify(participantRepo, never()).save(any());
    }

    @Test
    void shouldRejectJoinWhenNameAlreadyTaken() {
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quizWithParticipants("Alice")));

        assertThrows(QuizStateException.class, () -> quizService.joinQuiz(1L, "alice"));
        verify(participantRepo, never()).save(any());
    }

    @Test
    void shouldRejectJoinWhenQuizIsFull() {
        String[] names = new String[QuizService.MAX_PARTICIPANTS];
        for (int i = 0; i < names.length; i++) {
            names[i] = "Player " + i;
        }
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quizWithParticipants(names)));

        assertThrows(QuizStateException.class, () -> quizService.joinQuiz(1L, "Alice"));
        verify(participantRepo, never()).save(any());
    }

    @Test
    void shouldStartQuizAndResetStartTime() {
        Quiz quiz = quizWithParticipants("Alice", "Bob");
        LocalDateTime createdAt = LocalDateTime.now().minusMinutes(10);
        quiz.setStartTime(createdAt);
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quiz));

        LobbyStatusDTO status = quizService.startQuiz(1L);

        assertTrue(status.isStarted());
        assertEquals(2, status.getJoinedCount());
        assertEquals(List.of("Alice", "Bob"), status.getUsernames());
        assertTrue(quiz.getStartTime().isAfter(createdAt));
        verify(quizRepo).save(quiz);
    }

    @Test
    void shouldRejectStartWhenNobodyJoined() {
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quizWithParticipants()));

        assertThrows(QuizStateException.class, () -> quizService.startQuiz(1L));
        verify(quizRepo, never()).save(any());
    }

    @Test
    void shouldReportLobbyStatusBeforeStart() {
        when(quizRepo.findByIdWithParticipants(1L)).thenReturn(Optional.of(quizWithParticipants("Alice")));

        LobbyStatusDTO status = quizService.getLobbyStatus(1L);

        assertNotNull(status);
        assertFalse(status.isStarted());
        assertEquals(List.of("Alice"), status.getUsernames());
    }
}
