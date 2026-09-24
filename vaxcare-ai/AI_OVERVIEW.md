# Kiến Trúc Tổng Thể VaxCare AI Service (`AI_OVERVIEW.md`)

Tài liệu này mô tả kiến trúc tổng thể của dịch vụ AI trong hệ thống VaxCare, luồng tương tác giữa VaxCare Backend (Spring Boot) và AI Service (FastAPI), cơ chế Resilience/Circuit Breaker, cùng việc phân tách giữa dự đoán bằng Machine Learning và tính toán theo Rule-based/Business logic.

---

## 🏗 1. Sơ Đồ Kiến Trúc Hệ Thống

```text
               +----------------------------------+
               |  VaxCare Backend (Spring Boot)  |
               |       (Port 8080 / WebClient)    |
               +----------------------------------+
                                |
                   HTTP POST (REST API)
             (Circuit Breaker Cooldown: 20s)
                                |
                                v
               +----------------------------------+
               |   VaxCare AI Service (FastAPI)   |
               |            (Port 8000)           |
               +----------------------------------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
   +--------------------+               +--------------------+
   |    Module AI1      |               |    Module AI2      |
   | Schedule           |               | Vaccine Demand     |
   | Coordination       |               | Forecasting        |
   +--------------------+               +--------------------+
     |                |                   |                |
     v                v                   v                v
[XGBoost Model]  [Rule/Sigmoid]    [XGBoost Model]   [Autoregressive &
 (Wait Time)     (Booked & Overload)  (Daily Usage)  Period Aggregation]
     |                |                   |                |
     +-------+--------+                   +-------+--------+
             |                                     |
             v                                     v
   models/schedule_waittime.joblib      models/demand_forecast.joblib
```

---

## 🔄 2. Luồng Tương Tác Giữa Backend Và AI Service

1. **Spring Boot Backend Integration**:
   - Class `AiServiceClient.java` trong `vaxcare-be` đóng vai trò Client giao tiếp với `vaxcare-ai` qua `WebClient`.
   - Các API endpoint được gọi:
     - AI1: `/api/v1/ai/dispatch` (alias của `/api/v1/ai/schedule`)
     - AI2: `/api/v1/ai/forecast`
2. **Cơ chế Resilience & Circuit Breaker**:
   - Backend duy trì `AtomicLong` để theo dõi thời gian mở mạch (`CIRCUIT_COOLDOWN_MS = 20,000ms`).
   - Khi `vaxcare-ai` gặp sự cố (timeout, connection refused, 5xx), mạch chuyển sang trạng thái **OPEN** trong 20 giây.
   - Trong thời gian mạch mở, Backend ngắt kết nối đến AI Service và ngay lập tức sử dụng danh sách slot gốc (đối với AI1) hoặc không hiển thị dự báo (đối với AI2), tránh gây nghẽn toàn bộ hệ thống.
3. **Cơ chế Internal Fallback trong AI Service**:
   - Nếu file `.joblib` không tồn tại trong thư mục `models/` hoặc lịch sử tiêu thụ quá ngắn (< 7 điểm dữ liệu), AI Service không báo lỗi HTTP 500 mà tự động kích hoạt **Heuristic Fallback** để trả về kết quả hợp lệ với thuộc tính `model_version = "ai1-heuristic-fallback"` hoặc `"ai2-heuristic-v1"`.

---

## 🧩 3. Chi Tiết Phân Hệ AI1: Schedule Coordination

Phân hệ AI1 giải quyết bài toán xếp hạng các khung giờ tiêm chủng trong ngày tại một cơ sở y tế dựa trên thời gian chờ dự kiến và mức độ quá tải.

### Phân Định Chi Tiết Logic:

| Thành phần | Phương pháp xử lý | Chi tiết triển khai |
| :--- | :--- | :--- |
| **Dự đoán số lượt đặt (`booked`)** | **Rule-based / Blending Formula** | Kết hợp 60% lượt đặt hiện tại + 40% trung bình lịch sử cùng thứ trong tuần: `max(c, round(0.6*c + 0.4*h))` |
| **Dự đoán thời gian chờ (`wait_time_minutes`)** | **Machine Learning (AI Prediction)** | Sử dụng mô hình **XGBRegressor** trained trên 7 features (`day_of_week`, `is_weekend`, `is_holiday`, `hour`, `capacity`, `booked`, `occupancy_rate`) |
| **Tính xác suất quá tải (`overload_probability`)** | **Mathematical Rule (Sigmoid)** | Sử dụng hàm Sigmoid dựa trên tỷ lệ lấp đầy (`ratio = booked / capacity`): $P = \frac{1}{1 + e^{-6(ratio - 0.8)}}$ |
| **Xếp hạng & Gợi ý (`recommend`)** | **Business Rule Logic** | - Sắp xếp tăng dần theo `(estimated_wait_minutes, overload_probability, time_slot)`<br>- Gắn nhãn `recommended = True` cho các slot có `overload_probability < 0.35` (tối đa 3 slot) |

---

## 📈 4. Chi Tiết Phân Hệ AI2: Vaccine Demand Forecasting

Phân hệ AI2 giải quyết bài toán dự báo lượng vắc xin tiêu thụ cho $N$ ngày tới (`horizon_days`, mặc định 28) theo từng chu kỳ (`period_days`, mặc định 7 ngày) cho một cặp (cơ sở y tế, vắc xin).

### Phân Định Chi Tiết Logic:

| Thành phần | Phương pháp xử lý | Chi tiết triển khai |
| :--- | :--- | :--- |
| **Dự báo nhu cầu hàng ngày (`daily_preds`)** | **Machine Learning (Autoregressive XGBoost)** | Dự báo từng ngày trong tương lai bằng mô hình **XGBRegressor** sử dụng 8 time-series features (`lag_1`, `lag_7`, `lag_14`, `roll_mean_7`, `roll_mean_14`, `day_of_week`, `month`, `is_weekend`). Cập nhật chuỗi dự báo xoay vòng để các bước lag sau nhìn thấy giá trị vừa dự báo. |
| **Gom nhóm chu kỳ (`ForecastPeriod`)** | **Aggregation Logic** | Cộng tổng các ngày trong chu kỳ $7$ ngày để tính `predicted_quantity`. |
| **Khoảng tin cậy (`lower_bound`, `upper_bound`)** | **Statistical Logic** | Ước tính độ lệch chuẩn sai số `residual_std` từ biến động lịch sử 1 ngày. Khoảng tin cậy $80\%$ tính bằng: $total \pm 1.28 \times residual\_std \times \sqrt{len(chunk)}$. |
| **Độ tin cậy (`confidence_level`)** | **Heuristic Estimate** | Ước tính từ hệ số biến thiên (CV) của residual: $conf = \max(0.4, \min(0.95, 1.0 - 0.35 \times CV))$. |
| **Xử lý thiếu dữ liệu / Lịch sử ngắn** | **Heuristic Fallback** | Nếu lịch sử $< 7$ ngày hoặc mất file model: Dùng trung bình trọng số 7 ngày (60%) & 14 ngày (40%), nhân hệ số điều chỉnh theo thứ trong tuần. |

---

## 📊 5. Bảng Tổng Hợp So Sánh AI Module

```text
+-----------------------+----------------------------------+----------------------------------+
| Tiêu chí              | AI1 (Schedule Coordination)      | AI2 (Vaccine Demand Forecast)    |
+-----------------------+----------------------------------+----------------------------------+
| Dạng bài toán         | Regression & Slot Ranking        | Time-Series Autoregressive       |
| Target chính          | wait_time_minutes                | usage_count (Daily Doses)        |
| Model chính           | XGBRegressor (max_depth=6)       | XGBRegressor (max_depth=5)       |
| Số lượng Features     | 7 features                       | 8 features                       |
| File Artifact         | models/schedule_waittime.joblib  | models/demand_forecast.joblib    |
| Heuristic Fallback    | Threshold lấp đầy (8/20/38/60m)  | Weighted Rolling Mean + Profile  |
| Primary API Route     | POST /api/v1/ai/schedule         | POST /api/v1/ai/forecast         |
+-----------------------+----------------------------------+----------------------------------+
```
