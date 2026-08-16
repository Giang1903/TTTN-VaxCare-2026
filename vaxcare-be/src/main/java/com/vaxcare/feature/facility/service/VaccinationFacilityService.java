package com.vaxcare.feature.facility.service;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.facility.dto.FacilityRequest;
import com.vaxcare.feature.facility.dto.FacilityResponse;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.facility.repository.VaccinationFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VaccinationFacilityService {

    private final VaccinationFacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<FacilityResponse> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FacilityResponse> getActiveFacilities() {
        return facilityRepository.findByStatus(ActiveStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacilityResponse getFacilityById(Long facilityId) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);
        return mapToResponse(facility);
    }

    @Transactional
    public FacilityResponse createFacility(FacilityRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu cơ sở tiêm chủng không được để trống");
        }

        String facilityName = normalizeName(request.getFacilityName());
        if (facilityName.isEmpty()) {
            throw new BadRequestException("Tên cơ sở không được để trống");
        }

        if (facilityRepository.existsByFacilityNameIgnoreCase(facilityName)) {
            throw new BadRequestException("Đã tồn tại cơ sở tiêm chủng với tên: " + facilityName);
        }

        validateTimeRange(request.getOpeningTime(), request.getClosingTime());

        VaccinationFacility facility = VaccinationFacility.builder()
                .facilityName(facilityName)
                .address(request.getAddress())
                .phone(request.getPhone())
                .openingTime(request.getOpeningTime())
                .closingTime(request.getClosingTime())
                .capacityPerSlot(request.getCapacityPerSlot() != null ? request.getCapacityPerSlot() : 10)
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : ActiveStatus.ACTIVE)
                .build();

        VaccinationFacility savedFacility = facilityRepository.save(facility);
        return mapToResponse(savedFacility);
    }

    @Transactional
    public FacilityResponse updateFacility(Long facilityId, FacilityRequest request) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);

        if (request.getFacilityName() != null) {
            String facilityName = normalizeName(request.getFacilityName());
            if (facilityName.isEmpty()) {
                throw new BadRequestException("Tên cơ sở không được để trống");
            }
            if (facilityRepository.existsByFacilityNameIgnoreCaseAndFacilityIdNot(facilityName, facilityId)) {
                throw new BadRequestException("Đã tồn tại cơ sở tiêm chủng với tên: " + facilityName);
            }
            facility.setFacilityName(facilityName);
        }
        if (request.getAddress() != null) {
            facility.setAddress(request.getAddress());
        }
        if (request.getPhone() != null) {
            facility.setPhone(request.getPhone());
        }

        LocalTime newOpeningTime = request.getOpeningTime() != null ? request.getOpeningTime() : facility.getOpeningTime();
        LocalTime newClosingTime = request.getClosingTime() != null ? request.getClosingTime() : facility.getClosingTime();
        validateTimeRange(newOpeningTime, newClosingTime);
        facility.setOpeningTime(newOpeningTime);
        facility.setClosingTime(newClosingTime);

        if (request.getCapacityPerSlot() != null) {
            facility.setCapacityPerSlot(request.getCapacityPerSlot());
        }
        if (request.getImageUrl() != null) {
            facility.setImageUrl(request.getImageUrl());
        }
        if (request.getStatus() != null) {
            facility.setStatus(request.getStatus());
        }

        VaccinationFacility updatedFacility = facilityRepository.save(facility);
        return mapToResponse(updatedFacility);
    }

    @Transactional
    public void deleteFacility(Long facilityId) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);

        if (facility.getStatus() == ActiveStatus.INACTIVE) {
            throw new BadRequestException("Cơ sở tiêm chủng này đã ở trạng thái vô hiệu hóa");
        }

        facility.setStatus(ActiveStatus.INACTIVE);
        facilityRepository.save(facility);
    }

    @Transactional
    public FacilityResponse reactivateFacility(Long facilityId) {
        VaccinationFacility facility = findFacilityOrThrow(facilityId);

        if (facility.getStatus() == ActiveStatus.ACTIVE) {
            throw new BadRequestException("Cơ sở tiêm chủng này đang hoạt động");
        }

        facility.setStatus(ActiveStatus.ACTIVE);
        VaccinationFacility updatedFacility = facilityRepository.save(facility);
        return mapToResponse(updatedFacility);
    }

    private VaccinationFacility findFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ sở tiêm chủng có ID: " + facilityId));
    }

    private String normalizeName(String facilityName) {
        return facilityName == null ? "" : facilityName.trim();
    }

    private void validateTimeRange(LocalTime openingTime, LocalTime closingTime) {
        if (openingTime != null && closingTime != null && !closingTime.isAfter(openingTime)) {
            throw new BadRequestException("Giờ đóng cửa phải sau giờ mở cửa");
        }
    }

    private FacilityResponse mapToResponse(VaccinationFacility facility) {
        return FacilityResponse.builder()
                .facilityId(facility.getFacilityId())
                .facilityName(facility.getFacilityName())
                .address(facility.getAddress())
                .phone(facility.getPhone())
                .openingTime(facility.getOpeningTime())
                .closingTime(facility.getClosingTime())
                .capacityPerSlot(facility.getCapacityPerSlot())
                .imageUrl(facility.getImageUrl())
                .status(facility.getStatus())
                .build();
    }
}
