package com.vaxcare.feature.facility.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.vaxcare.common.enums.ActiveStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalTime;

/**
 * DTO dùng chung cho cả tạo mới (POST) và cập nhật từng phần (PUT).
 * Lưu ý: KHÔNG dùng @NotBlank cho facilityName ở đây vì PUT cho phép chỉ gửi
 * một số field cần đổi (partial update). Việc bắt buộc tên khi TẠO MỚI được
 * VaccinationFacilityService kiểm tra tường minh (xem createFacility()).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityRequest {

    @Size(max = 200, message = "Tên cơ sở không được vượt quá 200 ký tự")
    private String facilityName;

    private String address;

    @Pattern(regexp = "^$|^[0-9+\\-\\s()]{8,20}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Schema(type = "string", example = "08:00:00", description = "Giờ mở cửa (HH:mm:ss)")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime openingTime;

    @Schema(type = "string", example = "19:00:00", description = "Giờ đóng cửa (HH:mm:ss)")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime closingTime;

    @Positive(message = "Sức chứa mỗi khung giờ phải lớn hơn 0")
    private Integer capacityPerSlot;

    private String imageUrl;
    private ActiveStatus status;
}
