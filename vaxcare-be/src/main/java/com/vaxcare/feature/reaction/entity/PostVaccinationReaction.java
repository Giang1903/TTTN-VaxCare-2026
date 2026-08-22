package com.vaxcare.feature.reaction.entity;

import com.vaxcare.common.enums.ReactionProcessingStatus;
import com.vaxcare.common.enums.ReactionSeverity;
import com.vaxcare.feature.vaccination.entity.VaccinationDetail;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_vaccination_reactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostVaccinationReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reaction_id")
    private Long reactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_id", nullable = false)
    private VaccinationDetail detail;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReactionSeverity severity = ReactionSeverity.NONE;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @CreationTimestamp
    @Column(name = "recorded_time", updatable = false)
    private LocalDateTime recordedTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status")
    @Builder.Default
    private ReactionProcessingStatus processingStatus = ReactionProcessingStatus.PENDING;

    @Column(name = "staff_note", columnDefinition = "TEXT")
    private String staffNote;
}
