package com.vaxcare.feature.facility.repository;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.feature.facility.entity.VaccinationFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaccinationFacilityRepository extends JpaRepository<VaccinationFacility, Long> {

    List<VaccinationFacility> findByStatus(ActiveStatus status);

    boolean existsByFacilityNameIgnoreCase(String facilityName);

    boolean existsByFacilityNameIgnoreCaseAndFacilityIdNot(String facilityName, Long facilityId);

    Optional<VaccinationFacility> findFirstByOrderByFacilityIdAsc();
}
