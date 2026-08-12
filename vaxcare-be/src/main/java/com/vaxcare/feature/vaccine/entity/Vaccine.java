package com.vaxcare.feature.vaccine.entity;

import com.vaxcare.common.enums.ActiveStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "vaccines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vaccine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vaccine_id")
    private Long vaccineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private VaccineCategory category;

    @Column(name = "vaccine_name", nullable = false, length = 200)
    private String vaccineName;

    @Column(length = 150)
    private String manufacturer;

    @Column(name = "target_disease", length = 200)
    private String targetDisease;

    @Column(name = "required_doses")
    @Builder.Default
    private Integer requiredDoses = 1;

    @Column(name = "dose_interval_days")
    private Integer doseIntervalDays;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "average_rating", precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_bookings")
    @Builder.Default
    private Integer totalBookings = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActiveStatus status = ActiveStatus.ACTIVE;
}
