package com.vaxcare.feature.inventory.repository;

import com.vaxcare.feature.inventory.entity.VaccineInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VaccineInventoryRepository extends JpaRepository<VaccineInventory, Long> {

    Optional<VaccineInventory> findByFacility_FacilityId(Long facilityId);
}
