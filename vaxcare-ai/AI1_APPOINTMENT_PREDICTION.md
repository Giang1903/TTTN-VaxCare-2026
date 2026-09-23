# AI1: Schedule Coordination & Wait-Time Prediction (`AI1_APPOINTMENT_PREDICTION.md`)

Tài liệu này tập trung trình bày chi tiết phân hệ AI1 trong hệ thống `vaxcare-ai`, dựa TRỰC TIẾP trên các file `app/services/schedule_service.py`, `app/schemas/schedule.py`, `app/routers/schedule.py` và `notebooks/train_schedule.ipynb`.

---

## 1. Mục Tiêu

Dự đoán thời gian chờ tiêm chủng (`wait_time_minutes`) và đánh giá xác suất quá tải (`overload_probability`) cho từng khung giờ trong ngày tại một cơ sở tiêm chủng cụ thể. Qua đó, hệ thống thực hiện xếp hạng và đưa ra danh sách các khung giờ tiêm tối ưu được khuyến nghị (`recommended_slots`) nhằm điều phối lượng người tiêm, giảm thiểu thời gian dồn ứ bệnh nhân.

---

## 2. Input Cho API Inference

Dữ liệu đầu vào gửi lên qua HTTP `POST /api/v1/ai/schedule` (hoặc `/dispatch`) dưới dạng JSON tuân theo schema `ScheduleRequest`:

```json
{
  "facility_id": 1,
  "prediction_date": "2026-06-12",
  "capacity_per_slot": 15,
  "opening_time": "08:00:00",
  "closing_time": "17:00:00",
  "slot_duration_minutes": 60,
  "current_bookings": [
    {"time_slot": "08:00:00", "booked_count": 5},
    {"time_slot": "09:00:00", "booked_count": 12},
    {"time_slot": "10:00:00", "booked_count": 16}
  ],
  "historical_stats": [
    {"time_slot": "08:00:00", "day_of_week": 4, "avg_bookings": 6.2},
    {"time_slot": "09:00:00", "day_of_week": 4, "avg_bookings": 10.5}
  ],
  "is_holiday": 0
}
```

---

## 3. Dataset

- **Tên dataset**: `data/appointment_waittime.csv`
- **Kích thước**: 3,600 dòng.
- **Nguồn**: Lịch sử vận hành tiêm chủng của các cơ sở VaxCare.
- **Biến mục tiêu (Target)**: `wait_time_minutes` (phút).

---

## 4. Feature Engineering & Preprocessing

Mô hình Machine Learning AI1 sử dụng chính xác 7 thuộc tính đầu vào (`FEATURES`):

1. `day_of_week`: Thứ trong tuần (0=Thứ hai ... 6=Chủ nhật), trích xuất từ `prediction_date`.
2. `is_weekend`: Cờ ngày cuối tuần ($1$ nếu `day_of_week` $\ge 5$, ngược lại $0$).
3. `is_holiday`: Cờ ngày lễ ($0$ hoặc $1$), nhận từ tham số đầu vào.
4. `hour`: Giờ bắt đầu khung giờ (e.g. 8, 9, 10, ... 16).
5. `capacity`: Sức chứa của slot (`capacity_per_slot`).
6. `booked`: Số lượt tiêm dự đoán cho slot.
7. `occupancy_rate`: Tỷ lệ lấp đầy, tính bằng $\frac{\text{booked}}{\text{capacity}}$ (làm tròn 3 chữ số thập phân).

---

## 5. Phân Tách Chi Tiết: Machine Learning vs Rule/Logic

Để đảm bảo tính minh bạch, các chỉ số trong `ScheduleResponse` được tạo ra từ hai cơ chế rõ ràng:

### A. Công Thức & Business Logic (Rule-based Calculation)
1. **Chia Khung Giờ (`_build_slots`)**: Khởi tạo danh sách slot từ `opening_time` đến `closing_time` với khoảng cách `slot_duration_minutes`.
2. **Dự Đoán Lượt Đặt Slot (`_predict_bookings`)**:
   Dùng công thức pha trộn (Blending 60/40) giữa số lượt hiện tại và lịch sử cùng thứ:
   $$\text{predicted\_booked} = \max\left(c, \text{round}(0.6 \times c + 0.4 \times h)\right)$$
   *(Trong đó $c$ là số lượt đặt hiện tại, $h$ là trung bình lịch sử).*
3. **Xác Suất Quá Tải (`_sigmoid_overload`)**:
   Sử dụng hàm Sigmoid toán học với ngưỡng tỷ lệ lấp đầy $0.8$:
   $$P_{\text{overload}} = \frac{1}{1 + e^{-6.0 \times (\text{ratio} - 0.8)}}$$
   *(với $\text{ratio} = \frac{\text{booked}}{\text{capacity}}$).*

### B. Dự Đoán Bằng Machine Learning (AI Model Prediction)
- **Thời gian chờ dự kiến (`estimated_wait_minutes`)**: 
  - Mô hình **XGBoost Regressor** nhận 7 features và dự đoán giá trị liên tục của `wait_time_minutes`. Kết quả được ép kiểu `max(0, int(round(pred)))`.
  - **Heuristic Fallback** (nếu không có file model `.joblib`):
    - `occupancy_rate` < 0.35 $\rightarrow$ 8 phút
    - `occupancy_rate` < 0.65 $\rightarrow$ 20 phút
    - `occupancy_rate` < 0.85 $\rightarrow$ 38 phút
    - `occupancy_rate` $\ge$ 0.85 $\rightarrow$ 60 phút

### C. Quy Tắc Xếp Hạng & Gợi Ý Khung Giờ (Ranking & Recommendation Rules)
- **Xếp hạng (`rank`)**: Các slot được sắp xếp ưu tiên theo Tuple: `(estimated_wait_minutes, overload_probability, time_slot)`. Slot có thời gian chờ ít nhất và xác suất quá tải thấp nhất sẽ đứng rank 1.
- **Gợi ý (`recommended`)**: Chỉ gợi ý các slot có `overload_probability < 0.35` (cấu hình trong `settings.recommend_overload_threshold`), giới hạn tối đa N slot tốt nhất (`settings.max_recommendations`, mặc định là 3).

---

## 6. Mô Hình & Hyperparameters

Mô hình AI1 sử dụng thuật toán **XGBoost Regressor** (`XGBRegressor`) huấn luyện trong `notebooks/train_schedule.ipynb` với các siêu tham số:

```python
XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.08,
    subsample=0.85,
    colsample_bytree=0.85,
    min_child_weight=3,
    reg_lambda=1.0,
    objective='reg:squarederror',
    random_state=42,
    n_jobs=-1
)
```

---

## 7. Đánh Giá Mô Hình (Empirical Metrics)

Mô hình được đánh giá trên tập kiểm thử Test (20% dữ liệu, 720 bản ghi):
- **MAE (Mean Absolute Error)**: `5.8116` (phút)
- **RMSE (Root Mean Squared Error)**: `7.7195` (phút)
- **R² Score (Coefficient of Determination)**: `0.8069` (Giải thích được 80.69% độ biến thiên thời gian chờ)

---

##  8. Lưu Trữ Mô Hình (Model Artifact)

Model sau khi huấn luyện được đóng gói bằng `joblib` tại `models/schedule_waittime.joblib` với cấu trúc dictionary:

```python
{
    "model": trained_xgboost_model,
    "features": ["day_of_week", "is_weekend", "is_holiday", "hour", "capacity", "booked", "occupancy_rate"],
    "metrics": {"mae": 5.8116, "rmse": 7.7195, "r2": 0.8069},
    "model_version": "ai1-xgboost-v1"
}
```

---

##  9. Output Trả Về Từ API

Kết quả trả về qua JSON schema `ScheduleResponse`:

```json
{
  "facility_id": 1,
  "prediction_date": "2026-06-12",
  "slots": [
    {
      "time_slot": "08:00:00",
      "predicted_bookings": 5,
      "capacity": 15,
      "occupancy_rate": 0.333,
      "estimated_wait_minutes": 12,
      "overload_probability": 0.0573,
      "recommended": true,
      "rank": 1
    },
    {
      "time_slot": "10:00:00",
      "predicted_bookings": 16,
      "capacity": 15,
      "occupancy_rate": 1.0,
      "estimated_wait_minutes": 65,
      "overload_probability": 0.7685,
      "recommended": false,
      "rank": 3
    }
  ],
  "recommended_slots": ["08:00:00"],
  "most_overloaded_slot": "10:00:00",
  "model_version": "ai1-xgboost-v1"
}
```

---

##  10. Tích Hợp Với Backend VaxCare

- Backend Spring Boot gửi yêu cầu từ `AiServiceClient.java` tới endpoint `/api/v1/ai/dispatch`.
- Nếu AI Service phản hồi thành công, Backend cập nhật danh sách slot đề xuất cho màn hình Đăng ký tiêm chủng của ứng dụng Mobile/Web Frontend.
- Nếu AI Service treo/lỗi, Circuit Breaker của Backend kích hoạt trong 20s và trả về danh sách slot tiêu chuẩn không có thẻ gợi ý AI, không làm nghẽn luồng đăng ký của bệnh nhân.

---

##  11. Hạn Chế (Limitations)

1. Mô hình dự đoán thời gian chờ chưa tính đến các yếu tố sự cố bất ngờ tại phòng tiêm (e.g. cấp cứu tại chỗ, lỗi phần mềm nhập liệu).
2. Quy tắc dự đoán lượt đặt slot `_predict_bookings` dựa trên trọng số cố định (60/40) chứ chưa sử dụng mô hình dự báo chuỗi thời gian riêng cho lượt đăng ký.
