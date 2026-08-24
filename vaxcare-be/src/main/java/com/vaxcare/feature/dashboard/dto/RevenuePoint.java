package com.vaxcare.feature.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenuePoint {
    private String period;
    private BigDecimal amount;
}
