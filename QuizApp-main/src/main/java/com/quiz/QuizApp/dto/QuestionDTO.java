package com.quiz.QuizApp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class QuestionDTO {

    private Long id;

    @NotBlank(message = "Question text is required")
    @Size(min = 10, max = 500, message = "Question text must be between 10 and 500 characters")
    private String text;

    @NotEmpty(message = "Question must have at least one option")
    @Valid
    private List<AnswerOptionDTO> options;
}
