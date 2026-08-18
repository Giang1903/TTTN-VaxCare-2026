package com.vaxcare.feature.vaccine.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocolResponse {

    private Long protocolId;
    private Long vaccineId;
    private String vaccineName;
    private String protocolName;
    private Integer totalDoses;
    private String description;
    private List<ProtocolDetailResponse> details;
}
