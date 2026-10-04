package com.quiz.QuizApp.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final ConcurrentHashMap<String, Bucket> quizBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> joinBuckets = new ConcurrentHashMap<>();

    private static Bucket newQuizBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillIntervally(10, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    // Generous: a whole room of participants often shares one IP (same Wi-Fi)
    private static Bucket newJoinBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(100)
                .refillIntervally(100, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    public boolean tryConsumeQuizSubmission(String ip) {
        return quizBuckets.computeIfAbsent(ip, k -> newQuizBucket()).tryConsume(1);
    }

    public boolean tryConsumeJoin(String ip) {
        return joinBuckets.computeIfAbsent(ip, k -> newJoinBucket()).tryConsume(1);
    }
}
