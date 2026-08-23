package com.vaxcare.feature.vaccination.service;

import com.vaxcare.common.enums.Gender;
import com.vaxcare.common.enums.Role;
import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.common.exception.UnauthorizedException;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.auth.entity.Account;
import com.vaxcare.feature.auth.entity.User;
import com.vaxcare.feature.auth.repository.AccountRepository;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import com.vaxcare.feature.vaccination.repository.VaccinationDetailRepository;
import com.vaxcare.utils.PdfCertificateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final VaccinationDetailRepository detailRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(Long detailId, Long currentAccountId) {
        VaccinationDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mũi tiêm có ID: " + detailId));

        User owner = detail.getHistory().getUser();
        checkAccess(owner.getUserId(), currentAccountId);

        if (detail.getResult() != VaccinationResult.SUCCESS || detail.getCertificateCode() == null) {
            throw new BadRequestException(
                    "Chỉ có thể xuất chứng nhận cho mũi tiêm đã hoàn thành thành công (SUCCESS)");
        }

        Appointment appointment = detail.getAppointment();

        PdfCertificateUtil.CertificateData data = new PdfCertificateUtil.CertificateData(
                detail.getCertificateCode(),
                owner.getFullName(),
                owner.getDateOfBirth(),
                mapGender(owner.getGender()),
                detail.getVaccine().getVaccineName(),
                detail.getVaccine().getManufacturer(),
                detail.getDoseNumber(),
                detail.getInjectionDate(),
                appointment != null ? appointment.getFacility().getFacilityName() : null,
                appointment != null ? appointment.getFacility().getAddress() : null,
                detail.getStaff() != null ? detail.getStaff().getFullName() : null,
                detail.getBatch() != null ? detail.getBatch().getBatchNumber() : null
        );

        return PdfCertificateUtil.generate(data);
    }

    private void checkAccess(Long ownerUserId, Long currentAccountId) {
        if (ownerUserId.equals(currentAccountId)) {
            return; // chính chủ
        }
        Account account = accountRepository.findById(currentAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + currentAccountId));
        if (account.getRole() == Role.USER) {
            throw new UnauthorizedException("Bạn chỉ được xuất chứng nhận tiêm chủng của chính mình!");
        }
    }

    private String mapGender(Gender gender) {
        if (gender == null) return null;
        return switch (gender) {
            case MALE -> "Nam";
            case FEMALE -> "Nữ";
            case OTHER -> "Khác";
        };
    }
}
