package com.vaxcare.feature.vaccine.dto;

import com.vaxcare.common.enums.ActiveStatus;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineRequest {

    private Long categoryId;

    @Size(max = 200, message = "Tên vắc xin không được vượt quá 200 ký tự")
    private String vaccineName;

    private String manufacturer;
    private String targetDisease;

    @Positive(message = "Số mũi tiêm yêu cầu phải lớn hơn 0")
    private Integer requiredDoses;

    @Positive(message = "Khoảng cách giữa các mũi (ngày) phải lớn hơn 0")
    private Integer doseIntervalDays;

    private String description;
    private String imageUrl;
    private ActiveStatus status;
}
