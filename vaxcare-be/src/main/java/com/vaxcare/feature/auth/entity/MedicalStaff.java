package com.vaxcare.feature.auth.entity;

import com.vaxcare.feature.facility.entity.VaccinationFacility;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medical_staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalStaff {

    @Id
    @Column(name = "staff_id")
    private Long staffId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "staff_id")
    private Account account;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "staff_code", unique = true, length = 50)
    private String staffCode;

    @Column(length = 100)
    private String specialty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id")
    private VaccinationFacility facility;
}
