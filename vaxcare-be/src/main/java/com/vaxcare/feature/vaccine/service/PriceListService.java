package com.vaxcare.feature.vaccine.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import com.vaxcare.feature.vaccine.dto.PriceListRequest;
import com.vaxcare.feature.vaccine.dto.PriceListResponse;
import com.vaxcare.feature.vaccine.entity.PriceList;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.repository.PriceListRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PriceListService {

    private final PriceListRepository priceListRepository;
    private final VaccineRepository vaccineRepository;
    private final VaccinationFacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<PriceListResponse> getCurrentPrices(Long vaccineId, Long facilityId) {
        return priceListRepository.findActivePrices(vaccineId, facilityId, LocalDate.now()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PriceListResponse> getAllForAdmin() {
        return priceListRepository.findAllWithDetails().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PriceListResponse> getPriceHistory(Long vaccineId) {
        findVaccineOrThrow(vaccineId);
        return priceListRepository.findByVaccine_VaccineIdAndStatus(vaccineId, ActiveStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public PriceListResponse createPrice(PriceListRequest request) {
        Vaccine vaccine = findVaccineOrThrow(request.getVaccineId());

        VaccinationFacility facility = null;
        if (request.getFacilityId() != null) {
            facility = facilityRepository.findById(request.getFacilityId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy cơ sở tiêm chủng có ID: " + request.getFacilityId()));
        }

        LocalDate effective = request.getEffectiveDate() != null
                ? request.getEffectiveDate()
                : LocalDate.now();
        if (request.getExpiryDate() != null && !request.getExpiryDate().isAfter(effective)) {
            throw new BadRequestException("Ngày hết hiệu lực phải sau ngày hiệu lực");
        }

        ActiveStatus newStatus = request.getStatus() != null ? request.getStatus() : ActiveStatus.ACTIVE;

        // Khi tạo giá ACTIVE: vô hiệu hóa các bản ACTIVE cùng phạm vi (cùng vaccine + cùng facility hoặc cùng giá chung)
        // để staff/user luôn resolve đúng giá mới nhất.
        if (newStatus == ActiveStatus.ACTIVE) {
            deactivateOverlappingActive(vaccine.getVaccineId(), request.getFacilityId());
        }

        PriceList priceList = PriceList.builder()
                .vaccine(vaccine)
                .facility(facility)
                .price(request.getPrice())
                .effectiveDate(effective)
                .expiryDate(request.getExpiryDate())
                .status(newStatus)
                .build();

        return mapToResponse(priceListRepository.save(priceList));
    }

    /**
     * Vô hiệu hóa mọi price ACTIVE cùng vaccine và cùng scope facility
     * (facilityId null = giá chung toàn hệ thống).
     */
    private void deactivateOverlappingActive(Long vaccineId, Long facilityId) {
        List<PriceList> active = priceListRepository
                .findByVaccine_VaccineIdAndStatus(vaccineId, ActiveStatus.ACTIVE);
        for (PriceList p : active) {
            Long pFac = p.getFacility() != null ? p.getFacility().getFacilityId() : null;
            boolean sameScope = (facilityId == null && pFac == null)
                    || (facilityId != null && facilityId.equals(pFac));
            if (sameScope) {
                p.setStatus(ActiveStatus.INACTIVE);
                // Đóng hiệu lực để không còn match findActivePrices
                if (p.getExpiryDate() == null || p.getExpiryDate().isAfter(LocalDate.now().minusDays(1))) {
                    p.setExpiryDate(LocalDate.now().minusDays(1));
                }
                priceListRepository.save(p);
            }
        }
    }

    @Transactional
    public void deactivatePrice(Long priceListId) {
        PriceList priceList = priceListRepository.findById(priceListId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng giá có ID: " + priceListId));
        priceList.setStatus(ActiveStatus.INACTIVE);
        // Hết hiệu lực ngay để resolveCurrentPrice không còn chọn bản này
        if (priceList.getExpiryDate() == null || !priceList.getExpiryDate().isBefore(LocalDate.now())) {
            priceList.setExpiryDate(LocalDate.now().minusDays(1));
        }
        priceListRepository.save(priceList);
    }

    private Vaccine findVaccineOrThrow(Long vaccineId) {
        return vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId));
    }

    private PriceListResponse mapToResponse(PriceList priceList) {
        return PriceListResponse.builder()
                .priceListId(priceList.getPriceListId())
                .vaccineId(priceList.getVaccine().getVaccineId())
                .vaccineName(priceList.getVaccine().getVaccineName())
                .facilityId(priceList.getFacility() != null ? priceList.getFacility().getFacilityId() : null)
                .facilityName(priceList.getFacility() != null ? priceList.getFacility().getFacilityName() : null)
                .price(priceList.getPrice())
                .effectiveDate(priceList.getEffectiveDate())
                .expiryDate(priceList.getExpiryDate())
                .status(priceList.getStatus())
                .build();
    }
}