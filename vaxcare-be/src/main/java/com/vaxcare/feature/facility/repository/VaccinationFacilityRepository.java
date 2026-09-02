package com.vaxcare.feature.facility.repository;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaccinationFacilityRepository extends JpaRepository<VaccinationFacility, Long> {

    List<VaccinationFacility> findByStatus(ActiveStatus status);

    long countByStatus(ActiveStatus status);

    boolean existsByFacilityNameIgnoreCase(String facilityName);

    boolean existsByFacilityNameIgnoreCaseAndFacilityIdNot(String facilityName, Long facilityId);

    Optional<VaccinationFacility> findFirstByOrderByFacilityIdAsc();

    /**
     * Cơ sở ACTIVE có tồn kho vắc xin {@code vaccineId} (batch AVAILABLE, còn hạn, stock > 0).
     */
    @Query("""
        SELECT DISTINCT f FROM VaccinationFacility f
        WHERE f.status = com.vaxcare.common.enums.ActiveStatus.ACTIVE
          AND EXISTS (
              SELECT 1 FROM VaccineBatch b
              WHERE b.inventory.facility = f
                AND b.vaccine.vaccineId = :vaccineId
                AND b.status = com.vaxcare.common.enums.BatchStatus.AVAILABLE
                AND b.stockQuantity > 0
                AND b.expiryDate >= CURRENT_DATE
          )
        ORDER BY f.facilityName ASC
        """)
    List<VaccinationFacility> findActiveWithVaccineInStock(@Param("vaccineId") Long vaccineId);
}