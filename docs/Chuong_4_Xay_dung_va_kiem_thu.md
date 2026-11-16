# CHƯƠNG 4. XÂY DỰNG VÀ KIỂM THỬ HỆ THỐNG

## 4.1. Môi trường và công cụ phát triển

VaxCare được triển khai thành các thành phần độc lập. Các phiên bản và công nghệ khai báo trong dự án gồm:

| Thành phần | Công nghệ sử dụng |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, JavaScript và CSS |
| Backend | Java 21, Spring Boot 3.3.2, Spring Data JPA, Spring Security và Maven Wrapper |
| AI service | Python, FastAPI, Pydantic, scikit-learn, XGBoost và joblib |
| Database | MySQL 8 |
| Kiểm thử | JUnit/Mockito, pytest và ESLint; Vite dùng để build frontend |

Thông tin phụ thuộc chi tiết được quản lý trong `vaxcare-fe/package.json`, `vaxcare-be/pom.xml` và `vaxcare-ai/requirements.txt`.

## 4.2. Xây dựng các thành phần

### 4.2.1. Frontend

Frontend được tổ chức theo trang, component, layout, route và service:

- Các trang được chia theo khu vực công khai, người dân, nhân viên y tế và quản trị viên.
- `ProtectedRoute` hỗ trợ điều hướng theo trạng thái đăng nhập và vai trò.
- Các module trong `src/services/` tập trung gọi API cho tài khoản, lịch hẹn, vắc xin, kho, hồ sơ và các chức năng khác.
- Giao diện nhân viên hỗ trợ xử lý lịch hẹn, quét QR, ghi nhận tiêm và quản lý tồn kho.
- Giao diện quản trị cung cấp các trang quản lý tài khoản, cơ sở, vắc xin, giá, báo cáo và dự báo.

Frontend gọi backend qua URL được cấu hình bởi `VITE_API_URL`. Phân quyền dữ liệu vẫn do backend thực hiện; route guard ở giao diện không thay thế kiểm tra quyền phía server.

### 4.2.2. Backend

Backend được xây dựng theo các module nghiệp vụ trong `com.vaxcare.feature`. Các nhóm chức năng chính gồm:

- **Auth:** tài khoản, đăng nhập, hồ sơ và các luồng xác thực.
- **Facility và vaccine:** quản lý/tra cứu cơ sở, vắc xin, bảng giá và phác đồ.
- **Appointment và payment:** tra cứu khung giờ, đặt/đổi/hủy lịch, thanh toán và hoàn tiền.
- **Vaccination và reaction:** ghi nhận mũi tiêm, tra cứu lịch sử và theo dõi phản ứng.
- **Inventory:** nhập lô, tổng hợp tồn, cảnh báo và trừ tồn khi ghi nhận tiêm thành công.
- **Dashboard/report/notification:** báo cáo, thông báo và các sự kiện realtime.
- **AI/chatbot:** client gọi FastAPI và các API proxy liên quan.

Các controller tiếp nhận request, DTO/schema mô tả dữ liệu trao đổi và service xử lý quy tắc nghiệp vụ. Spring Data JPA kết nối các entity với MySQL; Spring Security áp dụng xác thực và phân quyền.

### 4.2.3. AI service

AI service dùng FastAPI để cung cấp các endpoint riêng:

- **AI1 – điều phối lịch:** tạo danh sách khung giờ, ước lượng thời gian chờ và xếp hạng/gợi ý theo dữ liệu đầu vào. Khi không có model, service có thể dùng heuristic.
- **AI2 – dự báo nhu cầu:** tạo đặc trưng từ lịch sử tiêu thụ, dự báo theo ngày rồi tổng hợp theo giai đoạn. Service có thể dùng heuristic nếu thiếu model hoặc lịch sử chưa đủ.
- **Chatbot:** kiểm tra an toàn, phân loại intent, xử lý theo rule/handler và sử dụng truy xuất tri thức hoặc LLM tùy cấu hình.

Model được nạp từ `vaxcare-ai/models/`; dữ liệu, tài liệu và các script huấn luyện/đánh giá được lưu trong `data/`, `knowledge/`, `notebooks/` và `eval/`.

### 4.2.4. Cơ sở dữ liệu

Schema được định nghĩa trong [`database/vaxcare_2026.sql`](../database/vaxcare_2026.sql). Các bảng được tổ chức quanh tài khoản, cơ sở, vắc xin, lịch hẹn, thanh toán, hồ sơ tiêm, kho, thông báo và chatbot.

Backend cấu hình Hibernate ở chế độ kiểm tra schema (`validate`), do đó cấu trúc database phải tương thích với entity khi khởi động. Dữ liệu mẫu trong SQL hỗ trợ chạy thử các màn hình và nghiệp vụ.

## 4.3. Các luồng triển khai tiêu biểu

### 4.3.1. Đặt lịch và thanh toán

Frontend yêu cầu danh sách khung giờ từ backend. Backend tính sức chứa dựa trên số lịch đã đặt và có thể bổ sung gợi ý AI. Khi người dân xác nhận lịch, backend kiểm tra các điều kiện nghiệp vụ trước khi lưu. Với lịch cần thanh toán, backend tạo giao dịch; callback chỉ được dùng để cập nhật kết quả sau khi backend kiểm tra thông tin xác thực của giao dịch.

### 4.3.2. Check-in và ghi nhận tiêm

Nhân viên gửi mã QR đến backend để xác định lịch hẹn. Sau khi xác minh quyền, cơ sở, trạng thái và điều kiện thanh toán, backend cập nhật lịch sang `CHECKED_IN`. Khi ghi nhận kết quả tiêm, backend kiểm tra lịch hợp lệ và chống ghi trùng; nếu kết quả là `SUCCESS`, hệ thống trừ tồn theo lô còn hạn, lưu chi tiết tiêm và hoàn tất lịch. Sơ đồ chi tiết có trong [Chương 3, mục 3.4.2](./Chuong_3_Phan_tich_va_thiet_ke_he_thong.md).

### 4.3.3. Quản lý kho

Nhân viên hoặc quản trị viên có thể nhập lô, xem tồn kho và tra cứu cảnh báo. Quyền của nhân viên được giới hạn theo cơ sở được phân công. Khi trừ kho, các lô còn hạn và còn số lượng được xét theo hạn dùng tăng dần (FEFO). Sơ đồ quy trình được trình bày tại [Chương 3, mục 3.4.3](./Chuong_3_Phan_tich_va_thiet_ke_he_thong.md).

## 4.4. Kiểm thử và đánh giá

### 4.4.1. Phương pháp kiểm thử

- **Unit test backend:** dùng JUnit và Mockito để kiểm tra các service hoặc lớp độc lập.
- **Spring context test:** khởi động ứng dụng để phát hiện lỗi cấu hình và tích hợp thành phần.
- **AI tests:** dùng pytest để kiểm tra API chatbot, rule eligibility, memory/intent và engine lịch.
- **Frontend checks:** ESLint kiểm tra quy tắc mã nguồn; Vite build kiểm tra khả năng đóng gói frontend.
- **AI evaluation scripts:** dự án có script đánh giá intent, retrieval và câu trả lời. Các script này cần chạy trên đúng testset/cấu hình khi cần báo cáo metric.

### 4.4.2. Danh sách test case

Các test case dưới đây được tổng hợp từ các test tự động hiện có. Cột kết quả ghi nhận phản ánh lần chạy gần nhất; `ĐẠT` nghĩa là test tự động đã qua, không đồng nghĩa toàn bộ luồng đã được nghiệm thu.

#### a. Test case AI service

| Mã | Nội dung kiểm thử | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| AI-01 | Nạp bảng quy tắc tuổi | Có đủ các cột bắt buộc và ít nhất 20 quy tắc | ĐẠT |
| AI-02 | Tra quy tắc cho trẻ sơ sinh | Có khuyến nghị BCG và viêm gan B | ĐẠT |
| AI-03 | Tra quy tắc cho trẻ 14 tháng | Có khuyến nghị thuộc nhóm MMR/sởi/thủy đậu | ĐẠT |
| AI-04 | Đọc dữ liệu người dùng mẫu | Có ít nhất 10 người dùng; mỗi bản ghi có mã, lịch sử và tuổi | ĐẠT |
| AI-05 | Kiểm tra người dùng mẫu thiếu mũi (ID 102) | Xác định được ít nhất một liều còn thiếu theo lịch | ĐẠT |
| AI-06 | Kiểm tra người dùng không có lịch sử (ID 109) | Lịch sử rỗng và vẫn xác định được quy tắc/liều cần xem xét | ĐẠT |
| AI-07 | Kiểm tra người trưởng thành có lịch sử HPV một phần (ID 105) | Trả về thông tin mũi đã tiêm và bước tiếp theo theo dữ liệu quy tắc | ĐẠT |
| AI-08 | Tạo lịch gợi ý cho trẻ sơ sinh | Có khuyến nghị phù hợp và phần tóm tắt | ĐẠT |
| AI-09 | Tạo lịch gợi ý cho người 20 tuổi | Trả đúng tuổi và định dạng được nội dung lịch | ĐẠT |
| AI-10 | Đối chiếu lịch sử HPV (ID 105) | Có dữ liệu mũi đã hoàn tất và bước tiếp theo; nội dung nhắc đến HPV | ĐẠT |
| AI-11 | Đối chiếu người dùng chưa có lịch sử tiêm | Báo chưa có lịch sử và xác định các mũi còn thiếu | ĐẠT |
| AI-12 | Hỏi tiêm khi đang sốt 38,5°C | Đề xuất hoãn và yêu cầu nhân viên y tế đánh giá | ĐẠT |
| AI-13 | Hỏi về lịch HPV khi không nêu triệu chứng bất thường | Cho phép trao đổi thông tin chung hoặc trả về mức thận trọng | ĐẠT |
| AI-14 | Ghi nhớ tuổi qua hai lượt hội thoại | Lượt hỏi sau vẫn nhận được ngữ cảnh trẻ 2 tuổi | ĐẠT |
| AI-15 | Phân loại các intent mẫu | Greeting, FAQ vắc xin, ngoài phạm vi và tra cứu lịch sử được nhận diện đúng | ĐẠT |
| AI-16 | Gọi `GET /health` | HTTP 200, trạng thái `UP` và có thông tin module | ĐẠT |
| AI-17 | Gửi lời chào đến API chatbot | HTTP 200, intent `chitchat` và có câu trả lời | ĐẠT |
| AI-18 | Gửi nội dung đau ngực, khó thở sau tiêm | Bật `safe_mode` và phân loại ngoài phạm vi | ĐẠT |
| AI-19 | Hỏi lịch vắc xin ở tuổi 20 qua API | Intent `schedule_advice` và có nội dung trả lời | ĐẠT |
| AI-20 | Hỏi tiêm khi sốt 39°C | Đề xuất hoãn, cần nhân viên y tế và nội dung cảnh báo phù hợp | ĐẠT |
| AI-21 | Hỏi tiêm HPV khi đang mang thai | Trả mức thận trọng/hoãn và yêu cầu nhân viên y tế đánh giá | ĐẠT |
| AI-22 | Hỏi thông tin chung về vắc xin viêm gan B | Cho phép trao đổi thông tin chung, không yêu cầu đánh giá lâm sàng | ĐẠT |
| AI-23 | FAQ vắc xin kèm dấu hiệu đang sốt | Phản hồi có metadata eligibility và bật `safe_mode` | ĐẠT |

#### b. Test case backend

| Mã | Nội dung kiểm thử | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| BE-01 | Tạo cơ sở hợp lệ, tên có khoảng trắng thừa | Tên được chuẩn hóa, trả về mã mới và trạng thái `ACTIVE` | ĐẠT |
| BE-02 | Tạo cơ sở với tên chỉ gồm khoảng trắng | Báo request không hợp lệ, không lưu dữ liệu | ĐẠT |
| BE-03 | Tạo cơ sở trùng tên không phân biệt hoa/thường | Báo trùng tên, không lưu dữ liệu | ĐẠT |
| BE-04 | Tạo cơ sở có giờ đóng cửa trước giờ mở cửa | Báo giờ hoạt động không hợp lệ, không lưu dữ liệu | ĐẠT |
| BE-05 | Tạo cơ sở không truyền sức chứa | Sức chứa mặc định bằng 10 | ĐẠT |
| BE-06 | Tra cứu mã cơ sở không tồn tại | Phát sinh lỗi không tìm thấy tài nguyên | ĐẠT |
| BE-07 | Tra cứu cơ sở tồn tại | Trả về thông tin cơ sở đã ánh xạ | ĐẠT |
| BE-08 | Cập nhật riêng sức chứa, giữ nguyên các trường khác | Cập nhật sức chứa, giữ nguyên tên và địa chỉ | LỖI: test chưa mock `AuditLogWriter`, phát sinh `NullPointerException` |
| BE-09 | Cập nhật tên trùng với cơ sở khác | Báo request không hợp lệ, không lưu dữ liệu | ĐẠT |
| BE-10 | Cập nhật giờ đóng cửa sớm hơn giờ mở cửa hiện tại | Báo giờ hoạt động không hợp lệ | ĐẠT |
| BE-11 | Xóa mềm một cơ sở đang hoạt động | Chuyển trạng thái sang `INACTIVE` | ĐẠT |
| BE-12 | Xóa cơ sở đã ngừng hoạt động | Báo request không hợp lệ, không lưu lại | ĐẠT |
| BE-13 | Xóa mã cơ sở không tồn tại | Phát sinh lỗi không tìm thấy tài nguyên | ĐẠT |
| BE-14 | Kích hoạt lại cơ sở `INACTIVE` | Chuyển trạng thái sang `ACTIVE` | ĐẠT |
| BE-15 | Kích hoạt lại cơ sở đã `ACTIVE` | Báo request không hợp lệ, không lưu lại | ĐẠT |
| BE-16 | Lấy danh sách cơ sở đang hoạt động | Chỉ trả về cơ sở `ACTIVE` | ĐẠT |
| BE-17 | Lấy toàn bộ cơ sở | Bao gồm cả cơ sở đang hoạt động và ngừng hoạt động | ĐẠT |
| BE-18 | Tạo principal từ tài khoản `ACTIVE` | Tài khoản được bật và không bị khóa | ĐẠT |
| BE-19 | Tạo principal từ tài khoản `INACTIVE` | Tài khoản bị vô hiệu hóa | ĐẠT |
| BE-20 | Tạo principal từ tài khoản `SUSPENDED` | Tài khoản bị khóa và không được bật | ĐẠT |
| BE-21 | Tạo principal từ tài khoản `DELETED` | Tài khoản bị vô hiệu hóa | ĐẠT |
| BE-22 | Lấy quyền của tài khoản vai trò `USER` | Trả về authority `ROLE_USER` | ĐẠT |
| BE-23 | Khởi động Spring application context | Nạp được application context | ĐẠT |

#### c. Test case tích hợp nghiệp vụ đề xuất

Các test case sau cần thực hiện thủ công hoặc bổ sung thành kiểm thử tích hợp. Chúng **chưa được tính vào kết quả chạy tự động** ở mục 4.4.3.

| Mã | Tiền điều kiện và thao tác | Kết quả mong đợi | 
|---|---|---|
| SYS-01 | Người dân chọn cơ sở, vắc xin và khung giờ còn chỗ rồi xác nhận đặt lịch | Lịch được tạo đúng người dùng, cơ sở, thời gian và trạng thái ban đầu | 
| SYS-02 | Gửi callback thanh toán sai chữ ký hoặc sai thông tin giao dịch | Giao dịch không được xác nhận thanh toán
| SYS-03 | Nhân viên đúng cơ sở check-in lịch hợp lệ đã thanh toán | Lịch chuyển sang `CHECKED_IN`; nhân viên sai cơ sở hoặc lịch không hợp lệ bị từ chối | 
| SYS-04 | Ghi nhận mũi tiêm với kết quả `SUCCESS`, sau đó thử ghi trùng lịch | Lần đầu lưu kết quả, trừ đúng một liều và hoàn tất lịch; lần ghi trùng bị từ chối | 
| SYS-05 | Ghi nhận kết quả tiêm không phải `SUCCESS` | Không trừ tồn kho | 
| SYS-06 | Có nhiều lô vắc xin còn hạn với ngày hết hạn khác nhau và ghi nhận sử dụng | Ưu tiên trừ lô có hạn dùng gần nhất theo FEFO | 
| SYS-07 | Người dùng chưa đăng nhập truy cập trang yêu cầu xác thực; nhân viên truy cập dữ liệu cơ sở khác | Giao diện điều hướng phù hợp và backend từ chối truy cập trái quyền |
### 4.4.3. Kết quả kiểm thử ghi nhận

| Thành phần | Lệnh/phương pháp | Kết quả ghi nhận |
|---|---|---|
| AI service | `python -m pytest -q` | **23 tests passed**. Có cảnh báo Pydantic và cảnh báo model scikit-learn được lưu bằng phiên bản 1.6.1 nhưng môi trường chạy kiểm thử dùng 1.9.0. |
| Backend | `.\mvnw.cmd test` | **23 tests: 22 thành công, 1 lỗi**. Lỗi ở `VaccinationFacilityServiceTest.updateFacility_partialUpdate_onlyChangesProvidedFields`: test chưa mock `AuditLogWriter`, nhưng service gọi dependency này khi cập nhật cơ sở. |
| Frontend lint | `npm run lint` | **Thất bại:** 1 lỗi và 8 cảnh báo. Lỗi hiện tại là gọi `setLoading(true)` đồng bộ bên trong effect ở `PaymentModal.jsx`. |
| Frontend build | `npm run build` | **Thành công.** Build có cảnh báo chunk JavaScript chính vượt ngưỡng 500 kB và một số dynamic import không tạo được chunk riêng. |

Đây là kết quả của lần chạy kiểm tra trong môi trường phát triển hiện tại, không phải kết quả nghiệm thu trên môi trường sản xuất. Các cảnh báo phiên bản thư viện cần được kiểm tra lại trong môi trường cài đúng `requirements.txt`.

### 4.4.4. Giới hạn của kết quả

- Bài kiểm tra Spring context sử dụng cấu hình datasource của ứng dụng và trong lần chạy đã kết nối MySQL cục bộ. Cần chạy test với database riêng, không dùng dữ liệu đang vận hành.
- Chưa có kết quả kiểm thử end-to-end tự động bao phủ toàn bộ luồng từ giao diện qua backend đến cổng thanh toán và AI service.
- Các script đánh giá AI có thể sinh báo cáo intent/retrieval/answer, nhưng chưa có báo cáo được lưu trong `eval/reports/` ở lần rà soát này; vì vậy không kết luận thêm metric từ các script đó.
- `vaxcare-ai/models/schedule_metrics.json` lưu các giá trị `MAE = 4.8117`, `RMSE = 6.0588` và `R² = 0.7946`. Tệp này không kèm đủ thông tin về cách chia tập dữ liệu và quy trình đánh giá; các giá trị cần được xem là metric đã lưu trong dự án, không phải cam kết hiệu quả trên dữ liệu thực tế.
- Chất lượng dự báo và chatbot phụ thuộc dữ liệu, model, tài liệu tri thức và cấu hình triển khai.

