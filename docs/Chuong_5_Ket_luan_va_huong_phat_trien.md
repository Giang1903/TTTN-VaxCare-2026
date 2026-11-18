# CHƯƠNG 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 5.1. Kết luận

Đề tài **“Xây dựng nền tảng quản lý và điều phối hoạt động tiêm chủng VaxCare có ứng dụng trí tuệ nhân tạo”** hướng đến việc số hóa một số quy trình phục vụ người dân, nhân viên y tế và quản trị viên. Qua quá trình phân tích, thiết kế và xây dựng, đề tài đã hình thành một ứng dụng gồm frontend, backend, dịch vụ AI và cơ sở dữ liệu MySQL.

Các chức năng đã được hiện thực theo những nhóm nghiệp vụ chính: quản lý tài khoản và phân quyền; tra cứu cơ sở, vắc xin và giá; xử lý lịch hẹn và thanh toán theo cấu hình; check-in và ghi nhận kết quả tiêm; quản lý lô và tồn kho; chatbot tra cứu; cùng các chức năng hỗ trợ điều phối lịch và dự báo nhu cầu. Backend tập trung kiểm tra quy tắc nghiệp vụ, quyền truy cập và lưu trữ dữ liệu; AI service được tách riêng để có thể phát triển và triển khai độc lập.

Kết quả kiểm thử hiện tại cho thấy một số thành phần đã vượt qua kiểm thử tự động: AI service có 23 test pass và frontend build thành công. Tuy vậy, backend còn một test lỗi do thiếu mock dependency trong unit test, frontend lint còn một lỗi cùng các cảnh báo, và chưa có kết quả kiểm thử end-to-end cho toàn bộ luồng. Vì vậy, hệ thống đạt kết quả ở mức sản phẩm đồ án và kiểm thử từng phần, chưa thể xem là đã được nghiệm thu toàn diện hoặc sẵn sàng đưa vào môi trường y tế thực tế. Chi tiết được trình bày trong [Chương 4 – Xây dựng và kiểm thử hệ thống](./Chuong_4_Xay_dung_va_kiem_thu.md).

## 5.2. Mức độ hoàn thành mục tiêu

| Mục tiêu | Kết quả đạt được | Nhận xét |
|---|---|---|
| Xây dựng giao diện cho người dân, nhân viên y tế và quản trị viên | Frontend có các khu vực chức năng theo vai trò và gọi API backend | Build thành công; cần xử lý lỗi lint và bổ sung kiểm thử giao diện/tương tác. |
| Xây dựng backend cho các nghiệp vụ quản lý tiêm chủng | Có các module tài khoản, cơ sở, vắc xin, lịch hẹn, thanh toán, hồ sơ tiêm, kho và các chức năng hỗ trợ | Kiểm thử backend chưa hoàn toàn đạt do một test cập nhật cơ sở bị lỗi. |
| Lưu trữ dữ liệu trong cơ sở dữ liệu quan hệ | Có schema MySQL và các bảng cho tài khoản, danh mục, lịch hẹn, tiêm chủng, kho và hoạt động hệ thống | Cần tiếp tục kiểm thử migration, ràng buộc và tính nhất quán trên môi trường riêng biệt. |
| Thử nghiệm AI cho điều phối lịch, dự báo nhu cầu và chatbot | Có AI service và các test tự động cho lịch, quy tắc, hội thoại và API chatbot | Test AI hiện tại pass; cần đánh giá model trên tập dữ liệu được mô tả rõ và kiểm tra trong điều kiện vận hành. |
| Kiểm tra các luồng nghiệp vụ chính | Đã có test tự động cho một số phần riêng lẻ và tài liệu mô tả luồng check-in, ghi nhận tiêm, kho | Các luồng tích hợp frontend–backend–database–dịch vụ ngoài chưa có kết quả end-to-end được xác nhận. |

Nhìn chung, các mục tiêu xây dựng kiến trúc và hiện thực những phân hệ chính đã được triển khai ở mức đồ án. Mức độ hoàn thành về độ tin cậy, chất lượng AI và khả năng vận hành cần được nâng cao bằng các bước kiểm thử và đánh giá bổ sung.

## 5.3. Hạn chế

1. **Kiểm thử chưa bao phủ toàn hệ thống:** chưa có báo cáo end-to-end xác nhận các luồng từ giao diện đến backend, database và các dịch vụ ngoài hoạt động đồng bộ.
2. **Còn lỗi trong công cụ kiểm tra:** backend có một unit test lỗi do `AuditLogWriter` chưa được mock; frontend lint có một lỗi và một số cảnh báo cần xử lý.
3. **Môi trường kiểm thử cần được chuẩn hóa:** bài kiểm tra Spring context đã kết nối MySQL cục bộ; cần tách database test khỏi dữ liệu phát triển hoặc vận hành. Môi trường Python cũng cần thống nhất phiên bản scikit-learn với phiên bản dùng tạo model.
4. **Đánh giá AI còn hạn chế:** các metric được lưu trong dự án chưa kèm đầy đủ thông tin về tập dữ liệu, cách chia tập và quy trình đánh giá. Chưa có báo cáo đánh giá intent, truy xuất và câu trả lời được lưu làm căn cứ kết luận chất lượng.
5. **Phụ thuộc dữ liệu và cấu hình:** kết quả gợi ý/dự báo phụ thuộc dữ liệu đầu vào, model và cấu hình dịch vụ; chatbot phụ thuộc nội dung tri thức, rule và cấu hình LLM. Các kết quả này chỉ có tính hỗ trợ.
6. **Chưa đủ cơ sở triển khai thực tế:** các tích hợp như thanh toán, email và dịch vụ AI bên ngoài cần được cấu hình, kiểm tra bảo mật và thử nghiệm trong môi trường tương ứng. Hệ thống cũng cần được đánh giá thêm về quyền riêng tư, hiệu năng, khả năng phục hồi và yêu cầu chuyên môn/pháp lý.

## 5.4. Hướng phát triển

### 5.4.1. Hoàn thiện chất lượng phần mềm

- Bổ sung mock `AuditLogWriter` cho test cập nhật cơ sở và chạy lại toàn bộ backend tests.
- Sửa lỗi lint tại `PaymentModal`, xử lý các cảnh báo còn lại và bổ sung kiểm thử component cho các màn hình quan trọng.
- Tách cấu hình database test; bổ sung kiểm thử API và end-to-end cho các vai trò và quy trình chính.
- Bổ sung CI để tự động chạy lint, build và test khi có thay đổi mã nguồn.

### 5.4.2. Hoàn thiện kiểm thử nghiệp vụ

- Kiểm tra đầy đủ các trường hợp đặt lịch, kiểm tra sức chứa, lịch trùng, hủy/đổi lịch và thanh toán thành công/thất bại.
- Kiểm tra quyền theo vai trò và theo cơ sở đối với check-in, ghi nhận tiêm và quản lý kho.
- Kiểm tra rằng chỉ kết quả tiêm `SUCCESS` mới trừ tồn, ghi nhận trùng bị từ chối và lô được sử dụng theo quy tắc FEFO.
- Kiểm thử tải, xử lý lỗi dịch vụ phụ thuộc, tính toàn vẹn giao dịch và khôi phục sau lỗi.

### 5.4.3. Nâng cao đánh giá AI và chatbot

- Xây dựng tập dữ liệu đánh giá có nguồn gốc, phạm vi và cách gán nhãn rõ ràng; tách dữ liệu huấn luyện và đánh giá phù hợp, đặc biệt với dữ liệu theo thời gian.
- Báo cáo metric theo từng bài toán, so sánh với baseline và lưu kèm phiên bản dữ liệu, model, thư viện cùng phương pháp đánh giá.
- Theo dõi sai số dự báo khi có dữ liệu thực tế; đánh giá độ ổn định theo cơ sở, thời gian và loại vắc xin trước khi dùng kết quả để hỗ trợ lập kế hoạch.
- Cải thiện truy xuất tri thức, trích dẫn nguồn, kiểm soát nội dung và cơ chế chuyển tiếp cho nhân viên y tế khi câu hỏi vượt phạm vi chatbot.
- Duy trì ranh giới an toàn: kết quả AI không thay thế quyết định chuyên môn và không đưa ra chẩn đoán hoặc chỉ định điều trị.

### 5.4.4. Chuẩn bị cho triển khai và vận hành

- Quản lý secret và cấu hình theo môi trường; không dùng thông tin xác thực thử nghiệm cho môi trường vận hành.
- Bổ sung logging, audit, monitoring, cảnh báo lỗi và quy trình sao lưu/khôi phục dữ liệu.
- Đánh giá quyền riêng tư và giới hạn truy cập đối với hồ sơ sức khỏe; kiểm tra bảo mật API và các tích hợp bên ngoài.
- Đánh giá hiệu năng, khả năng mở rộng và khả năng sẵn sàng của backend, database và AI service khi có tải đồng thời.
- Tham vấn chuyên gia và đơn vị vận hành để rà soát quy trình nghiệp vụ, nội dung y tế, yêu cầu pháp lý và tiêu chí nghiệm thu trước khi triển khai thực tế.

## 5.5. Kết luận chương

VaxCare đã hiện thực nền tảng gồm các phân hệ web, backend, database và dịch vụ AI nhằm hỗ trợ một số hoạt động quản lý tiêm chủng. Kết quả cho thấy hướng tiếp cận này có thể làm cơ sở cho việc tiếp tục phát triển và thử nghiệm. Trước khi mở rộng sang triển khai thực tế, cần ưu tiên sửa các lỗi kiểm tra hiện có, hoàn thiện kiểm thử tích hợp, đánh giá AI trên dữ liệu phù hợp và đáp ứng các yêu cầu về bảo mật, quyền riêng tư, chuyên môn và vận hành.
