package com.vaxcare.feature.inventory.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockSummaryResponse {

    private Long facilityId;
    private String facilityName;
    private Long vaccineId;
    private String vaccineName;
    private Integer totalStock;
    private Integer alertThreshold;
    private Boolean isLowStock;
}
