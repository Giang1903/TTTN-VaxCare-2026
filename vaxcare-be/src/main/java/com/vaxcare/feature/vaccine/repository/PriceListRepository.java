package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.feature.vaccine.entity.PriceList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceListRepository extends JpaRepository<PriceList, Long> {

    List<PriceList> findByVaccine_VaccineIdAndStatus(Long vaccineId, ActiveStatus status);

    @Query("""
        SELECT p FROM PriceList p
        WHERE p.vaccine.vaccineId = :vaccineId
          AND p.status = 'ACTIVE'
          AND p.effectiveDate <= :date
          AND (p.expiryDate IS NULL OR p.expiryDate >= :date)
          AND (p.facility IS NULL OR p.facility.facilityId = :facilityId)
        ORDER BY p.facility.facilityId DESC NULLS LAST, p.effectiveDate DESC
        """)
    List<PriceList> findActivePrices(@Param("vaccineId") Long vaccineId,
                                     @Param("facilityId") Long facilityId,
                                     @Param("date") LocalDate date);
}
