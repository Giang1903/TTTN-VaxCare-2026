# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

## 2.1. Cơ sở lý thuyết

### 2.1.1. Hệ thống quản lý tiêm chủng

Một hệ thống quản lý tiêm chủng cần theo dõi các thực thể và quy trình có liên quan như người dùng, cơ sở tiêm, vắc xin, lịch hẹn, hồ sơ tiêm, phản ứng sau tiêm và tồn kho. Các dữ liệu này liên kết với nhau: một lịch hẹn thuộc về người dùng và cơ sở cụ thể; một lượt tiêm có thể gắn với vắc xin và lô vắc xin đã sử dụng.

Việc quản lý tập trung giúp các vai trò tra cứu và cập nhật dữ liệu theo quyền hạn của mình. Ví dụ, người dân theo dõi lịch hẹn và lịch sử tiêm; nhân viên y tế xử lý lượt tiêm tại cơ sở được phân công; quản trị viên quản lý dữ liệu nền và hoạt động toàn hệ thống. Những nguyên tắc này là cơ sở để phân chia các chức năng và thiết kế dữ liệu của VaxCare.

### 2.1.2. Kiến trúc Client–Server

Trong kiến trúc Client–Server, client gửi yêu cầu đến server; server xử lý yêu cầu, truy cập dữ liệu hoặc dịch vụ phụ thuộc rồi trả kết quả. Với ứng dụng web, trình duyệt là client, còn backend cung cấp các API để client sử dụng.

VaxCare tổ chức thành các thành phần có nhiệm vụ riêng:

- Frontend trình bày dữ liệu và nhận thao tác từ người dùng.
- Backend xử lý nghiệp vụ, xác thực, phân quyền và làm trung gian kết nối các dịch vụ.
- AI service triển khai các chức năng suy luận và chatbot độc lập.
- MySQL lưu trữ dữ liệu quan hệ.

Việc tách AI service khỏi backend giúp hai phần có thể được phát triển và triển khai riêng. Tuy nhiên, các thành phần vẫn cần thống nhất giao thức, cấu hình địa chỉ và định dạng dữ liệu trao đổi.

### 2.1.3. REST API và HTTP/JSON

REST là phong cách kiến trúc thường dùng để xây dựng dịch vụ web [2]. Trong mô hình này, tài nguyên được truy cập qua URI; các thao tác thường dùng phương thức HTTP như `GET`, `POST`, `PUT` và `DELETE`. Dữ liệu request/response của VaxCare chủ yếu được trao đổi dưới dạng JSON.

Một yêu cầu API thường gồm:

1. **Phương thức và URL:** xác định thao tác và tài nguyên.
2. **Header:** chứa thông tin như kiểu nội dung hoặc token xác thực.
3. **Request body:** chứa dữ liệu cần gửi, thường dùng với `POST` hoặc `PUT`.
4. **HTTP status code và response body:** cho biết kết quả xử lý.

Ví dụ, frontend gửi thông tin đăng nhập đến backend; backend kiểm tra dữ liệu, xử lý xác thực rồi trả kết quả. Frontend không truy cập trực tiếp MySQL mà chỉ làm việc với API được backend cung cấp.

### 2.1.4. Xác thực, JWT và phân quyền RBAC

**Xác thực (authentication)** xác định người đang gửi yêu cầu là ai. **Phân quyền (authorization)** xác định người đó được phép thực hiện hành động nào.

JSON Web Token (JWT) là định dạng biểu diễn một tập claim được truyền giữa các bên. VaxCare sử dụng JWT có chữ ký để bên nhận kiểm tra tính toàn vẹn và thời hạn của token. JWT dạng có chữ ký không đồng nghĩa với dữ liệu được mã hóa, vì vậy không nên đưa thông tin bí mật vào payload. Chuẩn JWT định nghĩa các dạng biểu diễn dựa trên JWS và JWE [1].

VaxCare dùng token để xác thực các API cần đăng nhập. Hệ thống có các vai trò như `USER`, `MEDICAL_STAFF` và `ADMIN`. Cách tiếp cận này thuộc nhóm kiểm soát truy cập dựa trên vai trò (Role-Based Access Control – RBAC): quyền truy cập được xác định từ vai trò của tài khoản, đồng thời một số thao tác còn cần kiểm tra phạm vi dữ liệu, chẳng hạn cơ sở làm việc của nhân viên.

Kiểm tra quyền phải được thực hiện ở backend. Việc ẩn một trang hoặc nút ở frontend chỉ hỗ trợ giao diện, không thay thế kiểm tra quyền trên API.

### 2.1.5. Cơ sở dữ liệu quan hệ và giao dịch

Cơ sở dữ liệu quan hệ tổ chức dữ liệu thành các bảng; mỗi bảng biểu diễn một nhóm thực thể. Khóa chính định danh một dòng dữ liệu, còn khóa ngoại thể hiện quan hệ giữa các bảng. Ràng buộc dữ liệu giúp hạn chế các bản ghi không hợp lệ hoặc không nhất quán.

Trong VaxCare, MySQL lưu các nhóm dữ liệu như tài khoản, cơ sở, vắc xin, lịch hẹn, thanh toán, hồ sơ tiêm và lô vắc xin. Backend ánh xạ các bảng thành entity thông qua Spring Data JPA. Các thao tác gồm nhiều bước liên quan có thể được đặt trong transaction để bảo đảm thay đổi được thực hiện đồng bộ theo chính sách của nghiệp vụ.

### 2.1.6. Học máy có giám sát và hồi quy

Trong học máy có giám sát, mô hình học mối quan hệ giữa các đặc trưng đầu vào và kết quả mục tiêu từ dữ liệu đã có nhãn. Với bài toán hồi quy, kết quả mục tiêu là một giá trị số, chẳng hạn số phút chờ hoặc số lượng liều dự báo.

Quy trình tổng quát gồm:

1. Thu thập và kiểm tra dữ liệu.
2. Chọn đặc trưng đầu vào và biến mục tiêu.
3. Huấn luyện mô hình trên dữ liệu huấn luyện.
4. Đánh giá trên dữ liệu chưa dùng để huấn luyện.
5. Lưu mô hình và dùng mô hình để suy luận trên dữ liệu mới.

Kết quả mô hình phụ thuộc chất lượng, phạm vi và tính đại diện của dữ liệu. Với dữ liệu chuỗi thời gian, việc đánh giá cần giữ đúng thứ tự thời gian để hạn chế sử dụng thông tin tương lai trong quá trình dự báo.

### 2.1.7. Dự báo chuỗi thời gian

Chuỗi thời gian là tập hợp quan sát được sắp xếp theo thời gian. Mục tiêu của dự báo là sử dụng các giá trị đã biết để ước lượng giá trị ở những thời điểm tiếp theo.

Các đặc trưng phổ biến cho dự báo gồm:

- **Lag:** giá trị ở một số thời điểm trước đó, ví dụ ngày trước hoặc cùng ngày của tuần trước.
- **Rolling mean:** trung bình của một cửa sổ thời gian gần nhất.
- **Đặc trưng lịch:** thứ trong tuần, tháng hoặc cuối tuần.

Với dự báo nhiều bước, mô hình có thể dự báo lần lượt từng ngày; kết quả dự báo của bước trước được bổ sung vào chuỗi để tạo đặc trưng cho bước kế tiếp. Cách này được gọi là dự báo đệ quy và sai số có thể tích lũy qua các bước. Vì vậy, kết quả cần được xem là ước lượng hỗ trợ lập kế hoạch, không phải số lượng chắc chắn.

### 2.1.8. Chatbot, phân loại ý định và RAG

Chatbot cần xác định mục đích câu hỏi để chọn cách xử lý phù hợp. Phân loại ý định (intent classification) gán câu hỏi vào một nhóm, chẳng hạn hỏi về vắc xin, lịch tiêm, lịch sử tiêm, điều hướng trên VaxCare hoặc nội dung ngoài phạm vi.

Retrieval-Augmented Generation (RAG) kết hợp truy xuất tài liệu với mô hình ngôn ngữ để tạo câu trả lời dựa trên ngữ cảnh được truy xuất [12]:

1. Hệ thống tìm các đoạn tài liệu liên quan đến câu hỏi.
2. Các đoạn phù hợp được đưa vào ngữ cảnh.
3. Mô hình ngôn ngữ tạo câu trả lời dựa trên câu hỏi và ngữ cảnh đó.

Truy xuất có thể sử dụng độ tương đồng ngữ nghĩa, tìm kiếm từ khóa hoặc kết hợp nhiều phương pháp. Câu trả lời vẫn cần được giới hạn bởi nguồn dữ liệu và quy tắc an toàn; mô hình ngôn ngữ có thể tạo nội dung không chính xác nếu thiếu căn cứ.

Trong VaxCare, chatbot kết hợp phân loại intent, rule xử lý nghiệp vụ/an toàn, truy xuất tri thức và thành phần LLM tùy cấu hình. Memory hội thoại hỗ trợ xử lý câu hỏi tiếp nối trong một phiên. Chatbot không thay thế nhân viên y tế và cần từ chối các yêu cầu chẩn đoán, kê đơn hoặc xử trí cấp cứu.

## 2.2. Công nghệ sử dụng

### 2.2.1. React, Vite và React Router

**React** là thư viện xây dựng giao diện theo component. Mỗi component có thể đảm nhiệm một phần giao diện và được kết hợp để tạo trang hoàn chỉnh. React hỗ trợ cập nhật giao diện theo trạng thái ứng dụng [3].

**Vite** cung cấp môi trường phát triển frontend và công cụ build tài nguyên cho bản triển khai [4]. **React Router** quản lý các đường dẫn và điều hướng giữa các trang. Trong VaxCare, các trang được tổ chức theo khu vực công khai, người dân, nhân viên và quản trị viên.

### 2.2.2. Java và Spring Boot

**Java 21** là ngôn ngữ triển khai backend. **Spring Boot** cung cấp cơ chế cấu hình và khởi chạy ứng dụng [5]; các module Spring được dùng để xây dựng API, bảo mật, truy cập dữ liệu và gửi email.

Các thành phần đáng chú ý trong backend VaxCare:

- **Spring Web:** xây dựng REST API.
- **Spring Security:** xác thực và áp dụng quy tắc truy cập [6].
- **Spring Data JPA:** thao tác với dữ liệu quan hệ thông qua repository/entity [7].
- **Spring Validation:** kiểm tra dữ liệu đầu vào.
- **WebClient:** gọi HTTP đến AI service.
- **Spring WebSocket:** hỗ trợ giao tiếp realtime.

### 2.2.3. Python, FastAPI và Pydantic

**Python** được dùng cho dịch vụ AI. **FastAPI** khai báo các endpoint HTTP và tạo tài liệu API tương tác dựa trên schema [8]. **Pydantic** kiểm tra và chuyển đổi dữ liệu request/response theo kiểu đã khai báo.

Việc tách AI thành ứng dụng FastAPI giúp các API AI không phụ thuộc trực tiếp vào vòng đời của backend Java. Backend giao tiếp với dịch vụ này qua HTTP/JSON.

### 2.2.4. MySQL

**MySQL 8** là hệ quản trị cơ sở dữ liệu quan hệ được sử dụng trong dự án [9]. Schema VaxCare gồm các bảng về tài khoản, cơ sở, vắc xin, lịch hẹn, thanh toán, hồ sơ, tồn kho, thông báo và chatbot. Khóa chính, khóa ngoại và các ràng buộc trong schema mô tả quan hệ giữa các dữ liệu.

Backend dùng JPA/Hibernate để ánh xạ entity với schema. Cấu hình kiểm tra schema giúp phát hiện khác biệt giữa entity và cấu trúc database khi khởi động.

### 2.2.5. Joblib, scikit-learn và XGBoost

**scikit-learn** cung cấp các công cụ xử lý dữ liệu và mô hình học máy [10]. **XGBoost** là thư viện gradient boosting trên cây quyết định, có thể dùng cho bài toán phân loại hoặc hồi quy [11]. **Joblib** được dùng để lưu và nạp các artifact mô hình Python.

Artifact cần được nạp trong môi trường tương thích với phiên bản thư viện dùng khi huấn luyện. Khi thay đổi phiên bản Python hoặc thư viện, cần kiểm tra lại khả năng nạp model và đánh giá kết quả thay vì mặc định coi các phiên bản là tương thích.

### 2.2.6. JWT, mã QR và các tích hợp

- **JJWT:** thư viện backend dùng để tạo và kiểm tra JWT.
- **ZXing:** thư viện tạo/đọc mã QR trong các luồng cần mã hóa tham chiếu.
- **VNPay/ZaloPay:** cổng thanh toán được backend tích hợp qua API và callback; hoạt động phụ thuộc cấu hình merchant và môi trường tương ứng.
- **SMTP:** gửi email khi máy chủ mail và thông tin xác thực được cấu hình.
- **WebSocket/STOMP:** hỗ trợ trao đổi sự kiện realtime giữa server và giao diện.
- **Apache PDFBox:** thư viện tạo tệp PDF.

Các tích hợp bên ngoài cần được cấu hình và kiểm thử trong môi trường phù hợp. Việc có thư viện hoặc mã tích hợp trong dự án không đồng nghĩa dịch vụ bên ngoài đã được cấu hình để vận hành thực tế.

## 2.3. Ứng dụng công nghệ AI trong VaxCare

### 2.3.1. AI1 – Gợi ý khung giờ tiêm

AI1 nhận thông tin về ngày dự kiến, giờ hoạt động, sức chứa, số lượt đã đặt và thống kê lịch sử theo khung giờ. Các đặc trưng sử dụng trong service gồm ngày trong tuần, cuối tuần, ngày lễ, giờ, sức chứa, số lượt đặt và tỷ lệ sử dụng sức chứa.

Khi có artifact mô hình, service ước lượng thời gian chờ. Sau đó, các khung giờ được xếp hạng theo thời gian chờ ước lượng, xác suất quá tải và thứ tự thời gian; một số khung giờ phù hợp được đánh dấu gợi ý. Nếu không có model, service có thể dùng heuristic dựa trên tỷ lệ sử dụng sức chứa.

Kết quả là gợi ý điều phối dựa trên dữ liệu đầu vào, không phải cam kết thời gian chờ thực tế.

### 2.3.2. AI2 – Dự báo nhu cầu vắc xin

AI2 nhận dữ liệu tiêu thụ lịch sử theo ngày và tạo các đặc trưng trễ, trung bình trượt cùng đặc trưng lịch. Nếu model đã huấn luyện có sẵn và dữ liệu lịch sử đáp ứng cấu hình tối thiểu, service dự báo từng ngày theo cách đệ quy rồi gom kết quả thành các giai đoạn.

Trong trường hợp model không khả dụng hoặc dữ liệu chưa đủ, service có thể dùng heuristic dựa trên mức tiêu thụ gần đây và đặc điểm theo ngày trong tuần. Khoảng dự báo và mức tin cậy trả về là ước lượng theo cách triển khai hiện tại, cần được đánh giá với dữ liệu thực tế trước khi dùng cho quyết định nhập kho.

### 2.3.3. Chatbot hỗ trợ tra cứu

Luồng chatbot có thể gồm các bước:

1. Kiểm tra câu hỏi theo quy tắc an toàn.
2. Phân tích intent và các thực thể như tuổi hoặc loại vắc xin.
3. Chọn handler: rule, tra cứu lịch sử/ngữ cảnh, tìm kiếm tài liệu hoặc trả lời hội thoại.
4. Kết hợp ngữ cảnh liên quan và LLM khi handler cần.
5. Trả lời kèm thông tin nguồn/action phù hợp nếu có.

Chất lượng câu trả lời phụ thuộc dữ liệu tri thức, model intent, cấu hình truy xuất và LLM. Các nội dung y khoa phải được trình bày như thông tin tham khảo, có giới hạn rõ ràng và không thay thế đánh giá của nhân viên y tế.

## 2.4. Lý do lựa chọn công nghệ

| Công nghệ/thành phần | Vai trò trong VaxCare | Lý do phù hợp với phạm vi đồ án |
|---|---|---|
| React + Vite | Giao diện web | Tổ chức giao diện theo component, phát triển và build frontend độc lập. |
| Spring Boot | Backend nghiệp vụ | Hỗ trợ xây dựng API, bảo mật, truy cập dữ liệu và tích hợp thư viện Java. |
| FastAPI | AI service | Tạo API Python độc lập, có schema request/response và tài liệu API tự động. |
| MySQL | Lưu trữ dữ liệu | Phù hợp với dữ liệu có cấu trúc và các quan hệ giữa nghiệp vụ. |
| XGBoost và scikit-learn | Model AI | Hỗ trợ thử nghiệm các bài toán hồi quy/dự báo trên dữ liệu có cấu trúc. |
| HTTP/JSON | Giao tiếp giữa dịch vụ | Định dạng phổ biến, dễ tích hợp giữa JavaScript, Java và Python. |

Việc lựa chọn công nghệ nhằm đáp ứng yêu cầu của đồ án; đây không phải kết luận rằng các công nghệ trên luôn tối ưu cho mọi quy mô hoặc môi trường triển khai.