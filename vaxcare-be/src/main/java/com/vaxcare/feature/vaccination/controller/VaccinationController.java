package com.vaxcare.feature.vaccination.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.feature.vaccination.dto.RecordVaccinationRequest;
import com.vaxcare.feature.vaccination.dto.VaccinationDetailResponse;
import com.vaxcare.feature.vaccination.dto.VaccinationHistoryResponse;
import com.vaxcare.feature.vaccination.service.VaccinationService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vaccinations")
@RequiredArgsConstructor
@Tag(name = "17. Vaccination Record", description = "Staff ghi nhận kết quả tiêm & tra cứu lịch sử tiêm chủng")
public class VaccinationController {

    private final VaccinationService vaccinationService;

    @Parameter(description = "Staff ghi nhận kết quả 1 mũi tiêm cho lịch hẹn đang CHECKED_IN: tự tính dose_number, " +
            "tự trừ kho theo FEFO, tự chuyển lịch hẹn sang COMPLETED và ghi vào lịch sử tiêm chủng của User")
    @PostMapping("/record")
    @PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
    public ApiResponse<VaccinationDetailResponse> recordVaccination(
            @Valid @RequestBody RecordVaccinationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Ghi nhận kết quả tiêm chủng thành công",
                vaccinationService.recordVaccination(request, userPrincipal.getId()));
    }

    @Parameter(description = "User xem lịch sử tiêm chủng của chính mình")
    @GetMapping("/history")
    public ApiResponse<VaccinationHistoryResponse> getMyHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy lịch sử tiêm chủng thành công",
                vaccinationService.getHistoryByUserId(userPrincipal.getId(), userPrincipal.getId()));
    }

    @Parameter(description = "Staff/Admin tra cứu lịch sử tiêm chủng của 1 User theo ID; User thường chỉ xem được của chính mình")
    @GetMapping("/history/{id}")
    public ApiResponse<VaccinationHistoryResponse> getHistoryByUserId(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy lịch sử tiêm chủng thành công",
                vaccinationService.getHistoryByUserId(id, userPrincipal.getId()));
    }
}
