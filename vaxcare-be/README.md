# Backend VaxCare

Backend là dịch vụ nghiệp vụ trung tâm, xây dựng bằng Java 21 và Spring Boot. Frontend gọi REST API của backend; backend lưu dữ liệu MySQL và có thể gọi AI service.

## Backend phụ trách gì?

- Đăng ký, đăng nhập, xác thực JWT và phân quyền USER, MEDICAL_STAFF, ADMIN.
- Quản lý cơ sở, vắc xin, phác đồ, lịch hẹn, thanh toán và hoàn tiền.
- Quản lý hồ sơ tiêm, phản ứng sau tiêm, tồn kho và báo cáo.
- Gửi thông báo, tích hợp chatbot và gọi các API AI khi được cấu hình.

Mã nguồn chính nằm trong `src/main/java/com/vaxcare/feature/`, chia theo nghiệp vụ; cấu hình Spring nằm trong `src/main/resources/`.

## Yêu cầu

- Java 21
- MySQL 8 và schema đã nạp từ [`database/vaxcare_2026.sql`](../database/vaxcare_2026.sql)
- AI service nếu cần dùng tính năng AI/chatbot

## Chạy ở chế độ phát triển

### 1. Cấu hình database

Tạo/import database theo [hướng dẫn database](../database/README.md). Backend dùng các biến môi trường sau để kết nối:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vaxcare_2026
DB_USERNAME=<tên người dùng MySQL>
DB_PASSWORD=<mật khẩu MySQL>
```

Spring Boot không tự đọc `.env` theo mặc định. Hãy thiết lập các biến trong terminal hoặc cấu hình chạy của IDE. Các cấu hình tùy chọn khác gồm `SERVER_PORT`, `JWT_SECRET`, `JWT_EXPIRATION`, `AI_SERVICE_URL` và `AI_SERVICE_INTERNAL_API_KEY`. Cấu hình mail và cổng thanh toán phụ thuộc môi trường; không dùng credential thật được lưu trong source code.

### 2. Khởi chạy

Mở PowerShell tại thư mục backend:

```powershell
.\mvnw.cmd spring-boot:run
```

- API mặc định: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### Chạy với Docker Compose

```powershell
docker compose up -d --build
```

Compose hiện khởi chạy **MySQL và backend**. MySQL được ánh xạ ra host ở cổng `3307` mặc định; backend ở cổng `8080`. AI service và frontend không nằm trong compose này. Xem các giá trị cấu hình trong `.env.example`, thay bằng giá trị riêng của bạn và không commit file `.env`.

## Kiểm tra

```powershell
.\mvnw.cmd test
```

Một bài kiểm tra khởi động toàn bộ Spring context và cần database. Chỉ chạy với database phát triển/kiểm thử riêng, không dùng database đang vận hành.

## Tích hợp AI

Backend gọi AI service qua `AI_SERVICE_URL` (mặc định `http://localhost:8000`). Các endpoint AI chính:

- `POST /api/v1/ai/schedule`
- `POST /api/v1/ai/dispatch`
- `POST /api/v1/ai/forecast`
- `POST /api/v1/chatbot/chat`

AI có thể không khả dụng khi chưa khởi chạy dịch vụ hoặc chưa cấu hình kết nối. Xem [tài liệu AI service](../vaxcare-ai/README.md).

## Ghi chú triển khai

- Đặt `JWT_SECRET`, mật khẩu database, thông tin mail và khóa cổng thanh toán trong secret store/biến môi trường.
- Cấu hình URL frontend, callback thanh toán, CORS và URL AI cho đúng môi trường.
- Không bật cấu hình phát triển hoặc dùng credential mẫu trong môi trường thật.
