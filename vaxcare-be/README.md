# VaxCare Backend Service (`vaxcare-be`)

**VaxCare Backend Service** là máy chủ xử lý nghiệp vụ trung tâm của hệ thống tiêm chủng VaxCare, được xây dựng trên nền tảng **Java 21** và framework **Spring Boot 3.3.2**.

Dịch vụ này cung cấp các API RESTful quản lý toàn bộ hệ thống từ đăng ký tiêm chủng, quản lý danh mục vắc xin, cơ sở tiêm, hồ sơ bệnh nhân, quản lý kho vắc xin cho đến việc tích hợp với dịch vụ AI (`vaxcare-ai`) để nhận dự báo và điều phối lịch tiêm.

---

##  Công Nghệ Sử Dụng

- **Core Framework**: Java 21, Spring Boot v3.3.2
- **Data Access & Database**: Spring Data JPA (Hibernate), MySQL 8.0
- **Security & Authentication**: Spring Security, JWT (JSON Web Token - `jjwt` 0.11.5)
- **Service Integration**: Spring WebFlux (`WebClient`) tích hợp với `vaxcare-ai`
- **Utility & Tools**: Lombok, Jackson (JSR310 Datatype), ZXing 3.5.3 (Tạo & quét mã QR), Spring Validation
- **Documentation**: Springdoc OpenAPI / Swagger UI (v2.6.0)
- **Containerization**: Docker, Docker Compose

---

##  Cấu Trúc Thư Mục Project

```text
vaxcare-be/
├── src/
│   └── main/
│       ├── java/com/vaxcare/
│       │   ├── common/            # Response DTOs, Exception handlers, Constants
│       │   ├── config/            # Web, Security, WebClient & DataSeeder configurations
│       │   ├── feature/           # Các phân hệ nghiệp vụ chính
│       │   │   ├── ai/            # Integration client tới vaxcare-ai (AiServiceClient, Circuit Breaker)
│       │   │   ├── appointment/   # Quản lý đặt lịch tiêm chủng & slot
│       │   │   ├── auth/          # Đăng ký, đăng nhập, cấp phát JWT
│       │   │   ├── dashboard/     # Báo cáo thống kê tổng quan
│       │   │   ├── facility/      # Quản lý cơ sở tiêm chủng
│       │   │   ├── inventory/     # Quản lý kho & cảnh báo tồn kho vắc xin
│       │   │   ├── notification/  # Gửi thông báo & email
│       │   │   ├── reaction/      # Theo dõi phản ứng sau tiêm
│       │   │   ├── report/        # Xuất báo cáo thống kê
│       │   │   ├── vaccination/   # Quản lý lượt tiêm thực tế
│       │   │   └── vaccine/       # Quản lý danh mục vắc xin & bảng giá
│       │   ├── security/          # Custom UserDetailsService, JwtTokenProvider, JwtAuthenticationFilter
│       │   └── utils/             # Helper utilities (DateUtils, QRCodeGenerator)
│       └── resources/
│           ├── application.properties # File cấu hình Spring Boot
│           └── templates/         # Email templates
├── .env.example                   # File mẫu cấu hình biến môi trường
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose orchestration
├── pom.xml                        # Maven dependency management
└── mvnw / mvnw.cmd                # Maven Wrapper
```

---

##  Cấu Hình Môi Trường (.env)

Tạo file `.env` tại thư mục `vaxcare-be/` dựa trên `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vaxcare_2026
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-this-in-production-min-256-bits
JWT_EXPIRATION=86400000

# Server Configuration
SERVER_PORT=8080

# AI Service (FastAPI) URL
AI_SERVICE_URL=http://localhost:8000

# Mail Configuration
MAIL_USERNAME=vaxcare2026@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

---

##  Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu trước khi chạy:
- Đã cài đặt **Java 21** (JDK 21) và thiết lập `JAVA_HOME`.
- Cơ sở dữ liệu MySQL đã sẵn sàng (đã import file `database/vaxcare_2026.sql`).
- (Tùy chọn) Dịch vụ `vaxcare-ai` đang chạy tại port `8000` để sử dụng tính năng gợi ý AI.

---

### Cách 1: Chạy Bằng Maven Wrapper (Local Development)

```bash
# Di chuyển vào thư mục vaxcare-be
cd vaxcare-be

# Sao chép và cấu hình biến môi trường
cp .env.example .env

# Chạy ứng dụng Spring Boot
# Trên Windows PowerShell:
.\mvnw.cmd spring-boot:run

# Trên Linux / macOS:
./mvnw spring-boot:run
```

---

### Cách 2: Chạy Bằng Docker Compose

```bash
# Di chuyển vào thư mục vaxcare-be
cd vaxcare-be

# Build và khởi chạy container backend cùng MySQL
docker compose up -d --build
```

---

##  Tài Liệu API (Swagger UI)

Khi ứng dụng đã khởi chạy thành công, truy cập Swagger UI tương tác tại:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI Specs**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

##  Tích Hợp Với AI Service (`vaxcare-ai`)

Backend sử dụng `AiServiceClient.java` để gọi sang `vaxcare-ai` qua REST Client:
- **Endpoint Gợi Ý Khung Giờ (AI1)**: `/api/v1/ai/dispatch`
- **Endpoint Dự Báo Nhu Cầu Vắc Xin (AI2)**: `/api/v1/ai/forecast`
- **Cơ chế Circuit Breaker**: Mở mạch ngắt kết nối 20 giây khi `vaxcare-ai` xảy ra sự cố, tự động dùng slot tiêu chuẩn mà không làm hỏng trải nghiệm người dùng.
