package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.feature.vaccine.entity.ProtocolDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProtocolDetailRepository extends JpaRepository<ProtocolDetail, Long> {

    List<ProtocolDetail> findByProtocol_ProtocolIdOrderByDoseNumberAsc(Long protocolId);

    @Query("""
        SELECT pd FROM ProtocolDetail pd
        JOIN FETCH pd.protocol p
        JOIN FETCH p.vaccine v
        ORDER BY v.vaccineId ASC, pd.doseNumber ASC
        """)
    List<ProtocolDetail> findAllWithProtocolAndVaccine();
}
