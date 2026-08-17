package com.vaxcare.feature.vaccine.dto;

import com.vaxcare.common.enums.ActiveStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceListResponse {

    private Long priceListId;
    private Long vaccineId;
    private String vaccineName;
    private Long facilityId;
    private String facilityName; // null nếu là giá chung
    private BigDecimal price;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
    private ActiveStatus status;
}
