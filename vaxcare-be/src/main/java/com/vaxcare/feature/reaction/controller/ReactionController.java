package com.vaxcare.feature.reaction.controller;

import com.vaxcare.common.dto.ApiResponse;
import com.vaxcare.common.enums.ReactionProcessingStatus;
import com.vaxcare.feature.reaction.dto.ProcessReactionRequest;
import com.vaxcare.feature.reaction.dto.ReactionResponse;
import com.vaxcare.feature.reaction.dto.SubmitReactionRequest;
import com.vaxcare.feature.reaction.service.ReactionService;
import com.vaxcare.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reactions")
@RequiredArgsConstructor
@Tag(name = "18. Post-Vaccination Reaction", description = "Khai báo & xử lý phản ứng sau tiêm")
public class ReactionController {

    private final ReactionService reactionService;

    @Parameter(description = "User khai báo phản ứng sau tiêm cho 1 mũi tiêm của chính mình")
    @PostMapping
    public ApiResponse<ReactionResponse> submitReaction(
            @Valid @RequestBody SubmitReactionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Ghi nhận phản ứng sau tiêm thành công",
                reactionService.submitReaction(userPrincipal.getId(), request));
    }

    @Parameter(description = "User xem danh sách phản ứng mình đã khai báo")
    @GetMapping("/my")
    public ApiResponse<List<ReactionResponse>> getMyReactions(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách phản ứng thành công",
                reactionService.getMyReactions(userPrincipal.getId()));
    }

    @Parameter(description = "Staff/Admin xem danh sách phản ứng cần xử lý (Staff chỉ thấy phản ứng thuộc cơ sở mình). " +
            "Có thể lọc theo trạng thái xử lý qua query param status")
    @GetMapping
    @PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
    public ApiResponse<List<ReactionResponse>> listReactions(
            @RequestParam(required = false) ReactionProcessingStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Lấy danh sách phản ứng thành công",
                reactionService.listReactions(userPrincipal.getId(), status));
    }

    @Parameter(description = "Staff/Admin cập nhật trạng thái xử lý (REVIEWED/CONTACTED/RESOLVED) kèm ghi chú")
    @PatchMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('MEDICAL_STAFF', 'ADMIN')")
    public ApiResponse<ReactionResponse> processReaction(
            @PathVariable Long id,
            @Valid @RequestBody ProcessReactionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ApiResponse.success("Cập nhật xử lý phản ứng thành công",
                reactionService.processReaction(id, userPrincipal.getId(), request));
    }
}
