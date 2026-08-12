package com.vaxcare.feature.vaccine.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vaccination_protocols")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccinationProtocol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "protocol_id")
    private Long protocolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaccine_id", nullable = false)
    private Vaccine vaccine;

    @Column(name = "protocol_name", nullable = false, length = 200)
    private String protocolName;

    @Column(name = "total_doses", nullable = false)
    private Integer totalDoses;

    @Column(columnDefinition = "TEXT")
    private String description;
}
