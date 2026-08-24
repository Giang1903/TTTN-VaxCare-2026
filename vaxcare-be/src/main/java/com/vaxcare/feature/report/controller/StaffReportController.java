package com.vaxcare.feature.report.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.report.dto.StaffReportResponse;
import com.vaxcare.feature.report.service.StaffReportService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/staff/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
@Tag(name = "19. Staff - Reports",
        description = "Báo cáo vận hành: days=7/30/90 hoặc fromDate/toDate tùy ý; export CSV")
public class StaffReportController {

    private final StaffReportService staffReportService;

    @GetMapping
    public ApiResponse<StaffReportResponse> getReport(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(description = "Chỉ ADMIN dùng; STAFF luôn bị ép về cơ sở của mình")
            @RequestParam(required = false) Long facilityId,
            @Parameter(description = "Shortcut số ngày (1–366). Bị bỏ qua nếu có fromDate/toDate")
            @RequestParam(required = false) Integer days,
            @Parameter(description = "Ngày bắt đầu (yyyy-MM-dd). Có thể dùng cùng toDate")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "Ngày kết thúc (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ApiResponse.success(
                "Lấy báo cáo thành công",
                staffReportService.getReport(userPrincipal.getId(), facilityId, days, fromDate, toDate));
    }

    @GetMapping(value = "/export/appointments", produces = "text/csv")
    public ResponseEntity<byte[]> exportAppointmentsCsv(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        byte[] csv = staffReportService.exportAppointmentsCsv(
                userPrincipal.getId(), facilityId, days, fromDate, toDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"vaxcare-appointments.csv\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv);
    }

    @GetMapping(value = "/export/summary", produces = "text/csv")
    public ResponseEntity<byte[]> exportSummaryCsv(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        byte[] csv = staffReportService.exportSummaryCsv(
                userPrincipal.getId(), facilityId, days, fromDate, toDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"vaxcare-report-summary.csv\"")
                .contentType(new MediaType("text", "csv"))
                .body(csv);
    }
}