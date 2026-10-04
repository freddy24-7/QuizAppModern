package com.quiz.QuizApp.exception;

public class QuizNotFoundException extends RuntimeException {
    public QuizNotFoundException(Long quizId) {
        super("Quiz " + quizId + " was not found.");
    }
}
