package com.vaxcare.feature.dashboard.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendationDto {

    private Long vaccineId;
    private String vaccineName;
    private Integer doseNumber;
    private Long facilityId;
    private String facilityName;
    private LocalDate recommendedDate;
    private LocalTime recommendedTimeSlot;
    private String description;
}