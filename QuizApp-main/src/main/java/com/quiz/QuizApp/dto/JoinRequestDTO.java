package com.quiz.QuizApp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JoinRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 40, message = "Name must be 40 characters or fewer")
    private String username;
}
