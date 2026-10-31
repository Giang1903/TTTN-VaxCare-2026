# Intent Data – Quy ước gán nhãn (VaxCare Chatbot)

Tài liệu này định nghĩa **6 nhóm intent** dùng để huấn luyện / đánh giá bộ phân loại ý định (intent classifier) của chatbot tư vấn tiêm chủng VaxCare.

## 1. Mục tiêu

- Phân loại câu hỏi người dùng vào đúng nhóm để định tuyến:
  - Gọi RAG trên đúng tập chunk
  - Gọi rule engine (lịch tiêm, chống chỉ định)
  - Hoặc trả lời template cố định
- Dùng làm ground-truth cho tập train / test / evaluation.

## 2. 6 nhóm Intent (bắt buộc dùng đúng tên)

| ID | Intent label        | Mô tả ngắn                                                                 | Ưu tiên nguồn dữ liệu                          |
|----|---------------------|----------------------------------------------------------------------------|------------------------------------------------|
| 1  | `lich_tiem`         | Hỏi lịch tiêm theo tuổi, số mũi, khoảng cách giữa các mũi, tiêm bù        | TCMR (TT 10/2024), WHO position paper, age_rules |
| 2  | `chi_dinh`          | Ai nên tiêm, chỉ định, đối tượng khuyến cáo                                | HDSD sản phẩm, WHO, TT 10/2024                 |
| 3  | `chong_chi_dinh`    | Chống chỉ định, tạm hoãn, thận trọng, khám sàng lọc trước tiêm            | QĐ 1575/QĐ-BYT, HDSD, TT 51/2017               |
| 4  | `lieu_cach`         | Liều lượng (ml), đường tiêm, vị trí tiêm, số liều, cách pha               | Tờ HDSD sản phẩm                               |
| 5  | `tac_dung_phu`      | Phản ứng sau tiêm, tác dụng phụ thường gặp / hiếm gặp, xử trí tại nhà     | HDSD, WHO, hướng dẫn theo dõi sau tiêm         |
| 6  | `thong_tin_chung`   | Câu hỏi chung: vaccine nào bắt buộc, so sánh, bảo quản, giá, FAQ khác     | Tất cả nguồn, ưu tiên tier A                   |

> **Lưu ý**: Một câu có thể mang nhiều ý, nhưng **chỉ gán 1 intent chính** (intent chiếm trọng tâm câu hỏi). Nếu không chắc → ưu tiên `thong_tin_chung`.

## 3. Quy tắc gán nhãn (labeling rules)

1. **Ưu tiên theo trọng tâm câu hỏi**, không theo từ khóa đơn lẻ.
   - “Bé 2 tháng tiêm gì và có sốt không?” → `lich_tiem` (trọng tâm là lịch), phần sốt chỉ là phụ.
2. **Câu hỏi về thai kỳ / phụ nữ mang thai**:
   - Nếu hỏi “có tiêm được không / chống chỉ định?” → `chong_chi_dinh`
   - Nếu hỏi “lịch uốn ván thai phụ” → `lich_tiem`
3. **Câu hỏi “sau tiêm bị X thì sao?”** → luôn `tac_dung_phu`.
4. **Câu hỏi “tiêm mấy mũi / cách bao lâu”** → `lich_tiem` (không phải `lieu_cach`).
5. **Câu hỏi “tiêm bao nhiêu ml / tiêm bắp hay dưới da”** → `lieu_cach`.
6. Câu không liên quan tiêm chủng / vaccine → gán `out_of_scope` (không thuộc 6 nhóm, dùng cho negative sample).

## 4. Format file dữ liệu

### 4.1. File hạt giống / train

File CSV, encoding UTF-8, cột:

```csv
id,text,intent,vaccine_ids,notes,split
1,"Trẻ 2 tháng tuổi tiêm những mũi gì?",lich_tiem,2;3;4;5,"TCMR cơ bản",train
```

| Cột           | Bắt buộc | Mô tả                                      |
|---------------|----------|--------------------------------------------|
| id            | Có       | Số nguyên duy nhất                         |
| text          | Có       | Câu hỏi tiếng Việt (tự nhiên)              |
| intent        | Có       | Một trong 6 label ở trên                   |
| vaccine_ids   | Không    | Danh sách id vaccine liên quan (phân cách `;`) |
| notes         | Không    | Ghi chú nguồn / lý do gán nhãn             |
| split         | Có       | `train` / `dev` / `test`                   |

### 4.2. File cặp hỏi–đoạn (retrieval evaluation)

```csv
qid,question,intent,chunk_id,is_relevant,notes
1,"Trẻ sơ sinh tiêm BCG khi nào?",lich_tiem,tcmr-002,1,"Đúng đoạn"
```

## 5. Mapping vaccine_id (thống nhất toàn project)

| ID | Tên thường dùng              | Tên sản phẩm tham chiếu      |
|----|------------------------------|------------------------------|
| 1  | BCG (lao)                    | BCG                          |
| 2  | Viêm gan B                   | –                            |
| 3  | Bạch hầu – Ho gà – Uốn ván   | Tetraxim, Adacel             |
| 4  | Bại liệt (IPV)               | Imovax Polio                 |
| 5  | Hib                          | –                            |
| 6  | Sởi – Quai bị – Rubella      | M-M-R II                     |
| 7  | Thủy đậu                     | Varivax                      |
| 8  | Phế cầu                      | Prevenar 20                  |
| 9  | Viêm não Nhật Bản            | Imojev                       |
| 10 | Cúm                          | Influvac Tetra               |
| 11 | HPV                          | Gardasil 9                   |
| 12 | COVID-19                     | –                            |
| 13 | Zona (Herpes zoster)         | Shingrix                     |

## 6. Quy trình tạo dữ liệu (khuyến nghị)

1. Viết **20 câu hạt giống/nhóm** (viết tay, đa dạng).
2. Nhân bản bằng cách thay tên vaccine / nhóm tuổi / tình huống → đạt 40–60 câu/nhóm.
3. Chia split: ~70% train, 15% dev, 15% test.
4. Tạo thêm 20–30 câu `out_of_scope` / không có đáp án để đánh giá refusal.
5. Khóa version bằng tag git: `testset-v1`, `intent-v1`.

## 7. File hiện có trong thư mục này

| File                          | Nội dung                                      |
|-------------------------------|-----------------------------------------------|
| `README.md`                   | File này                                      |
| `seed_intents_v1.csv`         | 120 câu hạt giống (20/nhóm)                   |
| `train_intents_v1.csv`        | Bản mở rộng ~360 câu (60/nhóm)                |
| `../knowledge/testsets/`      | Bộ test retrieval + end-to-end                |

---

