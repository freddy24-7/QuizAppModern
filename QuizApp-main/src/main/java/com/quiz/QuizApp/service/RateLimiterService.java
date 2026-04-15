package com.quiz.QuizApp.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final ConcurrentHashMap<String, Bucket> quizBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> smsBuckets = new ConcurrentHashMap<>();

    private static Bucket newQuizBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillIntervally(10, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private static Bucket newSmsBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(20)
                .refillIntervally(20, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    public boolean tryConsumeQuizSubmission(String ip) {
        return quizBuckets.computeIfAbsent(ip, k -> newQuizBucket()).tryConsume(1);
    }

    public boolean tryConsumeSmsSubmission(String ip) {
        return smsBuckets.computeIfAbsent(ip, k -> newSmsBucket()).tryConsume(1);
    }
}
