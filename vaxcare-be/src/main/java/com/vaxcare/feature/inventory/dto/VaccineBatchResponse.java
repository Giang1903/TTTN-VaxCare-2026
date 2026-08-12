package com.vaxcare.feature.inventory.dto;

import com.vaxcare.common.enums.BatchStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineBatchResponse {

    private Long batchId;
    private Long inventoryId;
    private Long facilityId;
    private Long vaccineId;
    private String vaccineName;
    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private Integer importedQuantity;
    private Integer stockQuantity;
    private BigDecimal importPrice;
    private LocalDate importDate;
    private BatchStatus status;
}
