package com.vaxcare.feature.vaccine.service;

import com.vaxcare.common.exception.BadRequestException;
import com.vaxcare.common.exception.ResourceNotFoundException;
import com.vaxcare.feature.vaccine.dto.ProtocolDetailRequest;
import com.vaxcare.feature.vaccine.dto.ProtocolDetailResponse;
import com.vaxcare.feature.vaccine.dto.ProtocolRequest;
import com.vaxcare.feature.vaccine.dto.ProtocolResponse;
import com.vaxcare.feature.vaccine.entity.ProtocolDetail;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import com.vaxcare.feature.vaccine.entity.VaccinationProtocol;
import com.vaxcare.feature.vaccine.repository.ProtocolDetailRepository;
import com.vaxcare.feature.vaccine.repository.VaccinationProtocolRepository;
import com.vaxcare.feature.vaccine.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VaccinationProtocolService {

    private final VaccinationProtocolRepository protocolRepository;
    private final ProtocolDetailRepository protocolDetailRepository;
    private final VaccineRepository vaccineRepository;

    @Transactional(readOnly = true)
    public List<ProtocolResponse> getProtocolsByVaccine(Long vaccineId) {
        findVaccineOrThrow(vaccineId);
        return protocolRepository.findByVaccine_VaccineId(vaccineId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProtocolResponse getProtocolById(Long protocolId) {
        return mapToResponse(findProtocolOrThrow(protocolId));
    }

    @Transactional
    public ProtocolResponse createProtocol(ProtocolRequest request) {
        if (request.getVaccineId() == null) {
            throw new BadRequestException("Vắc xin không được để trống");
        }
        Vaccine vaccine = findVaccineOrThrow(request.getVaccineId());

        String protocolName = normalizeName(request.getProtocolName());
        if (protocolName.isEmpty()) {
            throw new BadRequestException("Tên phác đồ không được để trống");
        }
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new BadRequestException("Phác đồ phải có ít nhất 1 mũi tiêm (details)");
        }

        VaccinationProtocol protocol = VaccinationProtocol.builder()
                .vaccine(vaccine)
                .protocolName(protocolName)
                .totalDoses(request.getTotalDoses() != null ? request.getTotalDoses() : request.getDetails().size())
                .description(request.getDescription())
                .build();
        protocol = protocolRepository.save(protocol);

        saveDetails(protocol, request.getDetails());

        return mapToResponse(findProtocolOrThrow(protocol.getProtocolId()));
    }

    @Transactional
    public ProtocolResponse updateProtocol(Long protocolId, ProtocolRequest request) {
        VaccinationProtocol protocol = findProtocolOrThrow(protocolId);

        if (request.getProtocolName() != null) {
            String protocolName = normalizeName(request.getProtocolName());
            if (protocolName.isEmpty()) {
                throw new BadRequestException("Tên phác đồ không được để trống");
            }
            protocol.setProtocolName(protocolName);
        }
        if (request.getDescription() != null) {
            protocol.setDescription(request.getDescription());
        }

        // Nếu có gửi kèm details -> thay thế toàn bộ danh sách mũi tiêm cũ bằng danh sách mới
        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            List<ProtocolDetail> oldDetails =
                    protocolDetailRepository.findByProtocol_ProtocolIdOrderByDoseNumberAsc(protocolId);
            protocolDetailRepository.deleteAll(oldDetails);
            saveDetails(protocol, request.getDetails());
            protocol.setTotalDoses(
                    request.getTotalDoses() != null ? request.getTotalDoses() : request.getDetails().size());
        } else if (request.getTotalDoses() != null) {
            protocol.setTotalDoses(request.getTotalDoses());
        }

        protocolRepository.save(protocol);
        return mapToResponse(findProtocolOrThrow(protocolId));
    }

    @Transactional
    public void deleteProtocol(Long protocolId) {
        VaccinationProtocol protocol = findProtocolOrThrow(protocolId);
        List<ProtocolDetail> details =
                protocolDetailRepository.findByProtocol_ProtocolIdOrderByDoseNumberAsc(protocolId);
        protocolDetailRepository.deleteAll(details);
        protocolRepository.delete(protocol);
    }

    private void saveDetails(VaccinationProtocol protocol, List<ProtocolDetailRequest> details) {
        for (ProtocolDetailRequest detailRequest : details) {
            protocolDetailRepository.save(ProtocolDetail.builder()
                    .protocol(protocol)
                    .doseNumber(detailRequest.getDoseNumber())
                    .intervalDays(detailRequest.getIntervalDays() != null ? detailRequest.getIntervalDays() : 0)
                    .ageFromMonths(detailRequest.getAgeFromMonths())
                    .ageToMonths(detailRequest.getAgeToMonths())
                    .note(detailRequest.getNote())
                    .build());
        }
    }

    private Vaccine findVaccineOrThrow(Long vaccineId) {
        return vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vắc xin có ID: " + vaccineId));
    }

    private VaccinationProtocol findProtocolOrThrow(Long protocolId) {
        return protocolRepository.findById(protocolId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phác đồ tiêm có ID: " + protocolId));
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private ProtocolResponse mapToResponse(VaccinationProtocol protocol) {
        List<ProtocolDetailResponse> details =
                protocolDetailRepository.findByProtocol_ProtocolIdOrderByDoseNumberAsc(protocol.getProtocolId())
                        .stream()
                        .sorted(Comparator.comparing(ProtocolDetail::getDoseNumber))
                        .map(this::mapDetailToResponse)
                        .toList();

        return ProtocolResponse.builder()
                .protocolId(protocol.getProtocolId())
                .vaccineId(protocol.getVaccine().getVaccineId())
                .vaccineName(protocol.getVaccine().getVaccineName())
                .protocolName(protocol.getProtocolName())
                .totalDoses(protocol.getTotalDoses())
                .description(protocol.getDescription())
                .details(details)
                .build();
    }

    private ProtocolDetailResponse mapDetailToResponse(ProtocolDetail detail) {
        return ProtocolDetailResponse.builder()
                .protocolDetailId(detail.getProtocolDetailId())
                .doseNumber(detail.getDoseNumber())
                .intervalDays(detail.getIntervalDays())
                .ageFromMonths(detail.getAgeFromMonths())
                .ageToMonths(detail.getAgeToMonths())
                .note(detail.getNote())
                .build();
    }
}
