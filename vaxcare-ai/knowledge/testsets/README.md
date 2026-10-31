# Testset v1 – Khóa ngày 30/10/2026

Tag khuyến nghị: `testset-v1`

## Thành phần

| File | Số lượng | Mục đích |
|------|----------|----------|
| `testset_v1_intents.csv` | 120 câu (20/nhóm) | Đánh giá intent classifier (viết tay, quality cao) |
| `testset_v1_retrieval.csv` | 150 cặp relevant + 25 no-answer | Đánh giá retrieval / RAG (chunk_id + is_relevant) |
| `testset_v1_e2e.csv` | 60 câu positive + 10 no-answer | End-to-end: intent + chunk + key points câu trả lời |

## Cách dùng

### 1. Intent classification
```bash
# Metric: accuracy, macro-F1 trên 6 nhóm
# Cột quan trọng: text, intent
```

### 2. Retrieval
```bash
# Metric: Recall@k, MRR, nDCG
# is_relevant = 1 → chunk_id là đáp án đúng
# is_relevant = 0 → câu không có đáp án trong KB (model nên refusal)
```

### 3. End-to-end
- Kiểm tra pipeline đầy đủ: Intent → Retrieve → Generate
- Cột `expected_answer_key_points` dùng để chấm thủ công hoặc LLM-as-judge
- `has_answer = 0` → kỳ vọng bot trả lời “không có thông tin trong nguồn” hoặc chuyển hướng

## Quy ước chấm điểm nhanh (E2E)

| Tiêu chí | Đạt |
|----------|-----|
| Intent đúng | +1 |
| Lấy đúng chunk (hoặc chunk tương đương) | +1 |
| Trả lời chứa các key points | +1 |
| Không bịa (hallucination) | +1 |
| Xử lý conflict nguồn đúng cách (nêu rõ nguồn) | +1 |

Điểm tối đa 5/câu. Pass threshold đề xuất: ≥ 3.5 trung bình.

## Ghi chú quan trọng

- Một số chunk có `conflict_note` (ví dụ Varivax số liều). Bot **phải** nêu rõ sự khác biệt giữa nguồn và để chuyên gia quyết định.
- Câu `out_of_scope` / `has_answer=0` dùng để test hành vi từ chối trả lời khi không có dữ liệu.
- File này khóa cùng với `intent_data/train_intents_v1.csv` và `knowledge/age_rules.csv`.

---