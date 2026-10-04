package com.quiz.QuizApp.mapper;

import com.quiz.QuizApp.domain.*;
import com.quiz.QuizApp.dto.*;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.stream.Collectors;

public class QuizMapper {

    public static @NonNull Quiz fromDto(QuizDTO dto) {
        Quiz quiz = new Quiz();
        quiz.setTitle(dto.getTitle());
        quiz.setDurationInSeconds(dto.getDurationInSeconds());

        List<Question> questions = dto.getQuestions().stream().map(qDto -> {
            Question q = new Question();
            q.setText(qDto.getText());
            q.setQuiz(quiz);

            List<AnswerOption> options = qDto.getOptions().stream().map(optDto -> {
                AnswerOption opt = new AnswerOption();
                opt.setText(optDto.getText());
                opt.setCorrect(optDto.isCorrect());
                opt.setQuestion(q);
                return opt;
            }).collect(Collectors.toList());

            q.setOptions(options);
            return q;
        }).collect(Collectors.toList());

        quiz.setQuestions(questions);

        return quiz;
    }

    public static QuizDTO toDto(Quiz quiz) {
        QuizDTO dto = new QuizDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDurationInSeconds(quiz.getDurationInSeconds());
        dto.setStartTime(quiz.getStartTime());
        dto.setClosed(quiz.isClosed());

        List<QuestionDTO> questionDTOs = quiz.getQuestions().stream().map(q -> {
            QuestionDTO qDto = new QuestionDTO();
            qDto.setId(q.getId());
            qDto.setText(q.getText());

            List<AnswerOptionDTO> optionDTOs = q.getOptions().stream().map(opt -> {
                AnswerOptionDTO optDto = new AnswerOptionDTO();
                optDto.setId(opt.getId());
                optDto.setText(opt.getText());
                optDto.setCorrect(opt.isCorrect());
                return optDto;
            }).collect(Collectors.toList());

            qDto.setOptions(optionDTOs);
            return qDto;
        }).collect(Collectors.toList());

        dto.setQuestions(questionDTOs);

        return dto;
    }


    public static QuizSummaryDTO toSummaryDto(Quiz quiz) {
        QuizSummaryDTO dto = new QuizSummaryDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setQuestionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0);
        dto.setParticipantCount(quiz.getParticipants() != null ? quiz.getParticipants().size() : 0);
        return dto;
    }
}
