package com.quiz.QuizApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LobbyStatusDTO {
    private int totalParticipants;
    private int readyCount;
    private boolean allReady;
    private List<String> readyUsernames;
}
