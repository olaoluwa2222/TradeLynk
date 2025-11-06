package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);

    List<Report> findByItemId(Long itemId);

    Long countByItemId(Long itemId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.itemId = :itemId AND r.status = 'PENDING'")
    Long countPendingReportsByItemId(Long itemId);

    List<Report> findByReporterId(Long reporterId);

    boolean existsByItemIdAndReporterId(Long itemId, Long reporterId);
}
