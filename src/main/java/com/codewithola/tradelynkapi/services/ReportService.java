package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.requests.ReportRequest;
import com.codewithola.tradelynkapi.dtos.response.ReportDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Report;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.ReportRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    private static final int AUTO_HIDE_THRESHOLD = 3; // Auto-hide item after 3 reports

    @Transactional
    public ReportDTO reportItem(Long itemId, Long reporterId, ReportRequest request) {
        log.info("User {} reporting item {}", reporterId, itemId);

        // 1. Check if item exists
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // 2. Check if user already reported this item
        if (reportRepository.existsByItemIdAndReporterId(itemId, reporterId)) {
            throw new BadRequestException("You have already reported this item");
        }

        // 3. Get reporter user
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // 4. Create report
        Report report = Report.builder()
                .itemId(itemId)
                .reporterId(reporterId)
                .reason(request.getReason())
                .comment(request.getComment())
                .status(Report.ReportStatus.PENDING)
                .build();

        reportRepository.save(report);

        // 5. Check if item should be auto-hidden (3+ reports)
        Long reportCount = reportRepository.countPendingReportsByItemId(itemId);

        if (reportCount >= AUTO_HIDE_THRESHOLD && item.getStatus() == Item.Status.ACTIVE) {
            item.setStatus(Item.Status.HIDDEN);
            itemRepository.save(item);
            log.warn("Item {} auto-hidden due to {} reports", itemId, reportCount);
        }

        log.info("Report created successfully. Report count for item: {}", reportCount);

        return convertToDTO(report, item, reporter, null);
    }

    @Transactional(readOnly = true)
    public Page<ReportDTO> getAllReports(Pageable pageable, Report.ReportStatus status) {
        log.info("Fetching all reports with status: {}", status);

        Page<Report> reports;

        if (status != null) {
            reports = reportRepository.findByStatus(status, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }

        return reports.map(report -> {
            Item item = itemRepository.findById(report.getItemId()).orElse(null);
            User reporter = userRepository.findById(report.getReporterId()).orElse(null);
            User reviewer = report.getReviewedBy() != null ?
                    userRepository.findById(report.getReviewedBy()).orElse(null) : null;

            return convertToDTO(report, item, reporter, reviewer);
        });
    }

    @Transactional
    public ReportDTO reviewReport(Long reportId, Long adminId, boolean approved) {
        log.info("Admin {} reviewing report {} - Approved: {}", adminId, reportId, approved);

        // 1. Fetch report
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found"));

        // 2. Fetch item
        Item item = itemRepository.findById(report.getItemId())
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // 3. Mark report as reviewed
        report.markAsReviewed(adminId, approved);

        // 4. Handle item status based on approval
        if (approved) {
            // Report approved: keep item hidden or hide it
            if (item.getStatus() != Item.Status.HIDDEN) {
                item.setStatus(Item.Status.HIDDEN);
                itemRepository.save(item);
                log.info("Item {} hidden after report approval", item.getId());
            }
        } else {
            // Report rejected: check if there are other pending reports
            Long pendingReports = reportRepository.countPendingReportsByItemId(item.getId());

            if (pendingReports == 0 && item.getStatus() == Item.Status.HIDDEN) {
                // No more pending reports, unhide item
                item.setStatus(Item.Status.ACTIVE);
                itemRepository.save(item);
                log.info("Item {} unhidden after report rejection", item.getId());
            }
        }

        reportRepository.save(report);

        log.info("Report {} reviewed successfully", reportId);

        User reporter = userRepository.findById(report.getReporterId()).orElse(null);
        User reviewer = userRepository.findById(adminId).orElse(null);

        return convertToDTO(report, item, reporter, reviewer);
    }

    @Transactional(readOnly = true)
    public ReportDTO getReportById(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found"));

        Item item = itemRepository.findById(report.getItemId()).orElse(null);
        User reporter = userRepository.findById(report.getReporterId()).orElse(null);
        User reviewer = report.getReviewedBy() != null ?
                userRepository.findById(report.getReviewedBy()).orElse(null) : null;

        return convertToDTO(report, item, reporter, reviewer);
    }

    private ReportDTO convertToDTO(Report report, Item item, User reporter, User reviewer) {
        return ReportDTO.builder()
                .id(report.getId())
                .itemId(report.getItemId())
                .itemTitle(item != null ? item.getTitle() : "Unknown")
                .reporterId(report.getReporterId())
                .reporterName(reporter != null ? reporter.getName() : "Unknown")
                .reason(report.getReason())
                .comment(report.getComment())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .reviewedAt(report.getReviewedAt())
                .reviewedBy(report.getReviewedBy())
                .reviewedByName(reviewer != null ? reviewer.getName() : null)
                .build();
    }
}
