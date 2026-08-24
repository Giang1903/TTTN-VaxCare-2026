package com.vaxcare.feature.vaccination.entity;

import com.vaxcare.common.enums.VaccinationResult;
import com.vaxcare.feature.appointment.entity.Appointment;
import com.vaxcare.feature.auth.entity.MedicalStaff;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccination_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccinationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Long detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id", nullable = false)
    private VaccinationHistory history;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaccine_id", nullable = false)
    private Vaccine vaccine;

    /** Lô vắc xin đã dùng để tiêm (lấy theo FEFO từ InventoryService khi trừ kho). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private VaccineBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private MedicalStaff staff;

    @Column(name = "dose_number", nullable = false)
    private Integer doseNumber;

    @Column(name = "injection_date", nullable = false)
    private LocalDate injectionDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VaccinationResult result = VaccinationResult.SUCCESS;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** Mã chứng nhận tiêm chủng, chỉ sinh khi result = SUCCESS. Dùng để xuất PDF chứng nhận (task 30/08). */
    @Column(name = "certificate_code", unique = true, length = 100)
    private String certificateCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
