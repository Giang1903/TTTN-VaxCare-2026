# Hướng Dẫn Cơ Sở Dữ Liệu VaxCare (`database`)

Thư mục này chứa script khởi tạo và cấu trúc Cơ sở dữ liệu MySQL 8.0 cho toàn bộ hệ thống quản lý tiêm chủng VaxCare.

---

## 1. Tổng Quan Cơ Sở Dữ Liệu

- **Hệ quản trị CSDL**: MySQL 8.0+
- **Tên Database**: `vaxcare_2026`
- **Bảng mã / Collation**: `utf8mb4_0900_ai_ci`
- **File Dump Script**: `vaxcare_2026.sql` (chứa định nghĩa cấu trúc bảng và dữ liệu mẫu khởi tạo)

---

## 2. Danh Sách Các Bảng Chính Trong Hệ Thống

| Nhóm chức năng | Tên bảng | Nội dung lưu trữ |
| :--- | :--- | :--- |
| **Phân quyền & Tài khoản** | `accounts` | Tài khoản đăng nhập, email, mật khẩu mã hóa BCrypt, vai trò (`USER`, `MEDICAL_STAFF`, `ADMIN`) |
| | `users` | Thông tin người dân / bệnh nhân (Họ tên, ngày sinh, BHYT, địa chỉ) |
| | `admins` | Thông tin quản trị viên hệ thống |
| | `medical_staff` | Thông tin nhân viên y tế và cơ sở làm việc |
| **Cơ sở & Vắc xin** | `facilities` | Danh sách các trung tâm / cơ sở tiêm chủng VaxCare |
| | `vaccine_categories` | Nhóm danh mục vắc xin |
| | `vaccines` | Thông tin loại vắc xin, số mũi tiêm, khoảng cách mũi, nguồn gốc |
| | `vaccine_prices` | Lịch sử giá vắc xin |
| **Đặt lịch tiêm** | `appointments` | Đơn đăng ký đặt lịch tiêm chủng, ngày tiêm, khung giờ, mã QR |
| | `appointment_details` | Chi tiết vắc xin đăng ký trong từng đơn đặt |
| **Hồ sơ tiêm & Phản ứng** | `vaccination_records` | Lịch sử tiêm chủng thực tế (bác sĩ khám, người tiêm, số lô) |
| | `reactions` | Ghi nhận phản ứng sau tiêm chủng của bệnh nhân |
| **Quản lý kho** | `inventory` | Tồn kho vắc xin tại từng cơ sở (số lượng, ngày hết hạn) |
| | `inventory_transactions` | Lịch sử nhập / xuất / điều chuyển vắc xin giữa các kho |

---

## 3. Hướng Dẫn Import CSDL MySQL

### Cách 1: Sử Dụng Command Line (CLI)

```bash
# 1. Đăng nhập vào MySQL Server
mysql -u root -p

# 2. Tạo Database vaxcare_2026 (nếu chưa có)
CREATE DATABASE IF NOT EXISTS vaxcare_2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
EXIT;

# 3. Import file SQL vào database
mysql -u root -p vaxcare_2026 < database/vaxcare_2026.sql
```

---

### Cách 2: Sử Dụng MySQL Workbench hoặc DBeaver

1. Mở **MySQL Workbench** hoặc **DBeaver** kết nối tới MySQL Server của bạn.
2. Tạo mới Database đặt tên là `vaxcare_2026`.
3. Mở file `database/vaxcare_2026.sql`.
4. Chọn thực thi toàn bộ script (Execute SQL Script).

---

### Cách 3: Sử Dụng phpMyAdmin

1. Truy cập giao diện `http://localhost/phpmyadmin`.
2. Tạo CSDL mới tên `vaxcare_2026`.
3. Chọn thẻ **Import** $\rightarrow$ Chọn file `database/vaxcare_2026.sql` $\rightarrow$ Nhấn **Go**.

---

## 4. Kết Nối Với Backend Spring Boot (`vaxcare-be`)

Sau khi import thành công CSDL, hãy chắc chắn rằng cấu hình trong file `vaxcare-be/.env` của bạn thông số DB trùng khớp:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vaxcare_2026
DB_USERNAME=root
DB_PASSWORD=your_password
```
