# VaxCare Frontend Web Application (`vaxcare-fe`)

**VaxCare Frontend** là giao diện người dùng web đa phân quyền thuộc hệ thống tiêm chủng VaxCare, phục vụ người dân đặt lịch tiêm, nhân viên y tế ghi nhận lượt tiêm và quản trị viên quản lý trung tâm tiêm chủng & kho vắc xin.

Ứng dụng được phát triển bằng **React 19**, **Vite** và **React Router v7**.

---

##  Công Nghệ Sử Dụng

- **Core Framework**: React (v19.2.8), React DOM (v19.2.8)
- **Build Tool & Bundler**: Vite (v8.2.0), `@vitejs/plugin-react`
- **Routing**: React Router DOM (v7.18.2)
- **Styling**: Vanilla CSS / Modern CSS Modules
- **Code Quality**: ESLint (v10.8.0), React Hooks Plugin

---

##  Cấu Trúc Thư Mục Project

```text
vaxcare-fe/
├── public/                 # Tài nguyên tĩnh (favicon, logo, icons)
├── src/
│   ├── components/         # Reusable UI components (Navbar, Footer, Modal, Button...)
│   ├── context/            # React Context (AuthContext, ThemeContext...)
│   ├── hooks/              # Custom React Hooks (useAuth, useFetch...)
│   ├── layouts/            # Layout wrappers (MainLayout, AdminLayout, StaffLayout)
│   ├── mockdata/           # Dữ liệu giả lập cho phát triển & testing
│   ├── pages/              # Trang giao diện chính
│   │   ├── admin/          # Quản trị viên (Dashboard, Quản lý kho, Dự báo AI2)
│   │   ├── auth/           # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   ├── staff/          # Nhân viên y tế (Check-in, Ghi nhận mũi tiêm, Khám sàng lọc)
│   │   └── user/           # Người dân (Trang chủ, Đặt lịch tiêm AI1, Tra cứu hồ sơ)
│   ├── routes/             # Định tuyến ứng dụng & Bảo vệ route (ProtectedRoute)
│   ├── services/           # REST API client giao tiếp với Backend (`vaxcare-be`)
│   ├── styles/             # Global Styles & Design System Tokens
│   ├── utils/              # Helper functions (date formatting, storage, validators)
│   ├── App.jsx             # Main App Component
│   └── main.jsx            # Entry point ứng dụng
├── .env                    # Cấu hình biến môi trường
├── .env.example
├── index.html              # HTML Entry Point
├── package.json            # Node dependencies & npm scripts
└── vite.config.js          # Vite build config
```

---

##  Cấu Hình Môi Trường (.env)

Tạo file `.env` tại thư mục `vaxcare-fe/` dựa trên `.env.example`:

```env
# URL gốc kết nối đến VaxCare Backend Service (Spring Boot)
VITE_API_URL=http://localhost:8080/api/v1
```

---

##  Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu môi trường:
- Cài đặt **Node.js** bản 20 trở lên.
- Quản lý gói **npm** (đi kèm khi cài Node.js).

---

### Các Bước Thực Hiện:

```bash
# 1. Di chuyển vào thư mục vaxcare-fe
cd vaxcare-fe

# 2. Tạo file cấu hình môi trường
cp .env.example .env

# 3. Cài đặt các thư viện phụ thuộc
npm install

# 4. Chạy ứng dụng ở chế độ Development Server (Vite HMR)
npm run dev
```

Sau khi chạy lệnh `npm run dev`, ứng dụng sẽ khả dụng tại trình duyệt:
👉 **[http://localhost:5173](http://localhost:5173)**

---

##  Build Sản Phẩm Triển Khai (Production Build)

```bash
# Biển dịch và đóng gói tối ưu code cho Production
npm run build

# Xem thử bản đóng gói (Preview Build)
npm run preview
```

Mã nguồn sau khi build sẽ nằm trong thư mục `dist/`, sẵn sàng triển khai lên Nginx, Vercel hoặc Netlify.
