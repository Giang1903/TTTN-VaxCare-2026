package com.vaxcare.feature.vaccine.dto;

import com.vaxcare.common.enums.ActiveStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineResponse {

    private Long vaccineId;
    private Long categoryId;
    private String categoryName;
    private String vaccineName;
    private String manufacturer;
    private String targetDisease;
    private Integer requiredDoses;
    private Integer doseIntervalDays;
    private String description;
    private String imageUrl;
    private BigDecimal averageRating;
    private Integer totalBookings;
    private ActiveStatus status;
    private BigDecimal currentPrice; // giá hiện tại (nếu có)
}
