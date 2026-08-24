package com.vaxcare.feature.dashboard.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiringBatchItem {
    private Long batchId;
    private String vaccineName;
    private String batchNumber;
    private LocalDate expiryDate;
    private int stockQuantity;
}
