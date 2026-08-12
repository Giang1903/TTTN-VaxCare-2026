package com.vaxcare.feature.inventory.entity;

import com.vaxcare.feature.facility.entity.VaccinationFacility;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vaccine_inventories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Long inventoryId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false, unique = true)
    private VaccinationFacility facility;

    @Column(name = "alert_threshold")
    @Builder.Default
    private Integer alertThreshold = 50;
}
