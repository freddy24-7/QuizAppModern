package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.dto.LobbyStatusDTO;
import com.quiz.QuizApp.dto.QuizDTO;
import com.quiz.QuizApp.exception.QuizNotFoundException;
import com.quiz.QuizApp.exception.QuizStateException;
import com.quiz.QuizApp.mapper.QuizMapper;
import com.quiz.QuizApp.repository.ParticipantRepository;
import com.quiz.QuizApp.repository.QuizRepository;
import com.quiz.QuizApp.repository.ResponseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuizService {

    static final int MAX_PARTICIPANTS = 100;

    private final QuizRepository quizRepo;
    private final ParticipantRepository participantRepo;
    private final ResponseRepository responseRepo;

    public QuizService(
            QuizRepository quizRepo,
            ParticipantRepository participantRepo,
            ResponseRepository responseRepo
    ) {
        this.quizRepo = quizRepo;
        this.participantRepo = participantRepo;
        this.responseRepo = responseRepo;
    }

    public @NonNull Quiz createQuiz(QuizDTO dto) {
        return quizRepo.save(QuizMapper.fromDto(dto));
    }

    @Transactional(readOnly = true)
    public List<QuizDTO> getAllQuizzes() {
        return quizRepo.findAll().stream()
                .map(QuizMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public @Nullable Quiz getQuizById(Long id) {
        return quizRepo.findByIdWithParticipants(id).orElse(null);
    }

    public @Nullable Quiz updateQuiz(@NonNull Long id, QuizDTO dto) {
        if (!quizRepo.existsById(id)) return null;
        Quiz quiz = QuizMapper.fromDto(dto);
        quiz.setId(id);
        return quizRepo.save(quiz);
    }

    @Transactional
    public boolean deleteQuiz(@NonNull Long id) {
        if (!quizRepo.existsById(id)) return false;

        var participantIds = participantRepo.findByQuiz_Id(id)
                .stream()
                .map(Participant::getId)
                .toList();

        responseRepo.deleteAllByParticipantIdIn(participantIds);
        participantRepo.deleteAllByQuiz_Id(id);
        quizRepo.deleteById(id);

        return true;
    }

    @Transactional
    public void deleteAllQuizzes() {
        responseRepo.deleteAll();
        participantRepo.deleteAll();
        quizRepo.deleteAll();
    }

    @Transactional(readOnly = true)
    public Page<Quiz> getQuizPage(@NonNull Pageable pageable) {
        return quizRepo.findAll(pageable);
    }

    @Transactional
    public @NonNull Participant joinQuiz(Long quizId, String username) {
        Quiz quiz = quizRepo.findByIdWithParticipants(quizId)
                .orElseThrow(() -> new QuizNotFoundException(quizId));

        if (quiz.isClosed()) {
            throw new QuizStateException("This quiz is closed.");
        }
        if (quiz.isStarted()) {
            throw new QuizStateException("This quiz has already started.");
        }
        if (quiz.getParticipants().size() >= MAX_PARTICIPANTS) {
            throw new QuizStateException("This quiz is full.");
        }

        String name = username.trim();
        boolean nameTaken = quiz.getParticipants().stream()
                .anyMatch(p -> name.equalsIgnoreCase(p.getUsername()));
        if (nameTaken) {
            throw new QuizStateException("That name is already taken. Please choose another.");
        }

        Participant participant = new Participant();
        participant.setUsername(name);
        participant.setQuiz(quiz);
        return participantRepo.save(participant);
    }

    @Transactional
    public @NonNull LobbyStatusDTO startQuiz(Long quizId) {
        Quiz quiz = quizRepo.findByIdWithParticipants(quizId)
                .orElseThrow(() -> new QuizNotFoundException(quizId));

        if (!quiz.isStarted()) {
            if (quiz.getParticipants().isEmpty()) {
                throw new QuizStateException("No participants have joined yet.");
            }
            quiz.setStarted(true);
            // The answer window runs from the moment the host starts, not from creation
            quiz.setStartTime(LocalDateTime.now());
            quizRepo.save(quiz);
        }

        return toLobbyStatus(quiz);
    }

    @Transactional(readOnly = true)
    public @Nullable LobbyStatusDTO getLobbyStatus(Long quizId) {
        return quizRepo.findByIdWithParticipants(quizId)
                .map(this::toLobbyStatus)
                .orElse(null);
    }

    private LobbyStatusDTO toLobbyStatus(Quiz quiz) {
        List<String> usernames = quiz.getParticipants().stream()
                .map(Participant::getUsername)
                .toList();
        return new LobbyStatusDTO(usernames.size(), quiz.isStarted(), usernames);
    }
}
