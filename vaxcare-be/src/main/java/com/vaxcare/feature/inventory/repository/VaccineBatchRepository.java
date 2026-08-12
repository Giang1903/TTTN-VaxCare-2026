package com.vaxcare.feature.inventory.repository;

import com.vaxcare.common.enums.BatchStatus;
import com.vaxcare.feature.inventory.entity.VaccineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VaccineBatchRepository extends JpaRepository<VaccineBatch, Long> {

    List<VaccineBatch> findByInventory_InventoryIdAndStatus(Long inventoryId, BatchStatus status);

    List<VaccineBatch> findByVaccine_VaccineIdAndStatus(Long vaccineId, BatchStatus status);

    @Query("""
        SELECT b FROM VaccineBatch b
        WHERE b.inventory.facility.facilityId = :facilityId
          AND b.vaccine.vaccineId = :vaccineId
          AND b.status = 'AVAILABLE'
          AND b.stockQuantity > 0
          AND b.expiryDate >= :today
        ORDER BY b.expiryDate ASC
        """)
    List<VaccineBatch> findAvailableBatches(@Param("facilityId") Long facilityId,
                                            @Param("vaccineId") Long vaccineId,
                                            @Param("today") LocalDate today);

    @Query("""
        SELECT COALESCE(SUM(b.stockQuantity), 0) FROM VaccineBatch b
        WHERE b.inventory.facility.facilityId = :facilityId
          AND b.vaccine.vaccineId = :vaccineId
          AND b.status = 'AVAILABLE'
        """)
    Integer sumStockByFacilityAndVaccine(@Param("facilityId") Long facilityId,
                                         @Param("vaccineId") Long vaccineId);
}
