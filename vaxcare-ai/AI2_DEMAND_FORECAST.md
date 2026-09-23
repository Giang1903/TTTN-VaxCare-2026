# AI2: Vaccine Demand Forecasting (`AI2_DEMAND_FORECAST.md`)

Tài liệu này chi tiết hóa phân hệ AI2 trong hệ thống `vaxcare-ai`, dựa TRỰC TIẾP trên các file `app/services/demand_service.py`, `app/schemas/demand.py`, `app/routers/demand.py` và `notebooks/train_demand.ipynb`.

---

##  1. Mục Tiêu

Dự báo lượng vắc xin nhu cầu tiêu thụ trong tương lai cho một cặp (cơ sở tiêm chủng `facility_id`, vắc xin `vaccine_id`) theo từng giai đoạn (`period_days`, ví dụ 7 ngày) trên một khoảng thời gian dự báo (`horizon_days`, ví dụ 28 ngày). 

Kết quả dự báo giúp trung tâm tiêm chủng chủ động trong công tác đặt hàng vắc xin, tránh tình trạng hết hàng (out of stock) hoặc lãng phí vắc xin quá hạn.

---

##  2. Input Cho API Inference

Dữ liệu gửi tới HTTP `POST /api/v1/ai/forecast` theo schema `ForecastRequest`:

```json
{
  "vaccine_id": 1,
  "facility_id": 1,
  "history": [
    {"period_date": "2026-05-01", "quantity": 7},
    {"period_date": "2026-05-02", "quantity": 13},
    {"period_date": "2026-05-03", "quantity": 12},
    {"period_date": "2026-05-04", "quantity": 9}
  ],
  "horizon_days": 28,
  "period_days": 7
}
```

---

##  3. Dataset

- **Tên dataset**: `data/vaccine_demand.csv`
- **Kích thước**: 5,460 dòng (35 ngày dữ liệu của 156 cặp cơ sở – vắc xin).
- **Mục tiêu dự đoán (Target)**: `usage_count` (Số liều tiêu thụ trong ngày).

---

##  4. Feature Engineering & Preprocessing

Mô hình AI2 sử dụng 8 thuộc tính thuộc nhóm **Time-Series Lags & Calendar Features** (`FEATURE_COLS`):

1. `lag_1`: Số liều tiêu thụ ngày $t-1$.
2. `lag_7`: Số liều tiêu thụ ngày $t-7$.
3. `lag_14`: Số liều tiêu thụ ngày $t-14$.
4. `roll_mean_7`: Trung bình trượt 7 ngày gần nhất.
5. `roll_mean_14`: Trung bình trượt 14 ngày gần nhất.
6. `day_of_week`: Thứ trong tuần ($0$ = Thứ hai ... $6$ = Chủ nhật).
7. `month`: Tháng trong năm ($1 .. 12$).
8. `is_weekend`: Cờ ngày cuối tuần ($1.0$ nếu thứ 7 / Chủ nhật, ngược lại $0.0$).

### Luồng Tiền Xử Lý Chuỗi Thời Gian (`_history_to_series`):
- Chuyển danh sách `history` thành `Pandas Series` có index là ngày.
- Loại bỏ trùng lặp ngày, sắp xếp tăng dần.
- Bổ sung các ngày bị thiếu trong khoảng $[min\_date, max\_date]$ và điền giá trị `0.0`.

---

##  5. Phân Tách Chi Tiết: Machine Learning vs Rule/Aggregation Logic

Phân hệ AI2 kết hợp giữa mô hình tự hồi quy Machine Learning và các thuật toán gom nhóm thống kê:

### A. Dự Báo Nhu Cầu Hàng Ngày Bằng ML (Autoregressive Daily Forecasting)
- **Phương pháp**: Dự báo từng ngày một liên tiếp trong $N = \text{horizon\_days}$ ngày.
- **Tự hồi quy (Autoregressive Loop)**: Tại mỗi ngày $t$, hàm `_build_features_for_day` tính toán các thuộc tính `lag_1`, `lag_7`, `roll_mean_7`... dựa trên lịch sử đã biết + **các giá trị vừa được AI2 dự báo ở những bước trước đó**. Giá trị dự báo mới được chèn lại vào chuỗi dữ liệu giả lập (`working.loc[t] = pred`).

### B. Thuật Toán Fallback Heuristic (Khi mất model hoặc Lịch sử ngắn)
- Nếu file `demand_forecast.joblib` không tồn tại hoặc lịch sử chuỗi $< 7$ điểm dữ liệu (`settings.demand_min_history_points`):
  - Tính mức tiêu thụ cơ sở: $0.6 \times \text{mean}_7 + 0.4 \times \text{mean}_{14}$.
  - Nhân với tỷ lệ hồ sơ thứ trong tuần ($\text{mean}_{dow} / \text{global\_mean}$). Nếu là ngày cuối tuần không có profile, giảm nhẹ hệ số xuống $0.75$.

### C. Gom Nhóm Chu Kỳ & Tính Khoảng Tin Cậy (Rule/Statistical Aggregation)
Hàm `_aggregate_to_periods` thực hiện gom chuỗi ngày thành từng bucket `period_days` ($7$ ngày):
1. **Tổng lượng dự báo (`predicted_quantity`)**: 
   $$\text{predicted\_quantity} = \text{round}\left(\sum_{i=1}^{\text{period\_days}} \text{daily\_pred}_i\right)$$
2. **Khoảng tin cậy ($80\%$ Confidence Bounds)**:
   - Ước lượng độ lệch chuẩn sai số 1 ngày (`residual_std`) từ độ chênh lệch tiêu thụ giữa 2 ngày liên tiếp gần đây.
   - Độ lệch chuẩn của cả chu kỳ: $\text{std\_period} = \text{residual\_std} \times \sqrt{\text{period\_days}}$.
   - Ngưỡng dưới: $\text{lower\_bound} = \max\left(0, \text{round}(\text{total} - 1.28 \times \text{std\_period})\right)$.
   - Ngưỡng trên: $\text{upper\_bound} = \max\left(\text{predicted\_quantity}, \text{round}(\text{total} + 1.28 \times \text{std\_period})\right)$.
3. **Mức độ tin cậy (`confidence_level`)**:
   - Ước tính từ hệ số biến thiên (CV): $conf = \max(0.4, \min(0.95, 1.0 - 0.35 \times CV))$.

---

##  6. Mô Hình & Hyperparameters

Mô hình AI2 sử dụng thuật toán **XGBoost Regressor** (`XGBRegressor`) huấn luyện trong `notebooks/train_demand.ipynb`:

```python
XGBRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.08,
    subsample=0.9,
    colsample_bytree=0.9,
    objective='reg:squarederror',
    random_state=42,
    n_jobs=-1
)
```

---

##  7. Đánh Giá Mô Hình (Empirical Metrics)

Tách tập dữ liệu theo thời gian (Temporal Split: $80\%$ đầu để train = 3,588 dòng, $20\%$ cuối để test = 780 dòng):
- **MAE (Mean Absolute Error)**: `2.098` (liều/ngày)
- **RMSE (Root Mean Squared Error)**: `3.166` (liều/ngày)
- **R² Score**: `0.682`
- **MAPE (Mean Absolute Percentage Error)**: `23.91%`

---

##  8. Lưu Trữ Mô Hình (Model Artifact)

Model được serialize tại `models/demand_forecast.joblib`:

```python
{
    "model": trained_xgboost_model,
    "feature_cols": ["lag_1", "lag_7", "lag_14", "roll_mean_7", "roll_mean_14", "day_of_week", "month", "is_weekend"],
    "model_version": "ai2-xgboost-v1",
    "metrics": {"mae": 2.098, "rmse": 3.166, "r2": 0.682, "mape": 23.91}
}
```

---

##  9. Output Trả Về Từ API

JSON response tuân theo schema `ForecastResponse`:

```json
{
  "vaccine_id": 1,
  "facility_id": 1,
  "model_version": "ai2-xgboost-v1",
  "forecasts": [
    {
      "forecast_period_start": "2026-06-05",
      "forecast_period_end": "2026-06-11",
      "predicted_quantity": 62,
      "confidence_level": 0.825,
      "lower_bound": 52,
      "upper_bound": 72
    },
    {
      "forecast_period_start": "2026-06-12",
      "forecast_period_end": "2026-06-18",
      "predicted_quantity": 58,
      "confidence_level": 0.810,
      "lower_bound": 47,
      "upper_bound": 69
    }
  ]
}
```

---

##  10. Tích Hợp Với Backend VaxCare

- Backend Spring Boot gửi yêu cầu qua `AiServiceClient.java` tại endpoint `/api/v1/ai/forecast`.
- Kết quả dự báo nhu cầu được quản trị viên cơ sở y tế (Inventory Manager / Admin) xem trên dashboard để lên kế hoạch đặt mua vắc xin với nhà cung cấp.

---

## 11. Hạn Chế (Limitations)

1. Mô hình chưa tích hợp thông tin chiến dịch tiêm chủng hoặc bùng phát dịch bệnh bất ngờ.
2. Dữ liệu lịch sử hiện tại chỉ gồm 35 ngày (5,460 bản ghi), khi có dữ liệu vận hành thực tế vài tháng đến vài năm, độ chính xác dự báo mùa vụ (seasonal variations) sẽ được cải thiện đáng kể.
