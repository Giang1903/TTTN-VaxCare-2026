# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

## 1.1. Bối cảnh và lý do chọn đề tài

Hoạt động tiêm chủng liên quan đến nhiều công việc như tra cứu thông tin vắc xin, đăng ký lịch, tiếp nhận người đến tiêm, ghi nhận lịch sử tiêm và quản lý số lượng vắc xin tại cơ sở. Khi các công việc này được theo dõi trên nhiều kênh hoặc xử lý thủ công, người dân có thể gặp khó khăn khi tìm thông tin và theo dõi lịch hẹn; cơ sở tiêm chủng cũng khó tổng hợp dữ liệu phục vụ điều phối và quản lý tồn kho.

Sự phổ biến của ứng dụng web và các dịch vụ dữ liệu tạo điều kiện xây dựng một hệ thống tập trung để hỗ trợ các quy trình trên. Bên cạnh các chức năng quản lý thông thường, các kỹ thuật trí tuệ nhân tạo có thể được ứng dụng để phân tích dữ liệu lịch hẹn, hỗ trợ gợi ý khung giờ và ước lượng nhu cầu vắc xin. Chatbot cũng có thể hỗ trợ người dùng tra cứu thông tin trong phạm vi tài liệu được cung cấp.

Từ nhu cầu đó, đề tài **“Xây dựng nền tảng quản lý và điều phối hoạt động tiêm chủng VaxCare có ứng dụng trí tuệ nhân tạo”** được lựa chọn. Đề tài tập trung xây dựng một hệ thống web kết nối người dân, nhân viên y tế và quản trị viên trên cùng một nền tảng.

## 1.2. Mục tiêu đề tài

### 1.2.1. Mục tiêu tổng quát

Xây dựng một nền tảng hỗ trợ số hóa một số quy trình quản lý tiêm chủng, cung cấp giao diện phù hợp với từng nhóm người dùng và thử nghiệm ứng dụng AI trong điều phối lịch, dự báo nhu cầu vắc xin và hỗ trợ tra cứu.

### 1.2.2. Mục tiêu cụ thể

- Xây dựng website cho người dân tra cứu vắc xin, cơ sở tiêm và thực hiện các thao tác liên quan đến lịch hẹn.
- Cung cấp các chức năng cho nhân viên y tế xử lý lịch hẹn, check-in, ghi nhận kết quả tiêm và quản lý kho tại cơ sở được phân công.
- Cung cấp chức năng quản trị tài khoản, cơ sở, danh mục vắc xin, giá, phác đồ và báo cáo.
- Xây dựng backend cung cấp REST API, xác thực người dùng và kiểm soát quyền truy cập theo vai trò.
- Xây dựng dịch vụ AI riêng để thử nghiệm gợi ý khung giờ, dự báo nhu cầu vắc xin và chatbot hỗ trợ thông tin.
- Tổ chức dữ liệu trong cơ sở dữ liệu quan hệ để hỗ trợ truy vấn và quản lý các nghiệp vụ của hệ thống.

## 1.3. Đối tượng và phạm vi nghiên cứu

### 1.3.1. Đối tượng sử dụng

Hệ thống hướng đến các nhóm người dùng sau:

| Đối tượng | Vai trò trong hệ thống |
|---|---|
| Người dân | Tra cứu thông tin, đặt lịch và theo dõi lịch sử tiêm của tài khoản. |
| Nhân viên y tế | Xử lý lịch hẹn, ghi nhận lượt tiêm và quản lý nghiệp vụ tại cơ sở được phân công. |
| Quản trị viên | Quản lý dữ liệu nền, tài khoản và hoạt động của hệ thống. |

### 1.3.2. Phạm vi chức năng

Đề tài tập trung vào các nhóm chức năng:

1. **Tài khoản và phân quyền:** đăng ký, đăng nhập, quản lý phiên và phân quyền theo vai trò.
2. **Danh mục và cơ sở:** tra cứu cơ sở, vắc xin, giá và phác đồ tiêm.
3. **Lịch hẹn:** tạo và theo dõi lịch hẹn, lựa chọn cơ sở/khung giờ, hỗ trợ thanh toán và check-in theo quy trình được cấu hình.
4. **Hồ sơ tiêm chủng:** lưu lịch sử tiêm và thông tin phản ứng sau tiêm.
5. **Quản lý vận hành:** quản lý lô vắc xin, tồn kho, thông báo và báo cáo.
6. **Ứng dụng AI:** gợi ý điều phối lịch, dự báo nhu cầu và chatbot tra cứu thông tin.

### 1.3.3. Giới hạn của đề tài

- Hệ thống là sản phẩm đồ án và môi trường thử nghiệm; việc đưa vào vận hành thực tế cần đánh giá thêm về quy trình y tế, bảo mật, khả năng mở rộng và yêu cầu pháp lý.
- Kết quả AI phụ thuộc dữ liệu, mô hình và cấu hình được cung cấp; kết quả dự báo/gợi ý chỉ có tính hỗ trợ, không thay thế quyết định chuyên môn.
- Chatbot không thực hiện chẩn đoán, kê đơn hoặc hướng dẫn xử trí cấp cứu.
- Tích hợp thanh toán, email và các dịch vụ ngoài hệ thống phụ thuộc thông tin cấu hình và môi trường triển khai; tài liệu này không khẳng định các tích hợp đã được nghiệm thu ở môi trường sản xuất.
- Đề tài không thay thế hồ sơ y tế chính thức hoặc các hệ thống quản lý chuyên môn của cơ sở y tế.

## 1.4. Phương pháp thực hiện

Đề tài được triển khai theo các bước chính:

1. **Khảo sát và xác định yêu cầu:** xác định các nhóm người dùng, nghiệp vụ cần hỗ trợ và giới hạn của hệ thống.
2. **Phân tích và thiết kế:** chia hệ thống thành frontend, backend, AI service và database; xác định luồng trao đổi dữ liệu qua API.
3. **Lựa chọn công nghệ:** sử dụng React/Vite cho giao diện, Spring Boot cho nghiệp vụ backend, FastAPI cho các dịch vụ AI và MySQL cho dữ liệu quan hệ.
4. **Phát triển theo phân hệ:** xây dựng chức năng theo vai trò và kết nối các dịch vụ thông qua REST API.
5. **Kiểm thử và đánh giá:** kiểm tra các chức năng, API, phân quyền và các thành phần AI bằng dữ liệu thử nghiệm.
6. **Hoàn thiện tài liệu:** mô tả kiến trúc, chức năng, cách triển khai và các giới hạn của sản phẩm.

## 1.5. Công nghệ và kiến trúc khái quát

VaxCare được tổ chức theo kiến trúc client–server, gồm các thành phần:

- **Frontend:** React 19, Vite và React Router; cung cấp giao diện cho các vai trò.
- **Backend:** Java 21, Spring Boot, Spring Data JPA và Spring Security; xử lý API, nghiệp vụ và quyền truy cập.
- **AI service:** Python và FastAPI; triển khai các API AI độc lập với backend.
- **Database:** MySQL; lưu dữ liệu người dùng và nghiệp vụ.

Frontend gửi yêu cầu đến backend qua HTTP/JSON. Backend truy cập database và gọi AI service khi cần. Việc tách AI service thành một thành phần riêng giúp các chức năng AI có thể được phát triển và triển khai độc lập với nghiệp vụ chính.

Thông tin chi tiết về từng thành phần được trình bày trong [README tổng quan](../README.md), [tài liệu Backend](../vaxcare-be/README.md), [tài liệu Frontend](../vaxcare-fe/README.md), [tài liệu AI service](../vaxcare-ai/README.md) và [tài liệu Database](../database/README.md).

## 1.6. Kết quả dự kiến

Sản phẩm của đề tài gồm:

- Một ứng dụng web có các khu vực chức năng dành cho người dân, nhân viên y tế và quản trị viên.
- Một backend cung cấp API và xử lý các nghiệp vụ chính của hệ thống.
- Một dịch vụ AI cung cấp API thử nghiệm cho điều phối lịch, dự báo nhu cầu và chatbot.
- Một schema MySQL cùng dữ liệu mẫu phục vụ phát triển và kiểm thử.
- Tài liệu hướng dẫn cấu hình, khởi chạy và kiểm tra các thành phần.

## 1.7. Bố cục báo cáo

Báo cáo có thể được tổ chức theo các chương sau:

- **Chương 1 – Tổng quan đề tài:** trình bày bối cảnh, mục tiêu, phạm vi và phương pháp thực hiện.
- **Chương 2 – Cơ sở lý thuyết và công nghệ:** giới thiệu các công nghệ, kiến thức và mô hình được sử dụng.
- **Chương 3 – Phân tích và thiết kế hệ thống:** mô tả yêu cầu, tác nhân, kiến trúc, dữ liệu và các luồng nghiệp vụ.
- **Chương 4 – Xây dựng và kiểm thử:** trình bày quá trình hiện thực các phân hệ và kết quả kiểm thử.
- **Chương 5 – Kết luận và hướng phát triển:** tổng kết kết quả, nêu giới hạn và đề xuất hướng mở rộng.

