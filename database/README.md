# Database VaxCare

Thư mục này chứa script SQL tạo schema và dữ liệu mẫu cho MySQL. Backend sử dụng cơ sở dữ liệu có tên `vaxcare_2026`.

## Nội dung

- [`vaxcare_2026.sql`](./vaxcare_2026.sql): định nghĩa bảng, khóa và dữ liệu mẫu.
- MySQL yêu cầu phiên bản 8 trở lên; schema sử dụng `utf8mb4`.

## Tạo database và import

Mở PowerShell tại thư mục gốc của dự án, sau đó chạy:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS vaxcare_2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
cmd.exe /c "mysql -u root -p vaxcare_2026 < database\vaxcare_2026.sql"
```

Nhập mật khẩu MySQL khi được yêu cầu. Có thể thực hiện tương tự bằng MySQL Workbench hoặc DBeaver: tạo database trước, mở file SQL và chạy toàn bộ script.

> Script có dữ liệu mẫu. Chỉ import vào database phát triển/trống; không chạy trên database đang chứa dữ liệu cần giữ.

## Các nhóm bảng

| Nhóm | Các bảng tiêu biểu |
|---|---|
| Tài khoản và hồ sơ | `accounts`, `users`, `admins`, `medical_staff`, `health_profiles` |
| Cơ sở và danh mục | `vaccination_facilities`, `vaccine_categories`, `vaccines`, `price_lists`, `vaccination_protocols`, `protocol_details` |
| Đặt lịch và thanh toán | `appointments`, `waitlists`, `payments`, `refunds` |
| Tiêm chủng và phản ứng | `vaccination_histories`, `vaccination_details`, `post_vaccination_reactions` |
| Kho vắc xin | `vaccine_inventories`, `vaccine_batches` |
| Thông báo, hội thoại và hệ thống | `notifications`, `chat_messages`, `chatbot_sessions`, `chatbot_messages`, `audit_logs`, `demand_forecasts`, `schedule_overload_predictions` |

Danh sách chính xác được xác định bởi các lệnh `CREATE TABLE` trong file SQL. Một số tên trong tài liệu cũ không khớp với schema; bảng trên đã được đối chiếu với dump hiện tại.

## Kết nối backend

Backend cần thông tin kết nối tương ứng với MySQL của bạn:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vaxcare_2026
DB_USERNAME=<tên người dùng MySQL>
DB_PASSWORD=<mật khẩu MySQL>
```

Các giá trị này phải được cấu hình trong môi trường chạy backend. Spring Boot không tự đọc file `.env` nếu dự án không cài thêm dotenv loader. Không đưa mật khẩu thật vào tài liệu hoặc commit.

## Khi cập nhật schema

1. Cập nhật schema SQL và các entity/repository liên quan.
2. Thử import script trên một database phát triển sạch.
3. Khởi động backend để kiểm tra Hibernate schema validation.
4. Cập nhật tài liệu này nếu bảng hoặc quan hệ thay đổi.
