package com.vaxcare.feature.auth.repository;

import com.vaxcare.feature.auth.entity.MedicalStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalStaffRepository extends JpaRepository<MedicalStaff, Long> {

    Optional<MedicalStaff> findByStaffCode(String staffCode);

    boolean existsByStaffCode(String staffCode);

    List<MedicalStaff> findByFacility_FacilityId(Long facilityId);
}
