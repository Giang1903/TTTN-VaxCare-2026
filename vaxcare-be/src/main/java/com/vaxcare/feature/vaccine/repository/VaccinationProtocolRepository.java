package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.feature.vaccine.entity.VaccinationProtocol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinationProtocolRepository extends JpaRepository<VaccinationProtocol, Long> {

    List<VaccinationProtocol> findByVaccine_VaccineId(Long vaccineId);
}
