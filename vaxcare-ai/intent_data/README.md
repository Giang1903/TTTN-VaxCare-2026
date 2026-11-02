# Intent Data – Quy ước gán nhãn (VaxCare Chatbot)

Tài liệu này định nghĩa **6 nhóm intent** dùng để huấn luyện / đánh giá bộ phân loại ý định (intent classifier) của chatbot tư vấn tiêm chủng VaxCare.

## 1. Mục tiêu

- Phân loại câu hỏi người dùng vào đúng nhóm để định tuyến:
  - Gọi RAG trên đúng tập chunk
  - Gọi rule engine (lịch tiêm, chống chỉ định)
  - Hoặc trả lời template cố định
- Dùng làm ground-truth cho tập train / test / evaluation.

## 2. 6 nhóm Intent (bắt buộc dùng đúng tên)

| Label | Mô tả |
|-------|--------|
| `faq_vaccine` | Thông tin vaccine: chỉ định, chống chỉ định, liều, tác dụng phụ, FAQ |
| `schedule_advice` | Lịch / lộ trình theo tuổi, khoảng cách mũi, tiêm bù |
| `history_lookup` | Hỏi lịch sử / hồ sơ tiêm của user |
| `vaxcare_lookup` | Tìm cơ sở, đặt lịch, mở trang vaccine trên VaxCare |
| `chitchat` | Chào, cảm ơn, tạm biệt |
| `out_of_scope` | Cấp cứu, kê đơn, chẩn đoán, ngoài tiêm chủng |
