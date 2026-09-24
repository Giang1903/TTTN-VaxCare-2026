# VaxCare AI Service (`vaxcare-ai`)

**VaxCare AI Service** là dịch vụ trí tuệ nhân tạo độc lập thuộc hệ thống quản lý trung tâm tiêm chủng VaxCare, được phát triển bằng **Python 3.11** và framework **FastAPI**. 

Dịch vụ này cung cấp hai phân hệ thông minh chính cho backend VaxCare (Spring Boot):
1. **AI1 (Schedule Coordination & Wait-Time Prediction)**: Dự đoán thời gian chờ tiêm chủng tại từng khung giờ và phân tích xác suất quá tải, xếp hạng và gợi ý các khung giờ tối ưu cho người dân đăng ký tiêm chủng.
2. **AI2 (Vaccine Demand Forecasting)**: Dự báo nhu cầu tiêu thụ vắc xin theo từng giai đoạn (horizon & period) dựa trên chuỗi thời gian lịch sử tiêu thụ, giúp cơ sở y tế chủ động quản lý kho vắc xin và lập kế hoạch cung ứng.

---

## Công Nghệ Sử Dụng

- **Core & API Framework**: Python 3.11, FastAPI (v0.115.8), Uvicorn (v0.34.0), Pydantic v2 (v2.10.6), pydantic-settings (v2.7.1)
- **Data & Machine Learning**: NumPy (v2.2.3), Pandas (v2.2.3), Scikit-Learn (v1.6.1), XGBoost (v2.1.4), Joblib (v1.4.2)
- **Time-series & Utilities**: Python-dateutil, Holidays
- **Development & Training**: Jupyter Notebook, Matplotlib, Seaborn
- **Containerization**: Docker, Docker Compose

---

## Cấu Trúc Thư Mục Project

```text
vaxcare-ai/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py          # Quản lý cấu hình Settings từ env file & mặc định
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── schedule.py        # Router API cho AI1 (/api/v1/ai/schedule, /dispatch)
│   │   └── demand.py          # Router API cho AI2 (/api/v1/ai/forecast)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── schedule.py        # Pydantic Schemas cho AI1 (ScheduleRequest, ScheduleResponse)
│   │   └── demand.py          # Pydantic Schemas cho AI2 (ForecastRequest, ForecastResponse)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── schedule_service.py # Logic nghiệp vụ & inference model AI1
│   │   └── demand_service.py   # Logic nghiệp vụ & inference model AI2
│   ├── __init__.py
│   └── main.py                # FastAPI app entry point & Health check
├── data/
│   ├── appointment_waittime.csv # Dataset lịch sử cho AI1 (3,600 dòng)
│   └── vaccine_demand.csv       # Dataset lịch sử cho AI2 (5,460 dòng)
├── models/
│   ├── .gitkeep
│   ├── schedule_waittime.joblib # Model XGBoost AI1 đã huấn luyện
│   └── demand_forecast.joblib   # Model XGBoost AI2 đã huấn luyện
├── notebooks/
│   ├── train_schedule.ipynb     # Notebook huấn luyện & đánh giá model AI1
│   └── train_demand.ipynb       # Notebook huấn luyện & đánh giá model AI2
├── .env.example                # File cấu hình mẫu môi trường
├── .gitignore
├── Dockerfile                  # Script đóng gói Docker image
└── requirements.txt            # Danh sách thư viện Python phụ thuộc
```

---

## Cấu Hình Môi Trường (.env)

Tạo file `.env` từ `.env.example`:

```env
# API Server Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Backend Integration
VAXCARE_BE_URL=http://localhost:8080
VAXCARE_BE_API_KEY=

# Model Directory & Parameters
MODEL_DIR=./models
FORECAST_HORIZON_DAYS=14

# Logging
LOG_LEVEL=INFO
```

---

## Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Chạy Trực Tiếp Bằng Python Môi Trường Ảo (Virtual Environment)

```bash
# Di chuyển vào thư mục vaxcare-ai
cd vaxcare-ai

# Tạo môi trường ảo (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Cài đặt các phụ thuộc
pip install --upgrade pip
pip install -r requirements.txt

# Chạy server FastAPI ở chế độ Development (uVicorn)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Chạy Bằng Docker Container

```bash
# Build Docker image
docker build -t vaxcare-ai:latest .

# Run Docker container
docker run -d -p 8000:8000 --name vaxcare-ai-service vaxcare-ai:latest
```

---

## Huấn Luyện (Training) Các Model AI

Hiện tại các pipeline huấn luyện model được triển khai dạng **Jupyter Notebook** tương tác trong thư mục `notebooks/`:

### Huấn luyện AI1 (Schedule Coordination):
- Mở notebook: `notebooks/train_schedule.ipynb`
- Nguồn dữ liệu: `data/appointment_waittime.csv`
- Đầu ra model: `models/schedule_waittime.joblib`
- Thuật toán: **XGBRegressor** (200 estimators, max_depth=6, lr=0.08)

### Huấn luyện AI2 (Vaccine Demand Forecast):
- Mở notebook: `notebooks/train_demand.ipynb`
- Nguồn dữ liệu: `data/vaccine_demand.csv`
- Đầu ra model: `models/demand_forecast.joblib`
- Thuật toán: **XGBRegressor** (200 estimators, max_depth=5, lr=0.08)

---

## Danh Sách API Chính

FastAPI tự động khởi tạo tài liệu Swagger UI tại: `http://localhost:8000/docs`

| Endpoint | Method | Phân hệ | Chức năng chính |
| :--- | :--- | :--- | :--- |
| `GET /` | `GET` | System | Health check & danh sách module AI |
| `POST /api/v1/ai/schedule` | `POST` | AI1 | Xếp hạng khung giờ, dự đoán thời gian chờ & xác suất quá tải |
| `POST /api/v1/ai/dispatch` | `POST` | AI1 | Alias route tương đương `/api/v1/ai/schedule` |
| `POST /api/v1/ai/forecast` | `POST` | AI2 | Dự báo nhu cầu vắc xin theo chuỗi thời gian tiêu thụ |

---

## Đường Dẫn Lưu Model AI Artifacts

Các model được serialize bằng `joblib` và lưu trữ tại thư mục `models/`:
- **AI1 Model Artifact**: `models/schedule_waittime.joblib` (Chứa object model XGBoost, danh sách feature, metrics MAE/RMSE/R², và model_version `"ai1-xgboost-v1"`).
- **AI2 Model Artifact**: `models/demand_forecast.joblib` (Chứa object model XGBoost, feature_cols, metrics MAE/RMSE/R²/MAPE, và model_version `"ai2-xgboost-v1"`).

*(Trong trường hợp không tìm thấy file `.joblib` hoặc lịch sử dữ liệu không đủ, ứng dụng sẽ tự động chuyển sang chế độ **Heuristic Fallback** mà không làm gián đoạn hệ thống).*
