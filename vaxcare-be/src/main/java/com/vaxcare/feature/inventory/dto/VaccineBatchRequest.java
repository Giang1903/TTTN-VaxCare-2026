package com.vaxcare.feature.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineBatchRequest {

    @NotNull(message = "Cơ sở không được để trống")
    private Long facilityId;

    @NotNull(message = "Vắc xin không được để trống")
    private Long vaccineId;

    @NotBlank(message = "Số lô không được để trống")
    private String batchNumber;

    private LocalDate manufactureDate;

    @NotNull(message = "Ngày hết hạn không được để trống")
    private LocalDate expiryDate;

    @NotNull
    @Min(value = 1, message = "Số lượng nhập phải > 0")
    private Integer importedQuantity;

    private BigDecimal importPrice;

    private LocalDate importDate;
}
