package com.quiz.QuizApp.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class TwilioService {

    private static final Logger logger = LoggerFactory.getLogger(TwilioService.class);

    @Value("${twilio.account.sid}")
    private String ACCOUNT_SID;

    @Value("${twilio.auth.token}")
    private String AUTH_TOKEN;

    @Value("${twilio.phone.number}")
    private String TWILIO_PHONE_NUMBER;

    @Value("${app.frontend.url}")
    private String FRONTEND_URL;

    public boolean isConfigured() {
        return ACCOUNT_SID != null && !ACCOUNT_SID.isBlank()
                && AUTH_TOKEN != null && !AUTH_TOKEN.isBlank()
                && TWILIO_PHONE_NUMBER != null && !TWILIO_PHONE_NUMBER.isBlank();
    }

    public void sendQuizInvites(List<String> phoneNumbers, Long quizId) {
        if (!isConfigured()) {
            logger.warn("Twilio credentials not configured — skipping SMS delivery for quiz {}", quizId);
            return;
        }

        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);

        String baseUrl = FRONTEND_URL.endsWith("/")
                ? FRONTEND_URL.substring(0, FRONTEND_URL.length() - 1)
                : FRONTEND_URL;

        for (String phoneNumber : phoneNumbers) {
            String encodedPhone = URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8);
            String messageBody = String.format(
                    "You've been invited to take a quiz! Click the link below to participate:\n\n%s/quiz/respond?quizId=%d&phoneNumber=%s",
                    baseUrl, quizId, encodedPhone
            );
            try {
                Message.creator(
                        new PhoneNumber(phoneNumber),
                        new PhoneNumber(TWILIO_PHONE_NUMBER),
                        messageBody
                ).create();
                logger.info("SMS invite sent to {}", phoneNumber);
            } catch (Exception e) {
                logger.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            }
        }
    }
}
