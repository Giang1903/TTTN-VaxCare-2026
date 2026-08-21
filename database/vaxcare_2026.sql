-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th8 12, 2026 lúc 06:09 AM
-- Phiên bản máy phục vụ: 8.0.41
-- Phiên bản PHP: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `vaxcare_2026`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `accounts`
--

CREATE TABLE `accounts` (
  `account_id` bigint NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('USER','MEDICAL_STAFF','ADMIN') NOT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED','DELETED') DEFAULT 'ACTIVE',
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `accounts`
--

INSERT INTO `accounts` (`account_id`, `email`, `password_hash`, `phone`, `role`, `status`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'nguyen.an@email.com', '$2b$10$k6nAptKd.nVOdFQM2F03b.kBfWNGeY4vP0IGOBma.kB.3KHVW/i.W', '0901234567', 'USER', 'ACTIVE', NULL, '2026-08-12 12:33:22', '2026-08-12 12:33:22'),
(2, 'admin@vaxcare.vn', '$2b$10$XNA5Q5vRKvd8tWfhuuxhXOlv7cOROiIh4rYfViLGfgbosBLGGEVna', '0909999888', 'ADMIN', 'ACTIVE', NULL, '2026-08-12 12:33:22', '2026-08-12 12:33:22'),
(3, 'staff.phunhuan@vaxcare.vn', '$2b$10$JLFQcutsf44dHnr50fG8Yew1Ng.cCW4RIDuxAe4fdniCQ7ox4QKzW', '0908888777', 'MEDICAL_STAFF', 'ACTIVE', NULL, '2026-08-12 12:33:22', '2026-08-12 12:33:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admins`
--

CREATE TABLE `admins` (
  `admin_id` bigint NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `admin_level` varchar(50) DEFAULT 'SYSTEM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `admins`
--

INSERT INTO `admins` (`admin_id`, `full_name`, `admin_level`) VALUES
(2, 'Quản trị hệ thống', 'SYSTEM');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `staff_id` bigint DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `recommended_by_ai` tinyint(1) DEFAULT '0',
  `prediction_id` bigint DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `time_slot` time NOT NULL,
  `status` enum('PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW') DEFAULT 'PENDING',
  `qr_code` varchar(255) DEFAULT NULL,
  `note` text,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` bigint NOT NULL,
  `account_id` bigint DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `demand_forecasts`
--

CREATE TABLE `demand_forecasts` (
  `forecast_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  `forecast_period_start` date NOT NULL,
  `forecast_period_end` date NOT NULL,
  `predicted_quantity` int NOT NULL,
  `actual_quantity` int DEFAULT NULL,
  `confidence_level` decimal(5,4) DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `health_profiles`
--

CREATE TABLE `health_profiles` (
  `profile_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `medical_history` text,
  `allergies` text,
  `note` text,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `health_profiles`
--

INSERT INTO `health_profiles` (`profile_id`, `user_id`, `height`, `weight`, `medical_history`, `allergies`, `note`, `updated_at`) VALUES
(1, 1, 172.50, 68.00, NULL, NULL, 'Không có tiền sử dị ứng đặc biệt', '2026-08-12 12:33:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `medical_staff`
--

CREATE TABLE `medical_staff` (
  `staff_id` bigint NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `staff_code` varchar(50) DEFAULT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `facility_id` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `medical_staff`
--

INSERT INTO `medical_staff` (`staff_id`, `full_name`, `staff_code`, `specialty`, `facility_id`) VALUES
(3, 'BS. Trần Minh', 'STF-PN-001', 'Tiêm chủng', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL,
  `account_id` bigint NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `type` enum('REMINDER','APPOINTMENT','SYSTEM','AFTER_VACCINATION','STOCK_ALERT') NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `related_id` bigint DEFAULT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`notification_id`, `account_id`, `title`, `content`, `type`, `is_read`, `related_id`, `sent_at`) VALUES
(1, 1, 'Nhắc lịch tiêm HPV', 'Bạn có lịch tiêm mũi 2 vắc xin HPV vào ngày 15/09/2026 tại VaxCare Phú Nhuận.', 'REMINDER', 0, NULL, '2026-08-10 09:00:00'),
(2, 1, 'Thanh toán thành công', 'Giao dịch thanh toán lịch hẹn đã thành công.', 'APPOINTMENT', 1, NULL, '2026-08-05 14:30:00'),
(3, 1, 'Chào mừng đến VaxCare', 'Cảm ơn bạn đã đăng ký tài khoản. Hãy hoàn thiện hồ sơ sức khỏe để nhận gợi ý phù hợp.', 'SYSTEM', 1, NULL, '2026-07-20 10:15:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `payment_id` bigint NOT NULL,
  `appointment_id` bigint NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('VNPAY','MOMO','CASH') DEFAULT 'VNPAY',
  `status` enum('PENDING','SUCCESS','FAILED','REFUNDED') DEFAULT 'PENDING',
  `payment_time` datetime DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `post_vaccination_reactions`
--

CREATE TABLE `post_vaccination_reactions` (
  `reaction_id` bigint NOT NULL,
  `detail_id` bigint NOT NULL,
  `severity` enum('NONE','MILD','MODERATE','SEVERE') DEFAULT 'NONE',
  `symptoms` text,
  `recorded_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `processing_status` enum('PENDING','REVIEWED','CONTACTED','RESOLVED') DEFAULT 'PENDING',
  `staff_note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `price_lists`
--

CREATE TABLE `price_lists` (
  `price_list_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `facility_id` bigint DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `price_lists`
--

INSERT INTO `price_lists` (`price_list_id`, `vaccine_id`, `facility_id`, `price`, `effective_date`, `expiry_date`, `status`) VALUES
(1, 1, NULL, 250000.00, '2026-01-01', NULL, 'ACTIVE'),
(2, 2, NULL, 350000.00, '2026-01-01', NULL, 'ACTIVE'),
(3, 3, NULL, 520000.00, '2026-01-01', NULL, 'ACTIVE'),
(4, 4, NULL, 390000.00, '2026-01-01', NULL, 'ACTIVE'),
(5, 5, NULL, 420000.00, '2026-01-01', NULL, 'ACTIVE'),
(6, 6, NULL, 350000.00, '2026-01-01', NULL, 'ACTIVE'),
(7, 7, NULL, 850000.00, '2026-01-01', NULL, 'ACTIVE'),
(8, 8, NULL, 1150000.00, '2026-01-01', NULL, 'ACTIVE'),
(9, 9, NULL, 450000.00, '2026-01-01', NULL, 'ACTIVE'),
(10, 10, NULL, 450000.00, '2026-01-01', NULL, 'ACTIVE'),
(11, 11, NULL, 1790000.00, '2026-01-01', NULL, 'ACTIVE'),
(12, 12, NULL, 550000.00, '2026-01-01', NULL, 'ACTIVE'),
(13, 13, NULL, 3200000.00, '2026-01-01', NULL, 'ACTIVE');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `protocol_details`
--

CREATE TABLE `protocol_details` (
  `protocol_detail_id` bigint NOT NULL,
  `protocol_id` bigint NOT NULL,
  `dose_number` int NOT NULL,
  `interval_days` int NOT NULL DEFAULT '0',
  `age_from_months` int DEFAULT NULL,
  `age_to_months` int DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `protocol_details`
--

INSERT INTO `protocol_details` (`protocol_detail_id`, `protocol_id`, `dose_number`, `interval_days`, `age_from_months`, `age_to_months`, `note`) VALUES
(1, 1, 1, 0, 0, 12, 'Tiêm trong da, liều cơ bản cho trẻ sơ sinh'),
(2, 2, 1, 0, 0, NULL, 'Liều đầu tiên – khởi tạo phác đồ'),
(3, 2, 2, 30, NULL, NULL, 'Mũi tiếp theo'),
(4, 2, 3, 150, NULL, NULL, 'Hoàn thành phác đồ cơ bản'),
(5, 3, 1, 0, 2, 3, 'Mũi cơ bản'),
(6, 3, 2, 60, NULL, NULL, 'Mũi tiếp theo'),
(7, 3, 3, 60, NULL, NULL, 'Mũi tiếp theo'),
(8, 3, 4, 180, NULL, NULL, 'Theo phác đồ'),
(9, 3, 5, 365, NULL, NULL, 'Mũi hoàn thiện / nhắc'),
(10, 4, 1, 0, 2, 3, 'Mũi cơ bản'),
(11, 4, 2, 60, NULL, NULL, 'Mũi tiếp theo'),
(12, 4, 3, 60, NULL, NULL, 'Mũi tiếp theo'),
(13, 4, 4, 180, NULL, NULL, 'Mũi hoàn thiện'),
(14, 5, 1, 0, 2, 6, 'Mũi cơ bản'),
(15, 5, 2, 60, NULL, NULL, 'Mũi tiếp theo'),
(16, 5, 3, 60, NULL, NULL, 'Hoàn thành hoặc mũi nhắc'),
(17, 6, 1, 0, 12, 15, 'Mũi cơ bản'),
(18, 6, 2, 28, NULL, NULL, 'Hoàn thành phác đồ'),
(19, 7, 1, 0, 12, NULL, 'Mũi đầu tiên'),
(20, 7, 2, 28, NULL, NULL, 'Hoàn thành phác đồ'),
(21, 8, 1, 0, 2, NULL, 'Mũi đầu'),
(22, 8, 2, 60, NULL, NULL, 'Mũi tiếp theo nếu cần'),
(23, 9, 1, 0, 12, NULL, 'Mũi cơ bản'),
(24, 9, 2, 28, NULL, NULL, 'Mũi tiếp theo'),
(25, 9, 3, 365, NULL, NULL, 'Mũi nhắc / hoàn thiện'),
(26, 10, 1, 0, 6, NULL, 'Tiêm theo vaccine mùa hiện tại'),
(27, 11, 1, 0, 108, 168, 'Khởi tạo phác đồ (9-14 tuổi)'),
(28, 11, 2, 180, NULL, NULL, 'Hoàn thành phác đồ 2 liều'),
(29, 12, 1, 0, 168, NULL, 'Khởi tạo phác đồ'),
(30, 12, 2, 60, NULL, NULL, 'Mũi tiếp theo'),
(31, 12, 3, 120, NULL, NULL, 'Hoàn thành phác đồ 3 liều'),
(32, 13, 1, 0, NULL, NULL, 'Liều cơ bản theo lịch hiện hành'),
(33, 13, 2, 180, NULL, NULL, 'Mũi tiếp theo / cập nhật'),
(34, 14, 1, 0, 600, NULL, 'Mũi đầu tiên (≥50 tuổi)'),
(35, 14, 2, 60, NULL, NULL, 'Hoàn thành phác đồ (cách 2–6 tháng)');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schedule_overload_predictions`
--

CREATE TABLE `schedule_overload_predictions` (
  `prediction_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  `prediction_date` date NOT NULL,
  `time_slot` time NOT NULL,
  `predicted_bookings` int DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `overload_probability` decimal(5,4) DEFAULT NULL,
  `estimated_wait_minutes` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_configs`
--

CREATE TABLE `system_configs` (
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `system_configs`
--

INSERT INTO `system_configs` (`config_key`, `config_value`, `description`, `updated_at`) VALUES
('booking_advance_days', '30', 'Số ngày được phép đặt lịch trước', '2026-08-12 12:33:22'),
('default_currency', 'VND', 'Đơn vị tiền tệ', '2026-08-12 12:33:22'),
('qr_code_prefix', 'VXC', 'Tiền tố mã QR', '2026-08-12 12:33:22'),
('site_name', 'VaxCare', 'Tên hệ thống', '2026-08-12 12:33:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` bigint NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `address` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `date_of_birth`, `gender`, `address`) VALUES
(1, 'Nguyễn An', '1998-05-15', 'MALE', 'Quận Phú Nhuận, TP.HCM');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccination_details`
--

CREATE TABLE `vaccination_details` (
  `detail_id` bigint NOT NULL,
  `history_id` bigint NOT NULL,
  `appointment_id` bigint DEFAULT NULL,
  `vaccine_id` bigint NOT NULL,
  `batch_id` bigint DEFAULT NULL,
  `staff_id` bigint DEFAULT NULL,
  `dose_number` int NOT NULL,
  `injection_date` date NOT NULL,
  `result` enum('SUCCESS','FAILED','PARTIAL') DEFAULT 'SUCCESS',
  `note` text,
  `certificate_code` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccination_facilities`
--

CREATE TABLE `vaccination_facilities` (
  `facility_id` bigint NOT NULL,
  `facility_name` varchar(200) NOT NULL,
  `address` text,
  `phone` varchar(20) DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `capacity_per_slot` int DEFAULT '10',
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccination_facilities`
--

INSERT INTO `vaccination_facilities` (`facility_id`, `facility_name`, `address`, `phone`, `opening_time`, `closing_time`, `capacity_per_slot`, `image_url`, `status`, `created_at`) VALUES
(1, 'VaxCare Phú Nhuận', '198 Hoàng Văn Thụ, P.Đức Nhuận, TP.HCM', '028-3845-1122', '07:30:00', '17:00:00', 15, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(2, 'VaxCare Thủ Đức - Bình Chiểu', '2A Đường Bình Chiểu, P.Tam Bình, TP.HCM', '028-3722-8899', '08:00:00', '17:30:00', 12, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(3, 'VaxCare Nowzone', 'Tầng 2, TTTM NOWZONE, 235 Nguyễn Văn Cừ, P.Cầu Ông Lãnh, TP.HCM', '028-3838-5678', '08:00:00', '20:00:00', 18, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(4, 'VaxCare Củ Chi - Bình Mỹ', '1239 Tỉnh Lộ 8, ấp Thạnh An 2, X.Bình Mỹ, TP.HCM', '028-3892-3344', '07:30:00', '16:30:00', 10, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(5, 'VaxCare Trung Mỹ Tây', 'Số 8 Nguyễn Thị Trên, P. Trung Mỹ Tây, TP.HCM', '028-3715-7788', '07:30:00', '17:00:00', 12, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(6, 'VaxCare Co.opmart Quang Trung', 'Lầu 2, TTTM Co.opmart Quang Trung, 304A Quang Trung, P.Thông Tây Hội, TP.HCM', '028-3894-5566', '08:00:00', '20:00:00', 15, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(7, 'VaxCare Oriental Plaza', 'Tầng 1, Toà nhà Oriental Plaza, 685 Âu Cơ, P.Tân Phú, TP.HCM', '028-3962-1122', '08:00:00', '19:00:00', 14, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(8, 'VaxCare Hóc Môn - Đông Thạnh', '338 Tô Ký, X.Đông Thạnh, TP.HCM', '028-3718-9900', '07:30:00', '16:30:00', 10, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(9, 'VaxCare Hiệp Bình', 'Số 566 Quốc Lộ 13, khu phố 6, P.Hiệp Bình, TP.HCM', '028-3721-4455', '07:30:00', '17:00:00', 12, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(10, 'VaxCare Tân Định', '290 Hai Bà Trưng, P.Tân Định, TP.HCM', '028-3820-7788', '07:30:00', '17:30:00', 15, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(11, 'VaxCare An Lạc', '539A-539B Kinh Dương Vương, khu phố 58, P.An Lạc, TP.HCM', '028-3875-2233', '08:00:00', '17:00:00', 12, NULL, 'ACTIVE', '2026-08-12 12:33:22'),
(12, 'VaxCare Phú Thuận', '1189 Huỳnh Tấn Phát, P.Phú Thuận, TP.HCM', '028-3873-6677', '07:30:00', '17:00:00', 11, NULL, 'ACTIVE', '2026-08-12 12:33:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccination_histories`
--

CREATE TABLE `vaccination_histories` (
  `history_id` bigint NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccination_histories`
--

INSERT INTO `vaccination_histories` (`history_id`, `user_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccination_protocols`
--

CREATE TABLE `vaccination_protocols` (
  `protocol_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `protocol_name` varchar(200) NOT NULL,
  `total_doses` int NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccination_protocols`
--

INSERT INTO `vaccination_protocols` (`protocol_id`, `vaccine_id`, `protocol_name`, `total_doses`, `description`) VALUES
(1, 1, 'Phác đồ BCG chuẩn', 1, '1 liều duy nhất cho trẻ sơ sinh'),
(2, 2, 'Phác đồ Viêm gan B 3 liều', 3, 'Phác đồ cơ bản 3 liều'),
(3, 3, 'Phác đồ DTaP trẻ em', 5, 'Phác đồ đầy đủ cho trẻ em'),
(4, 4, 'Phác đồ IPV chuẩn', 4, '4 liều IPV theo lịch tiêm chủng'),
(5, 5, 'Phác đồ Hib chuẩn', 3, '3 liều cơ bản'),
(6, 6, 'Phác đồ MMR 2 liều', 2, '2 liều cách nhau tối thiểu 28 ngày'),
(7, 7, 'Phác đồ Thủy đậu 2 liều', 2, '2 liều theo khoảng cách tối thiểu'),
(8, 8, 'Phác đồ Phế cầu cơ bản', 2, 'Phác đồ tùy tuổi và loại vaccine'),
(9, 9, 'Phác đồ Viêm não Nhật Bản', 3, '3 liều theo lịch'),
(10, 10, 'Phác đồ Cúm mùa hàng năm', 1, '1 liều mỗi mùa cúm'),
(11, 11, 'Phác đồ HPV 2 liều', 2, 'Phác đồ 2 liều cho nhóm 9-14 tuổi'),
(12, 11, 'Phác đồ HPV 3 liều', 3, 'Phác đồ 3 liều cho nhóm tuổi lớn hơn'),
(13, 12, 'Phác đồ COVID-19 cơ bản', 2, '2 liều cơ bản + mũi cập nhật nếu cần'),
(14, 13, 'Phác đồ Shingrix 2 liều', 2, '2 liều cách nhau 2–6 tháng');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccines`
--

CREATE TABLE `vaccines` (
  `vaccine_id` bigint NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `vaccine_name` varchar(200) NOT NULL,
  `manufacturer` varchar(150) DEFAULT NULL,
  `target_disease` varchar(200) DEFAULT NULL,
  `required_doses` int DEFAULT '1',
  `dose_interval_days` int DEFAULT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  `average_rating` decimal(2,1) DEFAULT '0.0',
  `total_bookings` int DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccines`
--

INSERT INTO `vaccines` (`vaccine_id`, `category_id`, `vaccine_name`, `manufacturer`, `target_disease`, `required_doses`, `dose_interval_days`, `description`, `image_url`, `average_rating`, `total_bookings`, `status`) VALUES
(1, 1, 'Vắc xin BCG (Bacille Calmette–Guérin)', 'BCG Vaccine / tùy sản phẩm tại cơ sở', 'Bệnh lao', 1, NULL, 'Vắc xin BCG được sử dụng để tạo miễn dịch chống lại vi khuẩn gây bệnh lao. Vaccine đặc biệt có ý nghĩa trong việc giảm nguy cơ mắc các thể lao nặng ở trẻ nhỏ.', 'https://cdn.nhathuoclongchau.com.vn/v1/static/vac_xin_bcg_cua_nuoc_nao_doi_tuong_chi_dinh_va_chong_chi_dinh_tiem_chung_bcg_3a9393f6e7.jpg', 4.9, 860, 'ACTIVE'),
(2, 1, 'Vắc xin Viêm gan B (Hepatitis B)', 'GSK / MSD / tùy sản phẩm', 'Viêm gan B', 3, 30, 'Vắc xin viêm gan B giúp cơ thể hình thành miễn dịch chống lại virus viêm gan B. Nhiễm virus có thể dẫn đến viêm gan mạn tính, xơ gan hoặc ung thư gan.', 'https://cdn.nhathuoclongchau.com.vn/v1/static/vac_xin_heberbiovac_1ml_cuba_d84523e571.jpg', 4.8, 1420, 'ACTIVE'),
(3, 2, 'Vắc xin Bạch hầu – Ho gà – Uốn ván (DTaP/Tdap)', 'GSK / Sanofi / tùy vaccine', 'Bạch hầu, ho gà, uốn ván', 5, 60, 'Vắc xin phối hợp giúp phòng ngừa ba bệnh truyền nhiễm gồm bạch hầu, ho gà và uốn ván.', 'https://cdn.nhathuoclongchau.com.vn/v1/static/tdap_vaccine_la_gi_va_tam_quan_trong_voi_tre_so_sinh_3_7762b399fb.jpg', 4.9, 1180, 'ACTIVE'),
(4, 1, 'Vắc xin Bại liệt (IPV)', 'Sanofi / tùy sản phẩm', 'Bệnh bại liệt', 4, 60, 'Vắc xin IPV giúp tạo miễn dịch chống lại poliovirus, virus gây bệnh bại liệt.', 'https://pharmog.com/wp/wp-content/uploads/2019/01/Polio-vaccine.png', 4.8, 930, 'ACTIVE'),
(5, 1, 'Vắc xin Hib (Haemophilus influenzae type b)', 'GSK / tùy sản phẩm', 'Các bệnh xâm lấn do Hib', 3, 60, 'Vắc xin Hib giúp phòng ngừa các bệnh nghiêm trọng do vi khuẩn Haemophilus influenzae type b.', 'https://davac.com.vn/wp-content/uploads/2024/11/13f4dd9b-49ca-4325-a833-db95f57ad7c5.jpeg', 4.9, 760, 'ACTIVE'),
(6, 2, 'Vắc xin MMR (Sởi – Quai bị – Rubella)', 'GSK / MSD / tùy sản phẩm', 'Sởi, quai bị, rubella', 2, 28, 'MMR là vaccine phối hợp giúp phòng ngừa ba bệnh: sởi, quai bị và rubella.', 'https://vnvc.vn/wp-content/uploads/2022/06/MMR.jpg', 4.9, 1050, 'ACTIVE'),
(7, 2, 'Vắc xin Thủy đậu (Varicella)', 'MSD / tùy sản phẩm', 'Thủy đậu', 2, 28, 'Vắc xin thủy đậu giúp phòng bệnh thủy đậu do virus Varicella-zoster gây ra.', 'https://cdccantho.vn/uploads/news/2022_06/vac-xin-phong-thuy-dau-varicella-gcc.jpg', 4.8, 980, 'ACTIVE'),
(8, 3, 'Vắc xin Phế cầu (Pneumococcal)', 'Pfizer / MSD / tùy sản phẩm', 'Bệnh do phế cầu', 2, 60, 'Vắc xin phế cầu giúp bảo vệ chống lại các bệnh do Streptococcus pneumoniae.', 'https://bacsigiadinhhanoi.vn/wp-content/uploads/2021/10/image-102.png', 4.9, 1360, 'ACTIVE'),
(9, 2, 'Vắc xin Viêm não Nhật Bản', 'Sanofi / tùy sản phẩm', 'Viêm não Nhật Bản', 3, 28, 'Vắc xin viêm não Nhật Bản giúp phòng ngừa bệnh viêm não Nhật Bản do virus gây ra.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwDZoRKVb88YzWvyTRgO6puS8kXDcEkyIrfnkMSHXNh-SbrFgGEuPTNWWt&s=10', 4.8, 720, 'ACTIVE'),
(10, 5, 'Vắc xin Cúm mùa (Influenza)', 'Sanofi / GSK / tùy sản phẩm', 'Cúm mùa', 1, 365, 'Vắc xin cúm mùa giúp giảm nguy cơ mắc cúm và các biến chứng liên quan. Đây là vaccine quan trọng cho phần AI dự báo nhu cầu.', 'https://bizweb.dktcdn.net/thumb/1024x1024/100/524/140/products/influvac-percentage-20tetra-f5c693c5-38e5-4e84-82cd-e8ae2d5fbfbf.jpg?v=1726452738863', 4.9, 2180, 'ACTIVE'),
(11, 2, 'Vắc xin HPV (Human Papillomavirus)', 'MSD – Hoa Kỳ', 'Ung thư cổ tử cung, sùi mào gà và các bệnh liên quan HPV', 2, 180, 'Vắc xin HPV giúp phòng ngừa nhiễm các type HPV nguy cơ cao và một số bệnh ung thư liên quan HPV.', 'https://benhvienthucuc.vn/wp-content/uploads/2023/01/vac-xin-hpv-co-may-loai-thong-tin-chi-tiet-ve-doi-tuong-va-lich-tiem.jpg', 4.9, 1240, 'ACTIVE'),
(12, 3, 'Vắc xin COVID-19', 'Theo vaccine được cơ sở triển khai', 'COVID-19 (SARS-CoV-2)', 2, 180, 'Vắc xin COVID-19 giúp giảm nguy cơ mắc bệnh nặng và các biến chứng liên quan đến COVID-19.', 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2022/1/23/vaccine-ngua-covid-19-ky-tich-tao-nen-lich-su-1642929583876933197764.jpg', 4.7, 1890, 'ACTIVE'),
(13, 4, 'Vắc xin Zona (Shingrix)', 'GSK', 'Zona (Herpes Zoster)', 2, 60, 'Vắc xin Zona giúp giảm nguy cơ mắc bệnh zona và biến chứng đau thần kinh sau zona. Dành cho người từ 50 tuổi trở lên.', 'https://cdn.nhathuoclongchau.com.vn/v1/static/vac_xin_shingrix_bi_phong_ngua_benh_zona_than_kinh_0_5d9be89ac1.png', 4.9, 640, 'ACTIVE');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccine_batches`
--

CREATE TABLE `vaccine_batches` (
  `batch_id` bigint NOT NULL,
  `inventory_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `batch_number` varchar(100) NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `imported_quantity` int NOT NULL,
  `stock_quantity` int NOT NULL,
  `import_price` decimal(12,2) DEFAULT NULL,
  `import_date` date DEFAULT NULL,
  `status` enum('AVAILABLE','EXPIRED','DEPLETED') DEFAULT 'AVAILABLE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccine_batches`
--

INSERT INTO `vaccine_batches` (`batch_id`, `inventory_id`, `vaccine_id`, `batch_number`, `manufacture_date`, `expiry_date`, `imported_quantity`, `stock_quantity`, `import_price`, `import_date`, `status`) VALUES
(1, 1, 1, 'BCG-2026-001', '2025-11-01', '2027-11-01', 400, 280, 180000.00, '2026-01-15', 'AVAILABLE'),
(2, 3, 1, 'BCG-2026-002', '2025-12-01', '2027-12-01', 350, 210, 180000.00, '2026-02-10', 'AVAILABLE'),
(3, 1, 2, 'HBV-2026-A1', '2025-10-15', '2027-10-15', 600, 420, 280000.00, '2026-01-20', 'AVAILABLE'),
(4, 5, 2, 'HBV-2026-A2', '2025-11-20', '2027-11-20', 500, 310, 280000.00, '2026-02-05', 'AVAILABLE'),
(5, 10, 2, 'HBV-2026-A3', '2025-12-10', '2027-12-10', 450, 290, 280000.00, '2026-02-18', 'AVAILABLE'),
(6, 1, 3, 'DTAP-2026-01', '2025-09-01', '2027-09-01', 380, 240, 420000.00, '2026-01-10', 'AVAILABLE'),
(7, 6, 3, 'DTAP-2026-02', '2025-10-01', '2027-10-01', 320, 190, 420000.00, '2026-02-01', 'AVAILABLE'),
(8, 2, 4, 'IPV-2026-X1', '2025-08-15', '2027-08-15', 400, 260, 310000.00, '2026-01-25', 'AVAILABLE'),
(9, 9, 4, 'IPV-2026-X2', '2025-09-20', '2027-09-20', 350, 210, 310000.00, '2026-02-12', 'AVAILABLE'),
(10, 1, 5, 'HIB-2026-01', '2025-09-20', '2027-09-20', 360, 230, 340000.00, '2026-01-18', 'AVAILABLE'),
(11, 7, 5, 'HIB-2026-02', '2025-10-15', '2027-10-15', 300, 180, 340000.00, '2026-02-08', 'AVAILABLE'),
(12, 1, 6, 'MMR-2026-01', '2025-10-10', '2027-10-10', 450, 320, 280000.00, '2026-01-22', 'AVAILABLE'),
(13, 3, 6, 'MMR-2026-02', '2025-11-05', '2027-11-05', 400, 270, 280000.00, '2026-02-08', 'AVAILABLE'),
(14, 10, 6, 'MMR-2026-03', '2025-12-01', '2027-12-01', 380, 250, 280000.00, '2026-02-20', 'AVAILABLE'),
(15, 2, 7, 'VAR-2026-01', '2025-09-15', '2027-09-15', 280, 160, 720000.00, '2026-01-12', 'AVAILABLE'),
(16, 6, 7, 'VAR-2026-02', '2025-10-20', '2027-10-20', 250, 145, 720000.00, '2026-02-05', 'AVAILABLE'),
(17, 1, 8, 'PCV-2026-01', '2025-08-01', '2027-08-01', 220, 130, 980000.00, '2026-01-05', 'AVAILABLE'),
(18, 5, 8, 'PCV-2026-02', '2025-09-10', '2027-09-10', 200, 110, 980000.00, '2026-02-15', 'AVAILABLE'),
(19, 10, 8, 'PCV-2026-03', '2025-10-05', '2027-10-05', 180, 95, 980000.00, '2026-02-25', 'AVAILABLE'),
(20, 4, 9, 'JE-2026-01', '2025-10-01', '2027-10-01', 260, 150, 360000.00, '2026-01-28', 'AVAILABLE'),
(21, 8, 9, 'JE-2026-02', '2025-11-10', '2027-11-10', 220, 130, 360000.00, '2026-02-14', 'AVAILABLE'),
(22, 1, 10, 'FLU-2026-A', '2026-03-01', '2026-12-31', 800, 580, 380000.00, '2026-04-01', 'AVAILABLE'),
(23, 3, 10, 'FLU-2026-B', '2026-03-01', '2026-12-31', 750, 520, 380000.00, '2026-04-05', 'AVAILABLE'),
(24, 6, 10, 'FLU-2026-C', '2026-03-01', '2026-12-31', 700, 490, 380000.00, '2026-04-08', 'AVAILABLE'),
(25, 10, 10, 'FLU-2026-D', '2026-03-01', '2026-12-31', 650, 460, 380000.00, '2026-04-12', 'AVAILABLE'),
(26, 1, 11, 'HPV-2026-G9A', '2025-07-01', '2027-07-01', 350, 210, 1550000.00, '2026-01-08', 'AVAILABLE'),
(27, 3, 11, 'HPV-2026-G9B', '2025-08-15', '2027-08-15', 320, 190, 1550000.00, '2026-02-12', 'AVAILABLE'),
(28, 7, 11, 'HPV-2026-G9C', '2025-09-01', '2027-09-01', 300, 170, 1550000.00, '2026-02-20', 'AVAILABLE'),
(29, 10, 11, 'HPV-2026-G9D', '2025-09-20', '2027-09-20', 280, 155, 1550000.00, '2026-03-01', 'AVAILABLE'),
(30, 1, 12, 'COV-2026-01', '2025-11-01', '2026-11-01', 500, 340, 450000.00, '2026-01-15', 'AVAILABLE'),
(31, 5, 12, 'COV-2026-02', '2025-12-01', '2026-12-01', 450, 290, 450000.00, '2026-02-01', 'AVAILABLE'),
(32, 10, 12, 'COV-2026-03', '2026-01-10', '2027-01-10', 400, 260, 450000.00, '2026-02-15', 'AVAILABLE'),
(33, 1, 13, 'SHX-2026-01', '2025-06-01', '2027-06-01', 140, 85, 2800000.00, '2026-01-20', 'AVAILABLE'),
(34, 7, 13, 'SHX-2026-02', '2025-07-15', '2027-07-15', 120, 70, 2800000.00, '2026-02-10', 'AVAILABLE'),
(35, 10, 13, 'SHX-2026-03', '2025-08-20', '2027-08-20', 100, 55, 2800000.00, '2026-02-25', 'AVAILABLE');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccine_categories`
--

CREATE TABLE `vaccine_categories` (
  `category_id` bigint NOT NULL,
  `category_name` varchar(150) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccine_categories`
--

INSERT INTO `vaccine_categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Trẻ sơ sinh & Trẻ nhỏ', 'Vắc xin tiêm trong giai đoạn sơ sinh và trẻ dưới 5 tuổi'),
(2, 'Trẻ em & Thanh thiếu niên', 'Vắc xin dành cho trẻ em và thanh thiếu niên'),
(3, 'Người trưởng thành', 'Vắc xin cho người lớn và nhóm nguy cơ'),
(4, 'Người cao tuổi', 'Vắc xin khuyến nghị cho người từ 50 tuổi trở lên'),
(5, 'Mùa vụ & Định kỳ', 'Vắc xin tiêm theo mùa hoặc định kỳ hàng năm'),
(6, 'Phối hợp & Đặc biệt', 'Vắc xin phối hợp hoặc nhóm đặc biệt');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vaccine_inventories`
--

CREATE TABLE `vaccine_inventories` (
  `inventory_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  `alert_threshold` int DEFAULT '50'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `vaccine_inventories`
--

INSERT INTO `vaccine_inventories` (`inventory_id`, `facility_id`, `alert_threshold`) VALUES
(1, 1, 50),
(2, 2, 40),
(3, 3, 60),
(4, 4, 30),
(5, 5, 40),
(6, 6, 50),
(7, 7, 45),
(8, 8, 30),
(9, 9, 40),
(10, 10, 50),
(11, 11, 40),
(12, 12, 35);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `waitlists`
--

CREATE TABLE `waitlists` (
  `waitlist_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  `vaccine_id` bigint NOT NULL,
  `preferred_date` date NOT NULL,
  `preferred_time_slot` time DEFAULT NULL,
  `priority_score` decimal(5,2) DEFAULT '0.00',
  `status` enum('WAITING','ALLOCATED','CANCELLED','EXPIRED') DEFAULT 'WAITING',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE accounts
  ADD COLUMN verification_token VARCHAR(64) NULL,
  ADD COLUMN verification_token_expires_at DATETIME NULL;

CREATE INDEX idx_accounts_verification_token ON accounts (verification_token);
--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`);

--
-- Chỉ mục cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `prediction_id` (`prediction_id`),
  ADD KEY `idx_appointments_user_status_date` (`user_id`,`status`,`appointment_date` DESC),
  ADD KEY `idx_appointments_facility_date_slot` (`facility_id`,`appointment_date`,`time_slot`),
  ADD KEY `idx_appointments_qr` (`qr_code`),
  ADD KEY `idx_appointments_vaccine` (`vaccine_id`,`status`),
  ADD KEY `idx_appointments_cancelled` (`status`,`cancelled_at`);

--
-- Chỉ mục cho bảng `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Chỉ mục cho bảng `demand_forecasts`
--
ALTER TABLE `demand_forecasts`
  ADD PRIMARY KEY (`forecast_id`),
  ADD KEY `vaccine_id` (`vaccine_id`),
  ADD KEY `idx_forecasts_period` (`facility_id`,`vaccine_id`,`forecast_period_start`);

--
-- Chỉ mục cho bảng `health_profiles`
--
ALTER TABLE `health_profiles`
  ADD PRIMARY KEY (`profile_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `medical_staff`
--
ALTER TABLE `medical_staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `staff_code` (`staff_code`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notifications_account_unread` (`account_id`,`is_read`,`sent_at` DESC);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_payments_appointment` (`appointment_id`),
  ADD KEY `idx_payments_status_time` (`status`,`payment_time` DESC);

--
-- Chỉ mục cho bảng `post_vaccination_reactions`
--
ALTER TABLE `post_vaccination_reactions`
  ADD PRIMARY KEY (`reaction_id`),
  ADD KEY `detail_id` (`detail_id`),
  ADD KEY `idx_reactions_status` (`processing_status`,`recorded_time` DESC);

--
-- Chỉ mục cho bảng `price_lists`
--
ALTER TABLE `price_lists`
  ADD PRIMARY KEY (`price_list_id`),
  ADD KEY `idx_price_lists_vaccine_active` (`vaccine_id`,`status`,`effective_date` DESC),
  ADD KEY `idx_price_lists_facility` (`facility_id`,`vaccine_id`,`status`);

--
-- Chỉ mục cho bảng `protocol_details`
--
ALTER TABLE `protocol_details`
  ADD PRIMARY KEY (`protocol_detail_id`),
  ADD KEY `idx_protocol_details_protocol` (`protocol_id`,`dose_number`);

--
-- Chỉ mục cho bảng `schedule_overload_predictions`
--
ALTER TABLE `schedule_overload_predictions`
  ADD PRIMARY KEY (`prediction_id`),
  ADD KEY `idx_predictions_facility_date_slot` (`facility_id`,`prediction_date`,`time_slot`);

--
-- Chỉ mục cho bảng `system_configs`
--
ALTER TABLE `system_configs`
  ADD PRIMARY KEY (`config_key`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- Chỉ mục cho bảng `vaccination_details`
--
ALTER TABLE `vaccination_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD UNIQUE KEY `certificate_code` (`certificate_code`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `vaccine_id` (`vaccine_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `idx_vaccination_details_history_date` (`history_id`,`injection_date` DESC);

--
-- Chỉ mục cho bảng `vaccination_facilities`
--
ALTER TABLE `vaccination_facilities`
  ADD PRIMARY KEY (`facility_id`);

--
-- Chỉ mục cho bảng `vaccination_histories`
--
ALTER TABLE `vaccination_histories`
  ADD PRIMARY KEY (`history_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `vaccination_protocols`
--
ALTER TABLE `vaccination_protocols`
  ADD PRIMARY KEY (`protocol_id`),
  ADD KEY `vaccine_id` (`vaccine_id`);

--
-- Chỉ mục cho bảng `vaccines`
--
ALTER TABLE `vaccines`
  ADD PRIMARY KEY (`vaccine_id`),
  ADD KEY `idx_vaccines_category_status` (`category_id`,`status`),
  ADD KEY `idx_vaccines_name` (`vaccine_name`);

--
-- Chỉ mục cho bảng `vaccine_batches`
--
ALTER TABLE `vaccine_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `idx_batches_inventory_vaccine_stock` (`inventory_id`,`vaccine_id`,`status`,`stock_quantity`),
  ADD KEY `idx_batches_expiry` (`expiry_date`,`status`),
  ADD KEY `idx_batches_vaccine_status` (`vaccine_id`,`status`);

--
-- Chỉ mục cho bảng `vaccine_categories`
--
ALTER TABLE `vaccine_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Chỉ mục cho bảng `vaccine_inventories`
--
ALTER TABLE `vaccine_inventories`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `facility_id` (`facility_id`);

--
-- Chỉ mục cho bảng `waitlists`
--
ALTER TABLE `waitlists`
  ADD PRIMARY KEY (`waitlist_id`),
  ADD KEY `vaccine_id` (`vaccine_id`),
  ADD KEY `idx_waitlists_user_status` (`user_id`,`status`),
  ADD KEY `idx_waitlists_facility_date` (`facility_id`,`preferred_date`,`status`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `accounts`
--
ALTER TABLE `accounts`
  MODIFY `account_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `demand_forecasts`
--
ALTER TABLE `demand_forecasts`
  MODIFY `forecast_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `health_profiles`
--
ALTER TABLE `health_profiles`
  MODIFY `profile_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `post_vaccination_reactions`
--
ALTER TABLE `post_vaccination_reactions`
  MODIFY `reaction_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `price_lists`
--
ALTER TABLE `price_lists`
  MODIFY `price_list_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `protocol_details`
--
ALTER TABLE `protocol_details`
  MODIFY `protocol_detail_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `schedule_overload_predictions`
--
ALTER TABLE `schedule_overload_predictions`
  MODIFY `prediction_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `vaccination_details`
--
ALTER TABLE `vaccination_details`
  MODIFY `detail_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `vaccination_facilities`
--
ALTER TABLE `vaccination_facilities`
  MODIFY `facility_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `vaccination_histories`
--
ALTER TABLE `vaccination_histories`
  MODIFY `history_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `vaccination_protocols`
--
ALTER TABLE `vaccination_protocols`
  MODIFY `protocol_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `vaccines`
--
ALTER TABLE `vaccines`
  MODIFY `vaccine_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `vaccine_batches`
--
ALTER TABLE `vaccine_batches`
  MODIFY `batch_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `vaccine_categories`
--
ALTER TABLE `vaccine_categories`
  MODIFY `category_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `vaccine_inventories`
--
ALTER TABLE `vaccine_inventories`
  MODIFY `inventory_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `waitlists`
--
ALTER TABLE `waitlists`
  MODIFY `waitlist_id` bigint NOT NULL AUTO_INCREMENT;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`staff_id`) REFERENCES `medical_staff` (`staff_id`),
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`prediction_id`) REFERENCES `schedule_overload_predictions` (`prediction_id`);

--
-- Ràng buộc cho bảng `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`);

--
-- Ràng buộc cho bảng `demand_forecasts`
--
ALTER TABLE `demand_forecasts`
  ADD CONSTRAINT `demand_forecasts_ibfk_1` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`),
  ADD CONSTRAINT `demand_forecasts_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`);

--
-- Ràng buộc cho bảng `health_profiles`
--
ALTER TABLE `health_profiles`
  ADD CONSTRAINT `health_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `medical_staff`
--
ALTER TABLE `medical_staff`
  ADD CONSTRAINT `medical_staff_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_staff_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`);

--
-- Ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`);

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`);

--
-- Ràng buộc cho bảng `post_vaccination_reactions`
--
ALTER TABLE `post_vaccination_reactions`
  ADD CONSTRAINT `post_vaccination_reactions_ibfk_1` FOREIGN KEY (`detail_id`) REFERENCES `vaccination_details` (`detail_id`);

--
-- Ràng buộc cho bảng `price_lists`
--
ALTER TABLE `price_lists`
  ADD CONSTRAINT `price_lists_ibfk_1` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`),
  ADD CONSTRAINT `price_lists_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`);

--
-- Ràng buộc cho bảng `protocol_details`
--
ALTER TABLE `protocol_details`
  ADD CONSTRAINT `protocol_details_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `vaccination_protocols` (`protocol_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `schedule_overload_predictions`
--
ALTER TABLE `schedule_overload_predictions`
  ADD CONSTRAINT `schedule_overload_predictions_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`);

--
-- Ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `vaccination_details`
--
ALTER TABLE `vaccination_details`
  ADD CONSTRAINT `vaccination_details_ibfk_1` FOREIGN KEY (`history_id`) REFERENCES `vaccination_histories` (`history_id`),
  ADD CONSTRAINT `vaccination_details_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  ADD CONSTRAINT `vaccination_details_ibfk_3` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`),
  ADD CONSTRAINT `vaccination_details_ibfk_4` FOREIGN KEY (`batch_id`) REFERENCES `vaccine_batches` (`batch_id`),
  ADD CONSTRAINT `vaccination_details_ibfk_5` FOREIGN KEY (`staff_id`) REFERENCES `medical_staff` (`staff_id`);

--
-- Ràng buộc cho bảng `vaccination_histories`
--
ALTER TABLE `vaccination_histories`
  ADD CONSTRAINT `vaccination_histories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `vaccination_protocols`
--
ALTER TABLE `vaccination_protocols`
  ADD CONSTRAINT `vaccination_protocols_ibfk_1` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`);

--
-- Ràng buộc cho bảng `vaccines`
--
ALTER TABLE `vaccines`
  ADD CONSTRAINT `vaccines_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `vaccine_categories` (`category_id`);

--
-- Ràng buộc cho bảng `vaccine_batches`
--
ALTER TABLE `vaccine_batches`
  ADD CONSTRAINT `vaccine_batches_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `vaccine_inventories` (`inventory_id`),
  ADD CONSTRAINT `vaccine_batches_ibfk_2` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`);

--
-- Ràng buộc cho bảng `vaccine_inventories`
--
ALTER TABLE `vaccine_inventories`
  ADD CONSTRAINT `vaccine_inventories_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `waitlists`
--
ALTER TABLE `waitlists`
  ADD CONSTRAINT `waitlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `waitlists_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `vaccination_facilities` (`facility_id`),
  ADD CONSTRAINT `waitlists_ibfk_3` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines` (`vaccine_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
