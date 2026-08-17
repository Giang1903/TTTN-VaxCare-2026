package com.vaxcare.feature.vaccine.dto;

import com.vaxcare.common.enums.ActiveStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceListRequest {

    @NotNull(message = "Vắc xin không được để trống")
    private Long vaccineId;

    // null = áp dụng giá chung cho tất cả cơ sở
    private Long facilityId;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Ngày hiệu lực không được để trống")
    private LocalDate effectiveDate;

    private LocalDate expiryDate;

    private ActiveStatus status;
}
