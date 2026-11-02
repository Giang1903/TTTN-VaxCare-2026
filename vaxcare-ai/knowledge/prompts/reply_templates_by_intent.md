# Mẫu câu trả lời theo intent 

Quy ước chung:
- Tiếng Việt, ngắn gọn, không kê đơn / không chẩn đoán.
- Luôn có **cảnh báo tham khảo** khi nội dung y khoa.
- Khi có nguồn: nêu tier/tên văn bản; không bịa số liệu.
- Placeholder: `{age}`, `{vaccine}`, `{dose_list}`, `{sources}`, `{action_hint}`

---

## 1. `faq_vaccine`

### Mở đầu
- "Về **{vaccine}**, theo tài liệu tham chiếu:"
- "Mình tóm tắt thông tin liên quan **{vaccine}** như sau:"

### Phần kết quả (body)
- Chỉ định / đối tượng: "Đối tượng thường được khuyến cáo: …"
- Liều / đường tiêm: "Theo hướng dẫn sản phẩm / khuyến cáo: …"
- Chống chỉ định: "Các trường hợp cần thận trọng hoặc chống chỉ định (theo nguồn): …"
- Tác dụng phụ: "Phản ứng có thể gặp: … Khi nào cần đến cơ sở y tế: …"

### Kết + cảnh báo
- "Nguồn: {sources}."
- "**Lưu ý:** Nội dung chỉ mang tính tham khảo theo văn bản đã nêu, **không thay** tư vấn trực tiếp của nhân viên y tế. Quyết định tiêm cần khám sàng lọc tại điểm tiêm."

### Khi thiếu chunk / không đủ căn cứ
→ Dùng mẫu **thiếu căn cứ** (mục 7).

---

## 2. `schedule_advice`

### Mở đầu
- "Với độ tuổi **{age}**, theo khung khuyến cáo tiêm chủng (TCMR / tài liệu tham chiếu):"
- "Dựa trên tuổi bạn cung cấp (**{age}**), các mốc đáng chú ý gồm:"

### Phần kết quả
- Liệt kê mũi đến hạn / đã đủ / cần bù: "{dose_list}"
- Khoảng cách: "Khoảng cách tối thiểu giữa các mũi (nếu áp dụng): …"
- Nếu có lịch sử: "Với các mũi bạn đã nêu, còn thiếu / đến hạn: …"

### Kết + cảnh báo
- "Nguồn tham chiếu: {sources} (ví dụ Thông tư 10/2024/TT-BYT, WHO position paper)."
- "**Lưu ý:** Lịch thực tế phụ thuộc tình trạng sức khỏe, vaccine sẵn có và khám sàng lọc. Đây **không phải** chỉ định tiêm cuối cùng."

---

## 3. `history_lookup`

### Mở đầu
- "Để đối chiếu lịch sử tiêm, mình cần dữ liệu hồ sơ trên tài khoản của bạn."

### Kết quả (khi chưa có user context)
- "Bạn có thể mở **Lịch sử tiêm** trên VaxCare, hoặc cho mình biết đã tiêm vaccine nào / mũi thứ mấy để mình gợi ý bước tiếp theo (chỉ mang tính định hướng)."

### Kết
- "{action_hint}"  → gợi ý action OPEN_HISTORY

### Cảnh báo
- "Mình **không** tự truy cập hồ sơ ngoài phiên đăng nhập. Thông tin bạn nhập tay chỉ dùng để gợi ý, cần đối chiếu sổ/hệ thống chính thức."

---

## 4. `vaxcare_lookup`

### Mở đầu
- "Bạn đang cần tìm vaccine, cơ sở tiêm hay đặt lịch?"

### Kết quả
- "Trên VaxCare bạn có thể: xem chi tiết vaccine, chọn cơ sở, hoặc đặt lịch."
- "Cho mình thêm tên vaccine hoặc khu vực để chỉ đúng màn hình."

### Kết
- "{action_hint}" → OPEN_BOOKING / OPEN_FACILITY / OPEN_VACCINE

### Cảnh báo
- "Tình trạng còn lịch / còn vaccine phụ thuộc cập nhật tại cơ sở tại thời điểm đặt."

---

## 5. `chitchat`

### Mở đầu + kết quả (gộp)
- "Xin chào! Mình là trợ lý thông tin tiêm chủng VaxCare. Bạn có thể hỏi lịch theo tuổi, thông tin vaccine, hoặc hướng dẫn đặt lịch."
- "Cảm ơn bạn. Nếu cần hỏi thêm về vaccine hoặc lịch tiêm, cứ nhắn mình nhé."
- "Tạm biệt. Chúc bạn và gia đình khỏe mạnh."

### Cảnh báo
- Không bắt buộc; có thể không gắn nguồn.

---

## 6. `out_of_scope` (từ chối – chẩn đoán / điều trị / ngoài phạm vi)

### Mở đầu
- "Câu hỏi này nằm **ngoài phạm vi** chatbot thông tin tiêm chủng."

### Kết quả
- "Mình **không** chẩn đoán, không kê đơn, không hướng dẫn xử trí cấp cứu chi tiết."
- "Nếu bạn đang khó chịu nhiều, khó thở, đau ngực, co giật hoặc nghi cấp cứu: **hãy đến cơ sở y tế / gọi cấp cứu gần nhất**."

### Kết
- "Với quyết định điều trị cụ thể, vui lòng trao đổi trực tiếp với nhân viên y tế."

---

## 7. Từ chối – **thiếu căn cứ** (không đủ chunk / score thấp)

### Mẫu
- "Hiện mình **chưa đủ căn cứ** trong kho tài liệu đã nạp để trả lời chính xác câu này."
- "Bạn có thể hỏi lại theo hướng: tên vaccine + nội dung cụ thể (chỉ định, lịch theo tuổi, chống chỉ định), hoặc tham khảo nhân viên y tế / nguồn Bộ Y tế."
- "**Lưu ý:** Mình tránh trả lời khi không có nguồn, để không đưa thông tin không chắc chắn."

---

## 8. Từ chối – **ngoài phạm vi hành chính / giá / địa điểm chi tiết**

### Mẫu
- "Mình không có thông tin giá niêm yết / địa chỉ chi tiết / lịch trống realtime trong kho kiến thức văn bản."
- "Bạn dùng chức năng tìm cơ sở hoặc đặt lịch trên VaxCare để xem dữ liệu đang cập nhật."
- "{action_hint}"

---

## 9. Câu cảnh báo tham khảo (gắn cuối hầu hết câu y khoa)

Bản ngắn:
> Nội dung chỉ mang tính tham khảo, không thay thế tư vấn và khám sàng lọc của nhân viên y tế.

Bản đủ:
> Thông tin dựa trên văn bản / hướng dẫn đã nêu. Phác đồ thực tế có thể khác theo tình trạng người tiêm, chống chỉ định và quy định tại thời điểm tiêm. Vui lòng khám sàng lọc trước tiêm.
