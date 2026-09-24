# Mô Tả Chi Tiết Dataset (`DATASET.md`)

Tài liệu này tổng hợp toàn bộ thông tin về 2 tập dữ liệu được sử dụng trong hệ thống `vaxcare-ai`, dựa TRỰC TIẾP trên cấu trúc file CSV và các thuộc tính thực tế trong codebase.

---

## 1. Tổng Quan Các Dataset

| Dataset | File Path | Số lượng bản ghi | Số cột | Target chính | Phạm vi dữ liệu / Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Schedule Wait Time** | `data/appointment_waittime.csv` | **3,600** dòng | 16 | `wait_time_minutes` | Lịch sử đặt chỗ & thời gian chờ tiêm chủng theo từng slot |
| **Vaccine Demand** | `data/vaccine_demand.csv` | **5,460** dòng | 20 | `usage_count` | 156 cặp (cơ sở – vắc xin) từ 2026-05-01 đến 2026-06-04 |

---

## 2. Tập Dữ Liệu AI1: `appointment_waittime.csv`

### Thông số tổng quan:
- **Số lượng bản ghi**: `3,600` dòng.
- **Giá trị thiếu (Missing Values)**: `0` (Không có dòng nào chứa NULL/NaN).
- **Mục tiêu dự đoán (Target)**: `wait_time_minutes` (Thời gian chờ thực tế của bệnh nhân, tính bằng phút).

### Bảng Mô Tả Thuộc Tính (Schema):

| Feature Name | Kiểu dữ liệu | Vai trò trong Code | Ý nghĩa / Mô tả | Nguồn / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `date` | String (YYYY-MM-DD) | Temporal metadata | Ngày diễn ra lịch tiêm | Dữ liệu mô phỏng hệ thống |
| `facility_id` | Integer | ID Metadata | Định danh cơ sở tiêm chủng (1 - 12) | Cơ sở VaxCare |
| `facility_name` | String | Description | Tên cơ sở tiêm chủng | e.g. "VaxCare Phú Nhuận" |
| `day_of_week` | Integer (0–6) | **ML Feature** | Thứ trong tuần (0=Thứ 2 ... 6=Chủ nhật) | Trích xuất từ `date` |
| `is_weekend` | Integer (0/1) | **ML Feature** | Cờ báo ngày cuối tuần (1: Thứ 7/CN, 0: Ngày thường) | Tính toán từ `day_of_week` |
| `is_holiday` | Integer (0/1) | **ML Feature** | Cờ báo ngày lễ | Metadata ngày lễ |
| `hour` | Integer (8–16) | **ML Feature** | Giờ bắt đầu khung giờ (e.g. 8, 9, 10... 16) | Trích xuất từ `time_slot` |
| `time_slot` | String (HH:MM:SS) | Slot Metadata | Khung giờ tiêm chủng | e.g. "13:00:00" |
| `capacity` | Integer | **ML Feature** | Sức chứa tối đa của khung giờ đó | Sức chứa cơ sở cấp |
| `capacity_per_slot_base`| Integer | Baseline | Sức chứa cơ sở chuẩn | Sức chứa định mức |
| `booked` | Integer | **ML Feature** | Số lượt bệnh nhân đã đặt chỗ | Dữ liệu đăng ký |
| `occupancy_rate` | Float (0.0–1.0) | **ML Feature** | Tỷ lệ lấp đầy (`booked / capacity`) | Tính toán trực tiếp |
| `overload_probability` | Float (0.0–1.0) | Target phụ / Metric | Xác suất quá tải của khung giờ | Tính bằng công thức Sigmoid |
| `wait_time_minutes` | Integer | **ML TARGET** | Thời gian bệnh nhân phải chờ (phút) | **Target huấn luyện XGBoost** |
| `is_busy` | Integer (0/1) | Metadata | Cờ báo khung giờ đông/quá tải | Dựa trên ngưỡng chờ |
| `alert_threshold` | Integer | Config Baseline | Ngưỡng thời gian chờ cảnh báo (phút) | Thường là 30–60 phút |

### Phân loại thuộc tính AI1:
- **Numerical Features**: `capacity`, `booked`, `occupancy_rate`, `hour`.
- **Categorical Features**: `day_of_week`, `is_weekend`, `is_holiday`.
- **Temporal Features**: `date`, `time_slot`.
- **Target Variable**: `wait_time_minutes` (Continuous numerical, min=3, max=92, mean=22.35).

---

## 3. Tập Dữ Liệu AI2: `vaccine_demand.csv`

### Thông số tổng quan:
- **Số lượng bản ghi**: `5,460` dòng.
- **Giá trị thiếu (Missing Values)**: `0` (Không có giá trị khuyết thiếu trong dữ liệu gốc).
- **Phạm vi thời gian**: Từ `2026-05-01` đến `2026-06-04` (35 ngày liên tục).
- **Số nhóm cơ sở – vắc xin**: `156` cặp duy nhất (Groupby `facility_id` & `vaccine_id`).
- **Mục tiêu dự đoán (Target)**: `usage_count` (Số liều vắc xin tiêu thụ trong ngày).

### Bảng Mô Tả Thuộc Tính (Schema):

| Feature Name | Kiểu dữ liệu | Vai trò trong Code | Ý nghĩa / Mô tả | Nguồn / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `date` | Date (YYYY-MM-DD) | Temporal Index | Ngày ghi nhận tiêu thụ | Trục thời gian chính |
| `facility_id` | Integer | Entity ID | Định danh cơ sở tiêm chủng | 1 - 12 |
| `facility_name` | String | Description | Tên cơ sở tiêm chủng | e.g. "VaxCare Phú Nhuận" |
| `vaccine_id` | Integer | Entity ID | Định danh loại vắc xin | 1 - 13 |
| `vaccine_name` | String | Description | Tên thương mại / Y học của vắc xin | e.g. "Vắc xin BCG" |
| `category_id` | Integer | Category ID | Loại nhóm vắc xin | Phân loại vắc xin |
| `required_doses` | Integer | Domain Info | Số mũi tiêm bắt buộc | Thông tin y khoa |
| `dose_interval_days` | Integer | Domain Info | Khoảng cách giữa các mũi tiêm (ngày) | Thông tin y khoa |
| `average_rating` | Float | Metadata | Đánh giá trung bình của vắc xin | 4.5 - 5.0 |
| `total_bookings_baseline`| Integer | Baseline | Lượng đăng ký trung bình chuẩn | Tham chiếu nhu cầu |
| `price` | Integer | Metadata | Giá một liều vắc xin (VNĐ) | e.g. 250,000 - 980,000 |
| `day_of_week` | Integer (0–6) | **ML Feature** | Thứ trong tuần (0=Thứ 2 ... 6=Chủ nhật) | Tính từ `date` |
| `month` | Integer (1–12) | **ML Feature** | Tháng trong năm | Tính từ `date` |
| `is_weekend` | Integer (0/1) | **ML Feature** | Cờ ngày cuối tuần | Tính từ `day_of_week` |
| `usage_count` | Integer | **ML TARGET** | **Số liều vắc xin tiêu thụ thực tế** | **Target chính (min=0, max=50)** |
| `current_stock` | Integer | Inventory | Lượng tồn kho hiện tại | Dữ liệu kho |
| `days_to_expiry` | Integer | Inventory | Số ngày còn lại trước khi hết hạn | Dữ liệu kho |
| `near_expiry` | Integer (0/1) | Inventory | Cờ báo vắc xin sắp hết hạn | Dữ liệu kho |
| `alert_threshold` | Integer | Inventory Config | Ngưỡng tồn kho tối thiểu cần báo | Thường là 50 |
| `low_stock` | Integer (0/1) | Inventory | Cờ báo tồn kho thấp hơn ngưỡng | Dữ liệu kho |

### Engineered Time-Series Features (Tạo ra trong quá trình Preprocessing):
Trải qua bước Feature Engineering trong `train_demand.ipynb` & `demand_service.py`, 8 thuộc tính sau được trích xuất và đưa vào mô hình XGBoost:

1. `lag_1`: Lượng tiêu thụ ngày $t-1$.
2. `lag_7`: Lượng tiêu thụ ngày $t-7$ (cùng thứ tuần trước).
3. `lag_14`: Lượng tiêu thụ ngày $t-14$ (cùng thứ 2 tuần trước).
4. `roll_mean_7`: Trung bình trượt 7 ngày gần nhất (không bao gồm ngày $t$).
5. `roll_mean_14`: Trung bình trượt 14 ngày gần nhất (không bao gồm ngày $t$).
6. `day_of_week`: Thứ trong tuần (0..6).
7. `month`: Tháng (1..12).
8. `is_weekend`: Ngày cuối tuần (0/1).
