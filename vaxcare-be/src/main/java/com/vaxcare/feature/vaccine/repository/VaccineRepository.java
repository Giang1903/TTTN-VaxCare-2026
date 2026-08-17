package com.vaxcare.feature.vaccine.repository;

import com.vaxcare.common.enums.ActiveStatus;
import com.vaxcare.feature.vaccine.entity.Vaccine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccineRepository extends JpaRepository<Vaccine, Long> {

    List<Vaccine> findByStatus(ActiveStatus status);

    List<Vaccine> findByCategory_CategoryIdAndStatus(Long categoryId, ActiveStatus status);

    List<Vaccine> findByVaccineNameContainingIgnoreCase(String keyword);

    @Query("""
            SELECT DISTINCT v FROM Vaccine v
            LEFT JOIN VaccinationProtocol vp ON vp.vaccine = v
            LEFT JOIN ProtocolDetail pd ON pd.protocol = vp
            WHERE v.status = com.vaxcare.common.enums.ActiveStatus.ACTIVE
              AND (:categoryId IS NULL OR v.category.categoryId = :categoryId)
              AND (:keyword IS NULL OR LOWER(v.vaccineName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (
                    :ageMonths IS NULL
                    OR pd IS NULL
                    OR ((pd.ageFromMonths IS NULL OR pd.ageFromMonths <= :ageMonths)
                        AND (pd.ageToMonths IS NULL OR pd.ageToMonths >= :ageMonths))
                  )
            ORDER BY v.vaccineName ASC
            """)
    List<Vaccine> searchVaccines(@Param("categoryId") Long categoryId,
                                  @Param("keyword") String keyword,
                                  @Param("ageMonths") Integer ageMonths);
}
