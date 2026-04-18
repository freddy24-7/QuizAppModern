package com.quiz.QuizApp.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class HealthController {

    private static final List<String> MODELS = List.of(
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash"
    );

    private static final String PROBE_BODY = """
            {"contents":[{"parts":[{"text":"Reply with exactly one word: OK"}]}]}""";

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @GetMapping("/")
    public String ping() {
        return "QuizApp is running!";
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        List<Map<String, Object>> modelResults = new ArrayList<>();
        boolean anyOk = false;

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", "skipped");
            result.put("reason", "GEMINI_API_KEY not configured");
            modelResults.add(result);
        } else {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8))
                    .build();

            for (String model : MODELS) {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("model", model);
                try {
                    String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                            + model + ":generateContent?key=" + geminiApiKey;

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .timeout(Duration.ofSeconds(8))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(PROBE_BODY))
                            .build();

                    HttpResponse<Void> response = client.send(request,
                            HttpResponse.BodyHandlers.discarding());

                    int status = response.statusCode();
                    result.put("httpStatus", status);
                    result.put("ok", status == 200);
                    if (status == 200) anyOk = true;

                } catch (Exception e) {
                    result.put("ok", false);
                    result.put("error", e.getMessage());
                }
                modelResults.add(result);
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", anyOk || geminiApiKey == null || geminiApiKey.isBlank() ? "ok" : "degraded");
        body.put("models", modelResults);

        return anyOk || geminiApiKey == null || geminiApiKey.isBlank()
                ? ResponseEntity.ok(body)
                : ResponseEntity.status(503).body(body);
    }
}
