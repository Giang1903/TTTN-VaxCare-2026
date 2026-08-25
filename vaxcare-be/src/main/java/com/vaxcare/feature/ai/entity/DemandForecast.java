package com.vaxcare.feature.ai.entity;

import com.vaxcare.feature.facility.entity.VaccinationFacility;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demand_forecasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "forecast_id")
    private Long forecastId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaccine_id", nullable = false)
    private Vaccine vaccine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private VaccinationFacility facility;

    @Column(name = "forecast_period_start", nullable = false)
    private LocalDate forecastPeriodStart;

    @Column(name = "forecast_period_end", nullable = false)
    private LocalDate forecastPeriodEnd;

    @Column(name = "predicted_quantity", nullable = false)
    private Integer predictedQuantity;

    @Column(name = "actual_quantity")
    private Integer actualQuantity;

    @Column(name = "confidence_level", precision = 5, scale = 4)
    private BigDecimal confidenceLevel;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
