package com.quiz.QuizApp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimiterTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        rateLimiterService = new RateLimiterService();
    }

    @Test
    void shouldAllowTenQuizSubmissionsFromSameIp() {
        String ip = "10.0.0.1";
        for (int i = 0; i < 10; i++) {
            assertTrue(rateLimiterService.tryConsumeQuizSubmission(ip),
                    "Request " + (i + 1) + " should be allowed");
        }
    }

    @Test
    void shouldBlockEleventhQuizSubmissionFromSameIp() {
        String ip = "10.0.0.2";
        for (int i = 0; i < 10; i++) {
            rateLimiterService.tryConsumeQuizSubmission(ip);
        }
        assertFalse(rateLimiterService.tryConsumeQuizSubmission(ip),
                "11th request should be blocked");
    }

    @Test
    void shouldAllowHundredJoinsFromSameIp() {
        String ip = "10.0.0.3";
        for (int i = 0; i < 100; i++) {
            assertTrue(rateLimiterService.tryConsumeJoin(ip),
                    "Join request " + (i + 1) + " should be allowed");
        }
    }

    @Test
    void shouldBlockHundredAndFirstJoinFromSameIp() {
        String ip = "10.0.0.4";
        for (int i = 0; i < 100; i++) {
            rateLimiterService.tryConsumeJoin(ip);
        }
        assertFalse(rateLimiterService.tryConsumeJoin(ip),
                "101st join request should be blocked");
    }

    @Test
    void shouldTrackBucketsSeparatelyPerIp() {
        rateLimiterService.tryConsumeQuizSubmission("10.0.0.5");

        // Different IP should still have full quota
        assertTrue(rateLimiterService.tryConsumeQuizSubmission("10.0.0.6"));
    }

    @Test
    void shouldTrackQuizAndJoinBucketsSeparately() {
        String ip = "10.0.0.7";
        // Exhaust quiz bucket
        for (int i = 0; i < 10; i++) {
            rateLimiterService.tryConsumeQuizSubmission(ip);
        }
        // Join bucket should still be available
        assertTrue(rateLimiterService.tryConsumeJoin(ip));
    }
}
