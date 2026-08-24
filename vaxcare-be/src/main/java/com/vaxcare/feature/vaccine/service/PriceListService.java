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

        if (request.getExpiryDate() != null && !request.getExpiryDate().isAfter(request.getEffectiveDate())) {
            throw new BadRequestException("Ngày hết hiệu lực phải sau ngày hiệu lực");
        }

        PriceList priceList = PriceList.builder()
                .vaccine(vaccine)
                .facility(facility)
                .price(request.getPrice())
                .effectiveDate(request.getEffectiveDate())
                .expiryDate(request.getExpiryDate())
                .status(request.getStatus() != null ? request.getStatus() : ActiveStatus.ACTIVE)
                .build();

        return mapToResponse(priceListRepository.save(priceList));
    }

    @Transactional
    public void deactivatePrice(Long priceListId) {
        PriceList priceList = priceListRepository.findById(priceListId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng giá có ID: " + priceListId));
        priceList.setStatus(ActiveStatus.INACTIVE);
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