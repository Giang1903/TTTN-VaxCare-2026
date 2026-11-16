# AI Service VaxCare

AI service là ứng dụng FastAPI chạy độc lập. Backend Spring Boot gọi các API của dịch vụ này để lấy gợi ý lịch tiêm, dự báo nhu cầu vắc xin và phản hồi chatbot.

## Các chức năng

| Chức năng | API | Mục đích |
|---|---|---|
| Điều phối lịch tiêm | `POST /api/v1/ai/schedule` | Xếp hạng/gợi ý khung giờ dựa trên dữ liệu đầu vào và model AI1. |
| Alias điều phối lịch | `POST /api/v1/ai/dispatch` | Endpoint tương đương cho luồng điều phối. |
| Dự báo nhu cầu | `POST /api/v1/ai/forecast` | Dự báo nhu cầu vắc xin bằng model AI2. |
| Chatbot | `POST /api/v1/chatbot/chat` | Trả lời câu hỏi bằng rule, dữ liệu tri thức và thành phần ngôn ngữ đã cấu hình. |
| Health check | `GET /health` | Kiểm tra trạng thái service và các thành phần AI. |

Swagger UI: `http://localhost:8000/docs`.

Chatbot hỗ trợ thông tin tham khảo về tiêm chủng; không chẩn đoán, kê đơn hay thay thế khám sàng lọc của nhân viên y tế.

## Cấu trúc thư mục

| Thư mục | Vai trò |
|---|---|
| `app/routers/` | Khai báo các API. |
| `app/services/` | Nạp model và xử lý yêu cầu. |
| `app/chatbot/` | Điều phối intent, rules, RAG, LLM và memory. |
| `app/schemas/` | Kiểu dữ liệu request/response. |
| `core/` trong `app/` | Cấu hình, log và kiểm tra API key. |
| `models/` | Model đã huấn luyện được dùng khi chạy service. |
| `data/` | Dữ liệu phục vụ model và phát triển. |
| `knowledge/` | Tài liệu, chunk, chỉ mục và quy tắc chatbot. |
| `notebooks/` | Notebook làm sạch dữ liệu, huấn luyện và đánh giá. |
| `tests/` | Kiểm thử API và các thành phần chatbot/AI. |
| `eval/` | Script đánh giá intent, truy xuất và câu trả lời. |

## Yêu cầu và cài đặt

- Python 3.11 được khuyến nghị (Dockerfile dùng Python 3.11).
- Các thư viện được ghim trong `requirements.txt`.
- Nếu dùng LLM Ollama, cần chạy Ollama riêng và tải model được cấu hình.

Trên Windows PowerShell, từ thư mục `vaxcare-ai`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Pydantic Settings đọc cấu hình từ biến môi trường và file `.env` tại thư mục chạy. Chỉnh `.env` cục bộ theo nhu cầu; không commit file này hoặc khóa API.

## Cấu hình thường dùng

Các tên biến được khai báo trong `.env.example` và `app/core/config.py`. Những cấu hình thường gặp:

- `MODEL_DIR`: thư mục chứa model.
- `CHATBOT_ENABLED`: bật/tắt chatbot.
- `INTERNAL_API_KEY`: khóa bảo vệ API nội bộ khi được cấu hình; cần đặt cùng giá trị với cấu hình gọi AI ở backend nếu dùng xác thực này.
- `LLM_BACKEND`, `LLM_MODEL_NAME`, `OLLAMA_BASE_URL`: cấu hình LLM.
- `CHAT_MEMORY_MAX_TURNS`, `CHAT_MEMORY_TTL_SEC`: giới hạn memory hội thoại.
- `RETRIEVAL_TOP_K`, `RETRIEVAL_MIN_SCORE`, `INTENT_MIN_CONFIDENCE`: cấu hình retrieval và intent.

Chỉ mở service trong mạng tin cậy nếu chưa cấu hình xác thực và giới hạn truy cập.

## Model và dữ liệu

Model inference được nạp từ `models/`. Các notebook trong `notebooks/` dùng để phát triển pipeline; thay đổi model nên được đánh giá trước khi thay artifact đang dùng.

Chạy test:

```powershell
python -m pytest -q
```

## Docker

```powershell
docker build -t vaxcare-ai .
docker run --rm -p 8000:8000 vaxcare-ai
```

Image chạy riêng, không tự khởi động backend, database hoặc Ollama. Cấu hình URL và các dịch vụ phụ thuộc qua môi trường khi chạy container.
