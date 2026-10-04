package com.quiz.QuizApp.dto;

import lombok.Data;

@Data
public class ResponseDTO {
    private Long participantId;
    private Long questionId;
    private String selectedAnswer;
    private Long quizId;
}
