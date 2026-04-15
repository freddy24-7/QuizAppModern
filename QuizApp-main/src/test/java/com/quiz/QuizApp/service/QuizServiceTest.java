package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.dto.AnswerOptionDTO;
import com.quiz.QuizApp.dto.ParticipantDTO;
import com.quiz.QuizApp.dto.QuestionDTO;
import com.quiz.QuizApp.dto.QuizDTO;
import com.quiz.QuizApp.repository.ParticipantRepository;
import com.quiz.QuizApp.repository.QuizRepository;
import com.quiz.QuizApp.repository.ResponseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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

        ParticipantDTO participant = new ParticipantDTO();
        participant.setPhoneNumber("+31612345678");

        QuizDTO dto = new QuizDTO();
        dto.setTitle("Unit Test Quiz");
        dto.setDurationInSeconds(120);
        dto.setQuestions(List.of(question));
        dto.setParticipants(List.of(participant));
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
        assertEquals(1, quiz.getParticipants().size());
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
    void shouldMapParticipantPhoneNumberCorrectly() {
        QuizDTO dto = buildValidQuizDto();
        when(quizRepo.save(any(Quiz.class))).thenAnswer(inv -> inv.getArgument(0));

        Quiz quiz = quizService.createQuiz(dto);

        assertEquals("+31612345678", quiz.getParticipants().get(0).getPhoneNumber());
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
}
