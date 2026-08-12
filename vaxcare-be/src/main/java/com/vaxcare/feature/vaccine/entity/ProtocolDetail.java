package com.vaxcare.feature.vaccine.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "protocol_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocolDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "protocol_detail_id")
    private Long protocolDetailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_id", nullable = false)
    private VaccinationProtocol protocol;

    @Column(name = "dose_number", nullable = false)
    private Integer doseNumber;

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 0;

    @Column(name = "age_from_months")
    private Integer ageFromMonths;

    @Column(name = "age_to_months")
    private Integer ageToMonths;

    @Column(length = 255)
    private String note;
}
