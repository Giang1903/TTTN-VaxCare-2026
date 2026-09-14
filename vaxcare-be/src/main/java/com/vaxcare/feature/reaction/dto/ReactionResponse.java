package com.vaxcare.feature.reaction.dto;

import com.vaxcare.common.enums.ReactionProcessingStatus;
import com.vaxcare.common.enums.ReactionSeverity;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionResponse {

    private Long reactionId;
    private Long detailId;

    private Long userId;
    private String userFullName;
    private String userPhone;

    private Long vaccineId;
    private String vaccineName;
    private LocalDate injectionDate;
    private Integer doseNumber;
    private String batchNumber;

    private Long facilityId;
    private String facilityName;

    private ReactionSeverity severity;
    private String symptoms;
    private LocalDateTime recordedTime;

    private ReactionProcessingStatus processingStatus;
    private String staffNote;
}