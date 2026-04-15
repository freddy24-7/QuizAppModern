package com.quiz.QuizApp.controllers;

import com.quiz.QuizApp.dto.QuizDTO;
import com.quiz.QuizApp.dto.QuizSummaryDTO;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.exception.RateLimitExceededException;
import com.quiz.QuizApp.mapper.QuizMapper;
import com.quiz.QuizApp.service.QuizInviteService;
import com.quiz.QuizApp.service.QuizService;
import com.quiz.QuizApp.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    private final QuizService quizService;
    private final QuizInviteService quizInviteService;
    private final RateLimiterService rateLimiterService;

    public QuizController(QuizService quizService,
                          QuizInviteService quizInviteService,
                          RateLimiterService rateLimiterService) {
        this.quizService = quizService;
        this.quizInviteService = quizInviteService;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping
    public ResponseEntity<QuizDTO> createQuiz(@Valid @RequestBody QuizDTO dto,
                                               HttpServletRequest request,
                                               HttpServletResponse response) {
        String ip = resolveClientIp(request);

        if (!rateLimiterService.tryConsumeQuizSubmission(ip)) {
            response.setHeader("Retry-After", "3600");
            throw new RateLimitExceededException(
                    "You've reached the quiz creation limit. Please try again in an hour.");
        }

        if (!rateLimiterService.tryConsumeSmsSubmission(ip)) {
            response.setHeader("Retry-After", "3600");
            throw new RateLimitExceededException(
                    "You've reached the SMS sending limit. Please try again in an hour.");
        }

        logger.info("Creating quiz with title: {}", dto.getTitle());
        var created = quizService.createQuiz(dto);
        logger.info("Quiz created with ID: {}", created.getId());

        quizInviteService.sendQuizInvites(created.getId());
        logger.info("Invites sent for quiz ID: {}", created.getId());

        return ResponseEntity.ok(QuizMapper.toDto(created));
    }

    @GetMapping
    public List<QuizDTO> getAll() {
        logger.info("Fetching all quizzes");
        return quizService.getAllQuizzes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDTO> getOne(@PathVariable Long id) {
        logger.info("Fetching quiz ID: {}", id);
        Quiz quiz = quizService.getQuizById(id);
        if (quiz == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(QuizMapper.toDto(quiz));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizDTO> updateQuiz(@PathVariable Long id,
                                               @Valid @RequestBody QuizDTO dto) {
        logger.info("Updating quiz ID: {}", id);
        var updated = quizService.updateQuiz(id, dto);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(QuizMapper.toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        logger.info("Deleting quiz ID: {}", id);
        boolean deleted = quizService.deleteQuiz(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/summaries")
    public Page<QuizSummaryDTO> getSummaries(@PageableDefault(size = 5) Pageable pageable) {
        return quizService.getQuizPage(pageable).map(QuizMapper::toSummaryDto);
    }

    @DeleteMapping
    public ResponseEntity<String> deleteAllQuizzes() {
        logger.info("Deleting all quizzes");
        quizService.deleteAllQuizzes();
        return ResponseEntity.ok("All quizzes have been deleted.");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
