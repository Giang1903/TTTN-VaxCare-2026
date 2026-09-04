package com.vaxcare.feature.vaccination.dto;

import com.vaxcare.common.enums.VaccinationResult;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccinationDetailResponse {

    private Long detailId;
    private Long historyId;
    private Long appointmentId;
    private Long vaccineId;
    private String vaccineName;
    private Long batchId;
    private String batchNumber;
    private Long facilityId;
    private String facilityName;
    private Long staffId;
    private String staffName;
    private Integer doseNumber;
    private Integer requiredDoses;
    private LocalDate injectionDate;
    private VaccinationResult result;
    private String note;
    private String certificateCode;
    private LocalDateTime createdAt;
}