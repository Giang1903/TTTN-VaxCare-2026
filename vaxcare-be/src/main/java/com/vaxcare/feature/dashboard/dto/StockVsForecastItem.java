package com.vaxcare.feature.dashboard.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockVsForecastItem {
    private Long vaccineId;
    private String vaccineName;
    private int currentStock;
    private Integer aiForecastedDemand;

    @Builder.Default
    private String note = "Chưa có dữ liệu dự báo AI cho vaccine này";
}
