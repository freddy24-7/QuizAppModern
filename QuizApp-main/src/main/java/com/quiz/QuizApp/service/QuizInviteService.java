package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizInviteService {

    private static final Logger logger = LoggerFactory.getLogger(QuizInviteService.class);

    private final TwilioService twilioService;
    private final QuizService quizService;

    public QuizInviteService(TwilioService twilioService, QuizService quizService) {
        this.twilioService = twilioService;
        this.quizService = quizService;
    }

    public void sendQuizInvites(Long quizId) {
        Quiz quiz = quizService.getQuizById(quizId);
        if (quiz == null) {
            logger.warn("sendQuizInvites called for unknown quiz ID {}", quizId);
            return;
        }

        List<String> phoneNumbers = quiz.getParticipants().stream()
                .map(Participant::getPhoneNumber)
                .collect(Collectors.toList());

        twilioService.sendQuizInvites(phoneNumbers, quizId);
    }
}
