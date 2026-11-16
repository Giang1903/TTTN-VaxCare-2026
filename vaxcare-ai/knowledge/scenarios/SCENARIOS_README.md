# Kịch bản kiểm thử chatbot

Thư mục này gom các hồ sơ giả và kịch bản hội thoại để kiểm tra chatbot theo tình huống gần với cách người dùng đặt câu hỏi. Dữ liệu ở đây phục vụ phát triển/kiểm thử, không phải hồ sơ bệnh nhân thật.

## Các tệp

- `mock_profiles.json`: bốn hồ sơ giả phục vụ kiểm thử ngữ cảnh người dùng.
- `scenario_runs_v1.csv`: bảng ghi kết quả chạy kịch bản; các trường kết quả dùng để ghi nhận đạt/không đạt và mô tả lỗi.
- `actions_paths_v1.csv`: đối chiếu action chatbot với đường dẫn giao diện.

## Nhóm câu hỏi

Các kịch bản bao gồm những tình huống như:

- Người dùng cung cấp tuổi.
- Người dùng đã tiêm một mũi và hỏi bước tiếp theo.
- Người dùng hỏi vắc xin phòng bệnh gì.
- Người dùng muốn bắt đầu đặt lịch.

## Cách sử dụng

1. Chọn hồ sơ giả phù hợp trong `mock_profiles.json`.
2. Gửi các câu hỏi theo kịch bản qua API hoặc giao diện chatbot.
3. Ghi kết quả vào `scenario_runs_v1.csv`, gồm trạng thái, loại lỗi và ghi chú.
4. Kiểm tra action tạo ra có khớp với đường dẫn trong `actions_paths_v1.csv`.

Không đưa dữ liệu nhận dạng hoặc hồ sơ y tế thật vào các tệp kiểm thử này.
