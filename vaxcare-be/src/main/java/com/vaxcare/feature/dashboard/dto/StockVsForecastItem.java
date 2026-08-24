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
    private String note = "Chưa tích hợp AI Service - sẽ có dữ liệu sau khi đổ";
}
