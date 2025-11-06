package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.ReviewReportRequest;
import com.codewithola.tradelynkapi.dtos.response.ReportDTO;
import com.codewithola.tradelynkapi.entity.Report;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
@Slf4j
class AdminReportController {

    private final ReportService reportService;

    /**
     * GET /api/admin/reports
     * Get all reports (admin only, paginated)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllReports(
            @RequestParam(required = false) Report.ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/admin/reports - Admin: {} fetching reports", userPrincipal.getEmail());

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<ReportDTO> reports = reportService.getAllReports(pageable, status);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", reports.getContent());
        response.put("currentPage", reports.getNumber());
        response.put("totalItems", reports.getTotalElements());
        response.put("totalPages", reports.getTotalPages());
        response.put("hasNext", reports.hasNext());
        response.put("hasPrevious", reports.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/admin/reports/{id}/review
     * Review a report (admin only)
     */
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> reviewReport(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReportRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/admin/reports/{}/review - Admin: {} reviewing report. Approved: {}",
                id, userPrincipal.getEmail(), request.getApproved());

        ReportDTO report = reportService.reviewReport(
                id,
                userPrincipal.getId(),
                request.getApproved()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", request.getApproved() ?
                "Report approved. Item has been hidden." :
                "Report rejected. Item status updated if no other pending reports.");
        response.put("data", report);

        return ResponseEntity.ok(response);
    }
}
