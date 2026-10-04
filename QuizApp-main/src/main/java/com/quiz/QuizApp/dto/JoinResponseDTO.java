package com.quiz.QuizApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JoinResponseDTO {
    private Long participantId;
    private String username;
}
