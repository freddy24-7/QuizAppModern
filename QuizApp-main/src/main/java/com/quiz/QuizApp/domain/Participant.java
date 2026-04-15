package com.quiz.QuizApp.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Participant {
    @Id
    @GeneratedValue
    private Long id;

    @Pattern(regexp = "\\+?[0-9]{10,15}")
    private String phoneNumber;

    private String username;

    private boolean ready = false;

    @ManyToOne
    private Quiz quiz;
}
