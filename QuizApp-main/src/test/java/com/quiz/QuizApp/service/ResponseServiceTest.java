package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.*;
import com.quiz.QuizApp.dto.ResponseDTO;
import com.quiz.QuizApp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ResponseServiceTest {

    @Mock private ResponseRepository responseRepo;
    @Mock private ParticipantRepository participantRepo;
    @Mock private QuestionRepository questionRepo;
    @Mock private QuizRepository quizRepo;

    @InjectMocks
    private ResponseService responseService;

    private Quiz quiz;
    private Participant participant;
    private Question question;
    private AnswerOption correctOption;

    @BeforeEach
    void setUp() {
        quiz = new Quiz();
        quiz.setId(1L);
        quiz.setDurationInSeconds(120);
        quiz.setClosed(false);

        participant = new Participant();
        participant.setId(10L);
        participant.setPhoneNumber("+31612345678");
        participant.setQuiz(quiz);

        correctOption = new AnswerOption();
        correctOption.setId(100L);
        correctOption.setText("Correct Answer");
        correctOption.setCorrect(true);

        AnswerOption wrongOption = new AnswerOption();
        wrongOption.setId(101L);
        wrongOption.setText("Wrong Answer");
        wrongOption.setCorrect(false);

        question = new Question();
        question.setId(50L);
        question.setText("What is Java?");
        question.setQuiz(quiz);
        question.setOptions(List.of(correctOption, wrongOption));
    }

    private ResponseDTO buildDto(String phone, Long quizId, Long questionId, String answer) {
        ResponseDTO dto = new ResponseDTO();
        dto.setPhoneNumber(phone);
        dto.setUsername("TestUser");
        dto.setQuizId(quizId);
        dto.setQuestionId(questionId);
        dto.setSelectedAnswer(answer);
        return dto;
    }

    @Test
    void shouldSubmitAnswerSuccessfully() {
        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.of(participant));
        when(questionRepo.findById(50L)).thenReturn(Optional.of(question));
        when(responseRepo.findByParticipant_IdAndQuestion_Id(10L, 50L))
                .thenReturn(Optional.empty());
        when(responseRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<String> result = responseService.submitResponse(
                buildDto("+31612345678", 1L, 50L, "Correct Answer"));

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(responseRepo).save(any(Response.class));
    }

    @Test
    void shouldRejectSubmissionWhenParticipantNotInThisQuiz() {
        // Same phone number exists in quiz 2 but NOT in quiz 1 — the old findAll() bug
        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.empty());

        ResponseEntity<String> result = responseService.submitResponse(
                buildDto("+31612345678", 1L, 50L, "Correct Answer"));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        verify(responseRepo, never()).save(any());
    }

    @Test
    void shouldAllowTwoPlayersInSameQuizToSubmitIndependently() {
        Participant player2 = new Participant();
        player2.setId(11L);
        player2.setPhoneNumber("+31687654321");
        player2.setQuiz(quiz);

        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.of(participant));
        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31687654321", 1L))
                .thenReturn(Optional.of(player2));
        when(questionRepo.findById(50L)).thenReturn(Optional.of(question));
        when(responseRepo.findByParticipant_IdAndQuestion_Id(anyLong(), eq(50L)))
                .thenReturn(Optional.empty());
        when(responseRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<String> r1 = responseService.submitResponse(
                buildDto("+31612345678", 1L, 50L, "Correct Answer"));
        ResponseEntity<String> r2 = responseService.submitResponse(
                buildDto("+31687654321", 1L, 50L, "Wrong Answer"));

        assertEquals(HttpStatus.OK, r1.getStatusCode());
        assertEquals(HttpStatus.OK, r2.getStatusCode());
        verify(responseRepo, times(2)).save(any(Response.class));
    }

    @Test
    void shouldRejectSubmissionForUnknownQuestion() {
        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.of(participant));
        when(questionRepo.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<String> result = responseService.submitResponse(
                buildDto("+31612345678", 1L, 999L, "Any Answer"));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        verify(responseRepo, never()).save(any());
    }

    @Test
    void shouldRejectSubmissionWhenQuizIsClosed() {
        quiz.setClosed(true);
        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.of(participant));
        when(questionRepo.findById(50L)).thenReturn(Optional.of(question));

        ResponseEntity<String> result = responseService.submitResponse(
                buildDto("+31612345678", 1L, 50L, "Correct Answer"));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        verify(responseRepo, never()).save(any());
    }

    @Test
    void shouldUpdateExistingResponseInsteadOfCreatingDuplicate() {
        Response existing = new Response();
        existing.setId(200L);
        existing.setParticipant(participant);
        existing.setQuestion(question);
        existing.setSelectedAnswer("Old Answer");

        when(participantRepo.findByPhoneNumberAndQuiz_Id("+31612345678", 1L))
                .thenReturn(Optional.of(participant));
        when(questionRepo.findById(50L)).thenReturn(Optional.of(question));
        when(responseRepo.findByParticipant_IdAndQuestion_Id(10L, 50L))
                .thenReturn(Optional.of(existing));
        when(responseRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        responseService.submitResponse(buildDto("+31612345678", 1L, 50L, "New Answer"));

        verify(responseRepo, times(1)).save(argThat(r ->
                ((Response) r).getSelectedAnswer().equals("New Answer")));
    }
}
