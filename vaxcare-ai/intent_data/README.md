# Dữ liệu intent chatbot

Thư mục này chứa câu hỏi và nhãn dùng để huấn luyện hoặc đánh giá bộ phân loại intent. Intent quyết định chatbot nên dùng FAQ/RAG, rule lịch tiêm, tra cứu hồ sơ, điều hướng chức năng hay từ chối câu hỏi ngoài phạm vi.

## Các nhãn

Giữ nguyên chính xác các tên nhãn sau trong dữ liệu và mã nguồn:

| Nhãn | Ý nghĩa |
|---|---|
| `faq_vaccine` | Hỏi thông tin về vắc xin. |
| `schedule_advice` | Hỏi lịch tiêm, khoảng cách mũi hoặc tiêm bù. |
| `history_lookup` | Hỏi lịch sử/hồ sơ tiêm. |
| `vaxcare_lookup` | Hỏi cơ sở, đặt lịch hoặc điều hướng trên VaxCare. |
| `chitchat` | Chào hỏi, cảm ơn hoặc tạm biệt. |
| `out_of_scope` | Câu hỏi ngoài phạm vi, gồm chẩn đoán, kê đơn hoặc cấp cứu. |

## Các tập dữ liệu

- `seed_intents_v1.csv`, `seed_expanded.csv`: dữ liệu seed và các câu mở rộng.
- `train_intents_v1.csv`, `train.csv`: dữ liệu huấn luyện.
- `test.csv`: dữ liệu đánh giá.
- `all_aligned_v2.csv`: tập dữ liệu được chuẩn hóa nhãn.

`README` này mô tả mục đích và quy ước. Hãy xem header của từng CSV để biết tên cột hiện tại.

## Quy tắc cập nhật

1. Dùng đúng sáu nhãn nêu trên; không tự tạo biến thể viết hoa/viết tắt.
2. Câu hỏi phải được gán nhãn theo mục đích chính của người dùng.
3. Giữ các ví dụ kiểm thử riêng khỏi dữ liệu huấn luyện để việc đánh giá có ý nghĩa.
4. Sau khi thay dữ liệu, chạy lại pipeline huấn luyện/đánh giá và kiểm thử chatbot.
