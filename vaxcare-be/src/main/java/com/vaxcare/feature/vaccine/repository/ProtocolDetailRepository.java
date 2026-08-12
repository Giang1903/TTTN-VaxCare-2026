package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.feature.vaccine.entity.ProtocolDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProtocolDetailRepository extends JpaRepository<ProtocolDetail, Long> {

    List<ProtocolDetail> findByProtocol_ProtocolIdOrderByDoseNumberAsc(Long protocolId);
}
