# VaxCare – Nền Tảng Quản Lý Và Điều Phối Hoạt Động Tiêm Chủng Thông Minh Ứng Dụng Trí Tuệ Nhân Tạo

## 1. Tổng Quan Hệ Thống

**VaxCare** là nền tảng website hỗ trợ số hóa toàn bộ quy trình quản lý và điều phối hoạt động tiêm chủng — từ đăng ký tài khoản, tra cứu vắc xin, đặt lịch tiêm trực tuyến, thanh toán qua cổng VNPay, check-in bằng mã QR, quản lý hồ sơ tiêm chủng điện tử, quản lý kho vắc xin theo lô cho đến việc theo dõi phản ứng sau tiêm.

Điểm nổi bật của hệ thống là việc tích hợp hai mô hình **Trí tuệ Nhân tạo (AI)** độc lập giúp:
- **AI1 (Schedule Coordination)**: Phân tích lịch sử đặt lịch và năng lực phục vụ để dự đoán thời gian chờ, xác suất quá tải và gợi ý khung giờ tiêm tối ưu.
- **AI2 (Vaccine Demand Forecasting)**: Dự báo số liều vắc xin tiêu thụ theo chuỗi thời gian đệ quy nhiều bước (Recursive Multi-Step Forecasting) hỗ trợ cơ sở y tế lập kế hoạch nhập kho chủ động.

---

## 2. Kiến Trúc Tổng Thể

Hệ thống được thiết kế theo kiến trúc 3 tầng phân tán (Client-Server / Microservices architecture), giao tiếp qua giao thức HTTP/REST API chuẩn định dạng JSON:

```text
                           +-----------------------------------+
                           |  Frontend Web App (React 19+Vite) |
                           |            (Port 5173)            |
                           +-----------------------------------+
                                             |
                                    HTTP REST API / JSON
                                             v
                           +-----------------------------------+
                           |   Backend Service (Spring Boot)   |
                           |            (Port 8080)            |
                           +-----------------------------------+
                                   /                   \
                       Spring Data JPA              WebClient + Circuit Breaker
                                 /                       \
                                v                         v
                  +------------------------+   +------------------------+
                  |  MySQL 8.0 Database    |   |   AI Service (FastAPI) |
                  |  (vaxcare_2026:3306)   |   |       (Port 8000)      |
                  +------------------------+   +------------------------+
                                                          |
                                               +----------+----------+
                                               |                     |
                                               v                     v
                                          Module AI1            Module AI2
                                         (Schedule)             (Demand)
```

---

## 3. Danh Sách Phân Hệ & Cấu Trúc Thư Mục

| Phân hệ | Thư mục | Công nghệ chính | Port | Chi tiết tài liệu |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | [`vaxcare-fe/`](./vaxcare-fe/README.md) | React 19, Vite 8, React Router v7 | `5173` | [vaxcare-fe/README.md](./vaxcare-fe/README.md) |
| **Backend** | [`vaxcare-be/`](./vaxcare-be/README.md) | Java 21, Spring Boot 3.3.2, JPA, WebFlux | `8080` | [vaxcare-be/README.md](./vaxcare-be/README.md) |
| **AI Service** | [`vaxcare-ai/`](./vaxcare-ai/README.md) | Python 3.11, FastAPI, XGBoost, Scikit-learn | `8000` | [vaxcare-ai/README.md](./vaxcare-ai/README.md) |
| **Database** | [`database/`](./database/README.md) | MySQL 8.0 (`vaxcare_2026.sql`) | `3306` | [database/README.md](./database/README.md) |

---

## 4. Phân Quyền & Vai Trò (Actors)

Hệ thống phục vụ 4 tác nhân chính:

1. **Người dùng (User)**: Tra cứu vắc xin/cơ sở, đặt lịch tiêm có AI1 gợi ý khung giờ, thanh toán VNPay, check-in bằng mã QR, xem lịch sử tiêm, xuất chứng nhận PDF (Apache PDFBox), khai báo phản ứng sau tiêm 24–72h.
2. **Nhân viên y tế (Medical Staff)**: Xác nhận/hủy lịch hẹn tại cơ sở, quét QR check-in, ghi nhận kết quả tiêm chủng, quản lý kho vắc xin theo lô (nhập lô, tồn kho, hạn dùng FEFO), xem báo cáo thống kê cơ sở.
3. **Quản trị viên (Administrator)**: Quản lý tài khoản & phân quyền RBAC, quản lý cơ sở tiêm, danh mục vắc xin/giá/phác đồ, theo dõi Admin Dashboard, đối soát giao dịch, giám sát & kích hoạt chạy lại dự báo AI2.
4. **Hệ thống AI (AI Service)**: Dịch vụ FastAPI độc lập thực hiện suy luận mô hình học máy (XGBoost Regressor) cho AI1 và AI2.

---

## 5. Các Dịch Vụ & Thư Viện Tích Hợp

- **Cổng thanh toán VNPay**: Thanh toán trực tuyến qua giao thức HMAC SHA512 với Return URL & Instant Payment Notification (IPN).
- **Mã QR & ZXing**: Sinh mã QR chứa token tham chiếu hỗ trợ check-in nhanh tại cơ sở.
- **Apache PDFBox**: Sinh chứng nhận tiêm chủng điện tử chuẩn Unicode dưới dạng file PDF kèm mã QR xác thực.
- **SMTP Gmail Service**: Gửi email bất đồng bộ xác thực tài khoản, thông báo lịch hẹn và nhắc phác đồ tiêm mũi tiếp theo.

---

## 6. Hướng Dẫn Khởi Chạy Toàn Bộ Hệ Thống

### Bước 1: Khởi Tạo CSDL MySQL (`database/`)
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS vaxcare_2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u root -p vaxcare_2026 < database/vaxcare_2026.sql
```

### Bước 2: Chạy FastAPI AI Service (`vaxcare-ai/`)
```bash
cd vaxcare-ai
python -m venv venv
.\venv\Scripts\Activate.ps1   # (Windows) hoặc source venv/bin/activate (Linux/macOS)
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
👉 Endpoint Swagger UI: `http://localhost:8000/docs`

### Bước 3: Chạy Spring Boot Backend (`vaxcare-be/`)
```bash
cd vaxcare-be
cp .env.example .env
./mvnw spring-boot:run
```
👉 Endpoint Swagger UI: `http://localhost:8080/swagger-ui.html`

### Bước 4: Chạy React Frontend (`vaxcare-fe/`)
```bash
cd vaxcare-fe
cp .env.example .env
npm install
npm run dev
```
👉 Truy cập Web App: **[http://localhost:5173](http://localhost:5173)**

---

## 7. Danh Mục Tài Liệu Chi Tiết

- **Tài liệu Báo cáo PDF**: [`Vaxcare_2026.pdf`](./Vaxcare_2026.pdf) 
- **Tài liệu Backend Service**: [`vaxcare-be/README.md`](./vaxcare-be/README.md)
- **Tài liệu Frontend Application**: [`vaxcare-fe/README.md`](./vaxcare-fe/README.md)
- **Tài liệu Cơ sở Dữ liệu**: [`database/README.md`](./database/README.md)
- **Tài liệu AI Service**:
  - [`vaxcare-ai/README.md`](./vaxcare-ai/README.md): Hướng dẫn cài đặt & tổng quan FastAPI AI Service.
  - [`vaxcare-ai/AI_OVERVIEW.md`](./vaxcare-ai/AI_OVERVIEW.md): Kiến trúc AI & Luồng tương tác Circuit Breaker.
  - [`vaxcare-ai/DATASET.md`](./vaxcare-ai/DATASET.md): Chi tiết 2 tập dữ liệu `appointment_waittime.csv` & `vaccine_demand.csv`.
  - [`vaxcare-ai/AI1_APPOINTMENT_PREDICTION.md`](./vaxcare-ai/AI1_APPOINTMENT_PREDICTION.md): Chi tiết mô hình AI1 & logic xếp hạng khung giờ.
  - [`vaxcare-ai/AI2_DEMAND_FORECAST.md`](./vaxcare-ai/AI2_DEMAND_FORECAST.md): Chi tiết mô hình AI2 & logic dự báo chuỗi thời gian.
  - [`vaxcare-ai/TRAINING.md`](./vaxcare-ai/TRAINING.md): Quy trình 8 bước huấn luyện model qua Jupyter Notebooks.
