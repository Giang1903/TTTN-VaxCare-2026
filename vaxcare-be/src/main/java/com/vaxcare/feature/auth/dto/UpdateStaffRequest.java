package com.vaxcare.feature.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStaffRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 50, message = "Mã nhân viên tối đa 50 ký tự")
    private String staffCode;

    @Size(max = 100, message = "Chuyên môn tối đa 100 ký tự")
    private String specialty;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /** Tùy chọn: chuyển cơ sở (null = giữ nguyên) */
    private Long facilityId;
}
