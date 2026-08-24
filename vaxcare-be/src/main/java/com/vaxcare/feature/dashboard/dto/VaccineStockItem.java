package com.vaxcare.feature.dashboard.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineStockItem {
    private Long vaccineId;
    private String vaccineName;
    private int stockQuantity;
    /** true nếu stockQuantity <= ngưỡng cảnh báo (alert_threshold) của cơ sở. */
    private boolean lowStock;
}
