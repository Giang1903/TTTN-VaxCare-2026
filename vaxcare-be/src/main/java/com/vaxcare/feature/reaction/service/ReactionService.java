package com.vaxcare.feature.reaction.service;

import com.vaxcare.common.enums.ReactionProcessingStatus;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.reaction.dto.ProcessReactionRequest;
import com.vaxcare.feature.reaction.dto.ReactionResponse;
import com.vaxcare.feature.reaction.dto.SubmitReactionRequest;
import com.vaxcare.feature.reaction.entity.PostVaccinationReaction;
import com.vaxcare.feature.reaction.repository.ReactionRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final VaccinationDetailRepository detailRepository;
    private final AccountRepository accountRepository;

    // ===================== USER: GỬI PHẢN ỨNG SAU TIÊM =====================

    @Transactional
    public ReactionResponse submitReaction(Long currentAccountId, SubmitReactionRequest request) {
        VaccinationDetail detail = detailRepository.findById(request.getDetailId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mũi tiêm có ID: " + request.getDetailId()));

        Long ownerId = detail.getHistory().getUser().getUserId();
        if (!ownerId.equals(currentAccountId)) {
            throw new UnauthorizedException("Bạn chỉ được khai báo phản ứng cho mũi tiêm của chính mình!");
        }

        PostVaccinationReaction reaction = PostVaccinationReaction.builder()
                .detail(detail)
                .severity(request.getSeverity())
                .symptoms(request.getSymptoms())
                .build();

        return mapToResponse(reactionRepository.save(reaction));
    }

    // ===================== USER: XEM PHẢN ỨNG CỦA CHÍNH MÌNH =====================

    @Transactional(readOnly = true)
    public List<ReactionResponse> getMyReactions(Long currentAccountId) {
        return reactionRepository.findAllByUserId(currentAccountId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ===================== STAFF/ADMIN: DANH SÁCH PHẢN ỨNG CẦN XỬ LÝ =====================

    @Transactional(readOnly = true)
    public List<ReactionResponse> listReactions(Long currentAccountId, ReactionProcessingStatus status) {
        Account account = findAccountOrThrow(currentAccountId);

        Long facilityScope = null;
        if (account.getRole() == Role.MEDICAL_STAFF) {
            MedicalStaff staff = requireStaffProfile(account);
            facilityScope = staff.getFacility().getFacilityId();
        }
        // ADMIN: facilityScope = null -> xem tất cả cơ sở

        return reactionRepository.findAllForStaff(facilityScope, status).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ===================== STAFF/ADMIN: XỬ LÝ PHẢN ỨNG =====================

    @Transactional
    public ReactionResponse processReaction(Long reactionId, Long currentAccountId, ProcessReactionRequest request) {
        Account account = findAccountOrThrow(currentAccountId);
        PostVaccinationReaction reaction = reactionRepository.findById(reactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phản ứng có ID: " + reactionId));

        checkFacilityScope(account, reaction);

        reaction.setProcessingStatus(request.getProcessingStatus());
        if (request.getStaffNote() != null) {
            reaction.setStaffNote(request.getStaffNote());
        }

        return mapToResponse(reactionRepository.save(reaction));
    }

    // ===================== HELPERS =====================

    private void checkFacilityScope(Account account, PostVaccinationReaction reaction) {
        if (account.getRole() != Role.MEDICAL_STAFF) {
            return; // ADMIN: không giới hạn
        }
        MedicalStaff staff = requireStaffProfile(account);
        Appointment appointment = reaction.getDetail().getAppointment();
        if (appointment == null
                || !staff.getFacility().getFacilityId().equals(appointment.getFacility().getFacilityId())) {
            throw new UnauthorizedException("Bạn chỉ được xử lý phản ứng thuộc cơ sở tiêm chủng của mình!");
        }
    }

    private MedicalStaff requireStaffProfile(Account account) {
        if (account.getMedicalStaff() == null || account.getMedicalStaff().getFacility() == null) {
            throw new BadRequestException("Tài khoản nhân viên y tế này chưa được gán cơ sở tiêm chủng!");
        }
        return account.getMedicalStaff();
    }

    private Account findAccountOrThrow(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
    }

    private ReactionResponse mapToResponse(PostVaccinationReaction r) {
        VaccinationDetail d = r.getDetail();
        Appointment appointment = d.getAppointment();
        return ReactionResponse.builder()
                .reactionId(r.getReactionId())
                .detailId(d.getDetailId())
                .userId(d.getHistory().getUser().getUserId())
                .userFullName(d.getHistory().getUser().getFullName())
                .vaccineId(d.getVaccine().getVaccineId())
                .vaccineName(d.getVaccine().getVaccineName())
                .injectionDate(d.getInjectionDate())
                .facilityId(appointment != null ? appointment.getFacility().getFacilityId() : null)
                .facilityName(appointment != null ? appointment.getFacility().getFacilityName() : null)
                .severity(r.getSeverity())
                .symptoms(r.getSymptoms())
                .recordedTime(r.getRecordedTime())
                .processingStatus(r.getProcessingStatus())
                .staffNote(r.getStaffNote())
                .build();
    }
}
