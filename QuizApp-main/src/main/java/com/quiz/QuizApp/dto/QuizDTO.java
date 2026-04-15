package com.quiz.QuizApp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 120, message = "Title must be between 3 and 120 characters")
    private String title;

    @NotNull(message = "Duration in seconds is required")
    @Min(value = 30, message = "Duration must be at least 30 seconds")
    private Integer durationInSeconds;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    private Boolean closed = false;

    @NotEmpty(message = "Quiz must contain at least one question")
    @Valid
    private List<QuestionDTO> questions;

    @Valid
    private List<ParticipantDTO> participants;
}
