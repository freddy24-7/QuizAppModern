package com.quiz.QuizApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LobbyStatusDTO {
    private int joinedCount;
    private boolean started;
    private List<String> usernames;
}
