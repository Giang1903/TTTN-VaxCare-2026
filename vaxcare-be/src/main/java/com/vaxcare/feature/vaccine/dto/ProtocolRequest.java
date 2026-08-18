package com.vaxcare.feature.vaccine.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocolRequest {

    private Long vaccineId; // bắt buộc khi TẠO MỚI, bỏ qua khi cập nhật

    @Size(max = 200, message = "Tên phác đồ không được vượt quá 200 ký tự")
    private String protocolName;

    private Integer totalDoses; // nếu không truyền, sẽ tự tính từ số lượng details

    private String description;

    @Valid
    private List<ProtocolDetailRequest> details;
}
