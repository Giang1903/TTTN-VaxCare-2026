package com.vaxcare.feature.ai.entity;

import com.vaxcare.feature.facility.entity.VaccinationFacility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "schedule_overload_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleOverloadPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id")
    private Long predictionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private VaccinationFacility facility;

    @Column(name = "prediction_date", nullable = false)
    private LocalDate predictionDate;

    @Column(name = "time_slot", nullable = false)
    private LocalTime timeSlot;

    @Column(name = "predicted_bookings")
    private Integer predictedBookings;

    private Integer capacity;

    @Column(name = "overload_probability", precision = 5, scale = 4)
    private BigDecimal overloadProbability;

    @Column(name = "estimated_wait_minutes")
    private Integer estimatedWaitMinutes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
