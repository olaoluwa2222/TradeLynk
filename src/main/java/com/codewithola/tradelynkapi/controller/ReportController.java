package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.ReportRequest;
import com.codewithola.tradelynkapi.dtos.response.ReportDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    /**
     * POST /api/reports
     * Report an item (authenticated)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> reportItem(
            @Valid @RequestBody ReportRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/reports - User: {} reporting item: {}",
                userPrincipal.getEmail(), request.getItemId());

        ReportDTO report = reportService.reportItem(
                request.getItemId(),
                userPrincipal.getId(),
                request
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item reported successfully. Our team will review it shortly.");
        response.put("data", report);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/reports/{id}
     * Get report details (authenticated)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getReportById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/reports/{} - User: {}", id, userPrincipal.getEmail());

        ReportDTO report = reportService.getReportById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", report);

        return ResponseEntity.ok(response);
    }
}

// ==================== ADMIN ENDPOINTS ====================

