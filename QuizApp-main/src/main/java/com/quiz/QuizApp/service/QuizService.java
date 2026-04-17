package com.quiz.QuizApp.service;

import com.quiz.QuizApp.domain.Participant;
import com.quiz.QuizApp.domain.Quiz;
import com.quiz.QuizApp.dto.LobbyStatusDTO;
import com.quiz.QuizApp.dto.QuizDTO;
import com.quiz.QuizApp.mapper.QuizMapper;
import com.quiz.QuizApp.repository.ParticipantRepository;
import com.quiz.QuizApp.repository.QuizRepository;
import com.quiz.QuizApp.repository.ResponseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuizService {

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
    public ResponseEntity<?> markParticipantReady(Long quizId, String phoneNumber, String username) {
        Quiz quiz = quizRepo.findByIdWithParticipants(quizId).orElse(null);
        if (quiz == null) {
            return ResponseEntity.notFound().build();
        }

        Participant participant = quiz.getParticipants().stream()
                .filter(p -> p.getPhoneNumber().equals(phoneNumber))
                .findFirst()
                .orElse(null);

        if (participant == null) {
            return ResponseEntity.badRequest().body("Participant not found for this quiz.");
        }

        participant.setReady(true);
        participant.setUsername(username);
        participantRepo.save(participant);

        return ResponseEntity.ok("Participant marked as ready.");
    }

    @Transactional(readOnly = true)
    public @Nullable LobbyStatusDTO getLobbyStatus(Long quizId) {
        Quiz quiz = quizRepo.findByIdWithParticipants(quizId).orElse(null);
        if (quiz == null) {
            return null;
        }

        List<Participant> participants = quiz.getParticipants();
        int total = participants.size();
        List<Participant> readyParticipants = participants.stream()
                .filter(Participant::isReady)
                .toList();
        int readyCount = readyParticipants.size();

        List<String> readyUsernames = readyParticipants.stream()
                .map(p -> p.getUsername() != null ? p.getUsername() : "Anonymous")
                .toList();

        return new LobbyStatusDTO(total, readyCount, readyCount == total, readyUsernames);
    }
}
