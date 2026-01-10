package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.ImproveTextRequest;
import com.codewithola.tradelynkapi.dtos.response.ImproveTextResponse;
import com.codewithola.tradelynkapi.services.AITextImprovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AIController {

    private final AITextImprovementService aiService;

    /**
     * POST /api/v1/ai/improve-text
     * Improve text using AI (bio or tagline)
     * Public endpoint - no authentication required
     */
    @PostMapping("/improve-text")
    public ResponseEntity<Map<String, Object>> improveText(
            @Valid @RequestBody ImproveTextRequest request) {

        log.info("POST /api/v1/ai/improve-text - Type: {}, Length: {}",
                request.getType(), request.getText().length());

        ImproveTextResponse result = aiService.improveText(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Text improved successfully");
        response.put("data", result);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/ai/health
     * Check if AI service is available
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        log.info("GET /api/v1/ai/health - Checking AI service health");

        boolean available = aiService.isServiceAvailable();

        Map<String, Object> response = new HashMap<>();
        response.put("success", available);
        response.put("available", available);
        response.put("message", available ? "AI service is operational" : "AI service is unavailable");

        return ResponseEntity.ok(response);
    }
}