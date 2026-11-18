# Frontend VaxCare

Frontend là ứng dụng web cho người dân, nhân viên y tế và quản trị viên. Ứng dụng được xây dựng bằng React 19, Vite và React Router; dữ liệu nghiệp vụ được lấy từ backend Spring Boot.

## Các khu vực giao diện

- **Công khai:** trang chủ, cơ sở tiêm, danh mục vắc xin, hỗ trợ và thông tin thanh toán.
- **Người dân:** dashboard, đặt lịch, lịch hẹn, hồ sơ tiêm, thông báo và phản ứng sau tiêm.
- **Nhân viên:** lịch hẹn, ghi nhận tiêm, tồn kho, phản ứng và báo cáo.
- **Quản trị viên:** dashboard, người dùng, nhân viên, cơ sở, vắc xin, kho, giá và dự báo.

Mã nguồn nằm trong `src/`; các trang trong `src/pages/`, thành phần dùng lại trong `src/components/`, gọi API trong `src/services/`, định tuyến trong `src/routes/`.

## Yêu cầu

- Node.js 20 trở lên
- npm
- Backend đang chạy nếu muốn sử dụng dữ liệu thật

## Chạy phát triển

Từ thư mục `vaxcare-fe`:

```powershell
npm install
npm run dev
```

Mở URL được Vite hiển thị (mặc định `http://localhost:5173`).

Backend API mặc định là `http://localhost:8080/api/v1`. Nếu dùng địa chỉ khác, tạo file `.env.local` trong thư mục frontend và đặt:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

Vite tự đọc các file `.env*` khi khởi chạy. Chỉ đưa vào frontend những cấu hình có thể công khai; biến `VITE_*` được nhúng vào mã client.

## Kiểm tra và build

```powershell
npm run lint
npm run build
npm run preview
```

- `lint`: kiểm tra quy tắc ESLint.
- `build`: tạo bản production trong `dist/`.
- `preview`: xem thử bản build trên máy cá nhân.

## Cấu trúc mã nguồn

| Thư mục/tệp | Vai trò |
|---|---|
| `src/pages/` | Các trang theo chức năng và vai trò. |
| `src/components/` | Thành phần giao diện dùng lại. |
| `src/layouts/` | Bố cục chung theo khu vực. |
| `src/routes/` | Định nghĩa đường dẫn và bảo vệ trang. |
| `src/context/` | Trạng thái dùng chung, bao gồm phiên đăng nhập. |
| `src/services/` | Giao tiếp REST API và realtime. |
| `src/styles/` | CSS và quy tắc giao diện. |

Việc ẩn trang theo vai trò chỉ phục vụ trải nghiệm giao diện. Backend vẫn phải xác thực và phân quyền cho mọi thao tác dữ liệu.
