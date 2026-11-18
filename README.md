# VaxCare – Nền Tảng Quản Lý Và Điều Phối Tiêm Chủng

## 1. Tổng Quan Hệ Thống

**VaxCare** là nền tảng web hỗ trợ người dân đặt lịch tiêm chủng và giúp cơ sở y tế quản lý hoạt động tiêm. Người dùng có thể tra cứu vắc xin, chọn cơ sở, đặt lịch và theo dõi hồ sơ tiêm. Nhân viên y tế xử lý lịch hẹn, ghi nhận mũi tiêm và quản lý kho; quản trị viên quản lý danh mục và hoạt động toàn hệ thống.

VaxCare gồm bốn thành phần:

- **Frontend:** giao diện web cho người dân, nhân viên y tế và quản trị viên.
- **Backend:** API và nghiệp vụ, phân quyền người dùng, lưu và truy xuất dữ liệu.
- **AI service:** các API riêng cho gợi ý lịch tiêm, dự báo nhu cầu và chatbot.
- **Database:** MySQL lưu tài khoản, lịch hẹn, hồ sơ tiêm, kho và các dữ liệu liên quan.

AI hỗ trợ ra quyết định và cung cấp thông tin tham khảo; kết quả không thay thế tư vấn hoặc khám sàng lọc của nhân viên y tế.

## 2. Kiến Trúc Tổng Thể

Frontend gửi yêu cầu HTTP/JSON đến backend. Backend đọc/ghi dữ liệu qua MySQL và gọi AI service khi cần các tính năng AI.

```text
  Người dân / Nhân viên y tế / Quản trị viên
                       |
                       v
           +------------------------+
           | Frontend React + Vite  |
           |       Port 5173        |
           +------------------------+
                       |
                 REST API / JSON
                       v
           +------------------------+
           | Backend Spring Boot   |
           |       Port 8080        |
           +------------------------+
                 |             |
          Spring Data JPA   HTTP API
                 |             |
                 v             v
          +-----------+  +----------------------+
          | MySQL 8   |  | AI Service FastAPI   |
          | Port 3306 |  | Port 8000            |
          +-----------+  +----------------------+
                               |
                 +-------------+-------------+
                 |             |             |
                 v             v             v
              Lịch tiêm     Dự báo        Chatbot
               (AI1)       nhu cầu (AI2)
```

## 3. Danh Sách Phân Hệ & Công Nghệ

| Phân hệ | Thư mục | Công nghệ chính | Cổng mặc định | Tài liệu |
|---|---|---|---:|---|
| Frontend | [`vaxcare-fe/`](./vaxcare-fe/) | React 19, Vite, React Router | `5173` | [README Frontend](./vaxcare-fe/README.md) |
| Backend | [`vaxcare-be/`](./vaxcare-be/) | Java 21, Spring Boot 3, Spring Data JPA, Spring Security | `8080` | [README Backend](./vaxcare-be/README.md) |
| AI service | [`vaxcare-ai/`](./vaxcare-ai/) | Python, FastAPI, scikit-learn, XGBoost và chatbot | `8000` | [README AI](./vaxcare-ai/README.md) |
| Database | [`database/`](./database/) | MySQL 8 | `3306` | [README Database](./database/README.md) |

Các cổng có thể thay đổi theo cấu hình. Docker Compose trong `vaxcare-be/` khởi chạy backend và MySQL; frontend và AI service được khởi chạy riêng.

## 4. Phân Quyền & Vai Trò

1. **Người dân (USER):** tìm hiểu vắc xin/cơ sở, đặt lịch, thanh toán, xem lịch sử tiêm và gửi thông tin phản ứng sau tiêm.
2. **Nhân viên y tế (MEDICAL_STAFF):** xử lý lịch hẹn, check-in, ghi nhận kết quả tiêm, quản lý kho tại cơ sở được phân công và xem báo cáo.
3. **Quản trị viên (ADMIN):** quản lý tài khoản, cơ sở, nhân viên, vắc xin, giá, phác đồ, kho và báo cáo quản trị.
4. **AI service:** cung cấp gợi ý khung giờ, dự báo nhu cầu vắc xin và chatbot hỗ trợ tra cứu thông tin tiêm chủng.

Phân quyền thực tế được kiểm tra ở backend; việc ẩn/hiện trang ở frontend không thay thế xác thực API.

## 5. Các Dịch Vụ & Thư Viện Tích Hợp

- **MySQL và Spring Data JPA:** lưu trữ dữ liệu nghiệp vụ.
- **JWT và Spring Security:** xác thực và kiểm soát quyền truy cập API.
- **AI service FastAPI:** backend gọi các API điều phối lịch, dự báo nhu cầu và chatbot.
- **VNPay và ZaloPay:** hỗ trợ tạo giao dịch và xử lý callback thanh toán theo cấu hình môi trường.
- **ZXing:** tạo mã QR phục vụ các luồng nghiệp vụ như check-in.
- **Apache PDFBox:** hỗ trợ tạo tài liệu PDF.
- **SMTP:** gửi email thông báo khi được cấu hình.
- **WebSocket/STOMP:** hỗ trợ cập nhật realtime cho một số màn hình.

## 6. Hướng Dẫn Khởi Chạy Toàn Bộ Hệ Thống

### Yêu cầu

- MySQL 8
- Java 21
- Python 3.11
- Node.js và npm

Chạy các thành phần trong các cửa sổ PowerShell riêng. Trước khi khởi chạy, cấu hình kết nối database và các thông tin dịch vụ cần thiết. Không dùng credential mẫu hoặc đưa secret thật vào Git.

### Bước 1: Khởi tạo MySQL

Tạo database `vaxcare_2026`, sau đó import [`database/vaxcare_2026.sql`](./database/vaxcare_2026.sql). Lệnh PowerShell/Windows chi tiết có trong [hướng dẫn database](./database/README.md).

### Bước 2: Chạy AI service

Từ thư mục gốc của dự án:

```powershell
Set-Location .\vaxcare-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs).

### Bước 3: Chạy backend

Trong một PowerShell khác, vào thư mục `vaxcare-be`, thiết lập các biến môi trường cho database/JWT và những dịch vụ cần dùng, sau đó chạy:

```powershell
Set-Location .\vaxcare-be
.\mvnw.cmd spring-boot:run
```

Spring Boot không tự đọc file `.env` theo mặc định; `.env.example` chỉ để tham khảo. Thiết lập biến môi trường trong terminal hoặc cấu hình chạy của IDE.

API docs: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

### Bước 4: Chạy frontend

Trong một PowerShell khác:

```powershell
Set-Location .\vaxcare-fe
npm install
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173). Frontend mặc định gọi backend tại `http://localhost:8080/api/v1`; nếu backend dùng địa chỉ khác, cấu hình `VITE_API_URL`.

### Kiểm tra dự án

```powershell
# Backend (cần database phát triển/kiểm thử riêng)
Set-Location .\vaxcare-be
.\mvnw.cmd test

# AI service
Set-Location ..\vaxcare-ai
python -m pytest -q

# Frontend
Set-Location ..\vaxcare-fe
npm run lint
npm run build
```

Không trỏ bài kiểm tra backend vào database đang vận hành.

## 7. Danh Mục Tài Liệu

- [Hướng dẫn Backend](./vaxcare-be/README.md)
- [Bắt đầu nhanh Backend](./vaxcare-be/HELP.md)
- [Hướng dẫn Frontend](./vaxcare-fe/README.md)
- [Hướng dẫn AI service](./vaxcare-ai/README.md)
- [Quy ước dữ liệu intent chatbot](./vaxcare-ai/intent_data/README.md)
- [Kịch bản kiểm thử chatbot](./vaxcare-ai/knowledge/scenarios/SCENARIOS_README.md)
- [Hướng dẫn Database](./database/README.md)
