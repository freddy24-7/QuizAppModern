package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsServiceTest {

    @Mock
    private TwilioService twilioService;

    @Mock
    private QuizService quizService;

    @InjectMocks
    private QuizInviteService quizInviteService;

    @Test
    void shouldSendInvitesToAllParticipants() {
        Participant p1 = new Participant();
        p1.setPhoneNumber("+31612345678");

        Participant p2 = new Participant();
        p2.setPhoneNumber("+31687654321");

        Quiz quiz = new Quiz();
        quiz.setParticipants(List.of(p1, p2));

        when(quizService.getQuizById(1L)).thenReturn(quiz);

        quizInviteService.sendQuizInvites(1L);

        verify(twilioService).sendQuizInvites(List.of("+31612345678", "+31687654321"), 1L);
    }

    @Test
    void shouldThrowWhenQuizNotFound() {
        when(quizService.getQuizById(99L)).thenReturn(null);

        assertThrows(RuntimeException.class, () -> quizInviteService.sendQuizInvites(99L));
        verify(twilioService, never()).sendQuizInvites(anyList(), eq(99L));
    }

    @Test
    void shouldNotCallTwilioWhenNoParticipants() {
        Quiz quiz = new Quiz();
        quiz.setParticipants(List.of());

        when(quizService.getQuizById(2L)).thenReturn(quiz);

        quizInviteService.sendQuizInvites(2L);

        verify(twilioService).sendQuizInvites(List.of(), 2L);
    }
}
