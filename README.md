# Vaxcare

Hệ thống quản lý tiêm chủng thông minh – hỗ trợ đặt lịch, quản lý kho vắc xin và dự báo bằng AI.

## Tổng quan

| Thành phần | Thư mục | Stack | Port mặc định |
|------------|---------|-------|----------------|
| **Backend** | `vaxcare-be/` | Java 21, Spring Boot 4.1, MySQL | `8080` |
| **Frontend** | `vaxcare-fe/` | React 19, Vite 8 | `5173` |
| **AI Service** | `vaxcare-ai/` | Python 3.11, FastAPI, scikit-learn | `8000` |

## Tính năng chính

- Quản lý lịch tiêm, cơ sở, loại vắc xin
- **Đặt lịch thông minh**: dự báo tải theo khung giờ → gợi ý slot tốt nhất
- **Kho vắc xin thông minh**: dự báo nhu cầu → cảnh báo tồn kho, gợi ý nhập hàng

## Yêu cầu môi trường

- **Java 21** + Maven (hoặc dùng `./mvnw`)
- **Node.js 20+** + npm
- **Python 3.11+**
- **MySQL 8** (hoặc Docker)
- **Docker & Docker Compose** (khuyến nghị)

## Chạy nhanh (từng service)

### 1. Backend

```bash
cd vaxcare-be
cp .env.example .env

./mvnw spring-boot:run
# hoặc
docker compose up --build
```

Chi tiết: [vaxcare-be/README.md](./vaxcare-be/README.md)

### 2. Frontend

```bash
cd vaxcare-fe
cp .env.example .env
npm install
npm run dev
```

Chi tiết: [vaxcare-fe/README.md](./vaxcare-fe/README.md)

### 3. AI Service

```bash
cd vaxcare-ai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```


