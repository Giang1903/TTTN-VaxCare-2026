package com.vaxcare.feature.reaction.repository;

import com.vaxcare.common.enums.ReactionProcessingStatus;
import com.vaxcare.feature.reaction.entity.PostVaccinationReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactionRepository extends JpaRepository<PostVaccinationReaction, Long> {

    @Query("""
        SELECT r FROM PostVaccinationReaction r
        JOIN FETCH r.detail d
        JOIN FETCH d.vaccine
        JOIN FETCH d.history h
        JOIN FETCH h.user
        LEFT JOIN FETCH d.appointment a
        LEFT JOIN FETCH a.facility
        WHERE h.user.userId = :userId
        ORDER BY r.recordedTime DESC
        """)
    List<PostVaccinationReaction> findAllByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT r FROM PostVaccinationReaction r
        JOIN FETCH r.detail d
        JOIN FETCH d.vaccine
        JOIN FETCH d.history h
        JOIN FETCH h.user
        LEFT JOIN FETCH d.appointment a
        LEFT JOIN FETCH a.facility f
        WHERE (:facilityId IS NULL OR (a IS NOT NULL AND f.facilityId = :facilityId))
          AND (:status IS NULL OR r.processingStatus = :status)
        ORDER BY
            CASE r.processingStatus WHEN 'PENDING' THEN 0 ELSE 1 END,
            r.recordedTime DESC
        """)
    List<PostVaccinationReaction> findAllForStaff(
            @Param("facilityId") Long facilityId,
            @Param("status") ReactionProcessingStatus status);
}
