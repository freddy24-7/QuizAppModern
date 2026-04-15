package com.quiz.QuizApp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnswerOptionDTO {

    private Long id;

    @NotBlank(message = "Option text is required")
    @Size(max = 200, message = "Option text must be 200 characters or fewer")
    private String text;

    private boolean correct;
}
