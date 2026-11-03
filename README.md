# ADAPTIVE STUDENT SUPPORT AI
## HỆ THỐNG AI THÍCH ỨNG PHÁT HIỆN SỚM NGUY CƠ SUY GIẢM CHÚ Ý VÀ TRÌ HOÃN HỌC TẬP CỦA HỌC SINH THPT, ĐỀ XUẤT CAN THIỆP CÁ NHÂN HÓA

---

### 1. Giới thiệu & Tôn chỉ Sản phẩm
Hệ thống số ứng dụng trí tuệ nhân tạo thích ứng (Adaptive AI) hỗ trợ ra quyết định sư phạm, phát hiện sớm các chỉ báo hành vi học tập và xu hướng biến thiên so với **Baseline cá nhân** của từng học sinh THPT.

#### Nguyên tắc đạo đức cốt lõi:
- **KHÔNG chẩn đoán y khoa hoặc tâm lý học.**
- **KHÔNG gán nhãn học sinh** (Nghiêm cấm các từ: *lười, kém, thiếu ý thức, mất tập trung, bệnh lý*).
- **Ngôn ngữ chuẩn mực trung tính:**
  - *"Đang có dấu hiệu cần quan sát thêm"*
  - *"Có xu hướng giảm mức độ tham gia học tập"*
  - *"Có biểu hiện trì hoãn nhiệm vụ"*
  - *"Cần thêm dữ liệu để xác định xu hướng"*
  - *"Đề xuất giáo viên kiểm tra và hỗ trợ"*
- **Không so sánh đối đầu học sinh với nhau để xếp hạng tốt/xấu.** Luôn so sánh học sinh với chính lịch sử học tập của chính mình.
- **Human-in-the-loop:** AI phát hiện, giải thích và đề xuất; Giáo viên kiểm tra, quyết định và giám sát; AI học hỏi và điều chỉnh thích ứng từ phản hồi thực tế.

---

### 2. 7 Lớp Kiến trúc Hệ thống
1. **Thu thập dữ liệu:** Sổ điểm, bài tập về nhà, thời điểm nộp, số lần nhắc nhở, mức độ tương tác, tự đánh giá.
2. **Chuẩn hóa dữ liệu:** Thiết lập đường cơ sở (Personal Baseline) từ 3-4 tuần học đầu tiên.
3. **Phân tích xu hướng:** Phân tích chuỗi thời gian, lọc bỏ các sự kiện đơn lẻ (Single outliers).
4. **Phát hiện tín hiệu cảnh báo:** Phân loại 4 mức độ cảnh báo (Mức 0: Ổn định, Mức 1: Theo dõi, Mức 2: Cần hỗ trợ, Mức 3: Cần trao đổi).
5. **AI giải thích tín hiệu (Explainable AI):** Trả lời 6 câu hỏi minh bạch thông qua nút *"Tại sao tôi nhận được cảnh báo này?"*.
6. **Đề xuất can thiệp cá nhân hóa:** Động cơ vi phân nhiệm vụ 15 phút (Micro-tasks) và thiết lập nhịp bắt đầu sớm.
7. **Theo dõi kết quả sau hỗ trợ:** Đối chiếu số liệu định lượng Trước - Sau can thiệp.

---

### 3. Các Phân Hệ Chức Năng Chính
- **Dashboard Trung tâm:** Trả lời 6 câu hỏi sư phạm cốt lõi và 8 chỉ số tiến độ toàn diện.
- **Hồ sơ 360° Học sinh:** 12 thẻ phân tích chuyên sâu (Tổng quan, Tiến độ, Tham gia, Nhiệm vụ, Trì hoãn, Nhật ký quan sát, Tín hiệu, Kế hoạch hỗ trợ, Phản hồi, Tiến bộ, Mục tiêu cá nhân, Timeline).
- **Không gian Tự quản Học sinh:** Phiên tập trung (Focus Session Timer với đếm ngược và phản tư sau phiên) cùng phiếu tự kiểm tra hằng ngày ("Em tự kiểm tra tiến độ").
- **Trung tâm Chất lượng Dữ liệu:** Quản lý dữ liệu thiếu, ngăn chặn báo động giả khi chưa đủ 3 tuần tích lũy, nhập/xuất tệp CSV mẫu và bản sao lưu JSON toàn diện chuẩn Schema 1.2.0.
- **Trình Tạo Báo Cáo Sư Phạm:** Tách bạch rõ ràng giữa *Dữ liệu thực tế* và *Đề xuất của AI*, hỗ trợ in ấn và xuất file.
- **Thanh Lệnh Điều Hướng (Command Center):** Hỗ trợ tìm kiếm nhanh theo câu lệnh tự nhiên ("Bạn muốn làm gì?").
- **Nhật Ký Kiểm Toán (Audit Trail):** Ghi nhận đầy đủ vết hoạt động của Giáo viên, Học sinh và Hệ thống AI.
- **Bảo Vệ Quyền Riêng Tư (Privacy by Design):** Chế độ Ẩn danh (Privacy Mode) mã hóa tên học sinh thành mã HS01, HS02 khi trình chiếu hoặc gửi dữ liệu.

---

### 4. 5 Kịch bản Kiểm Thử Thực Tế
- **Tình huống 1 (HS01, HS02, HS05):** Dữ liệu ổn định, phong độ cao $\rightarrow$ Không có cảnh báo giả.
- **Tình huống 2 (HS03):** Một lần nộp muộn đơn lẻ do ốm $\rightarrow$ Hệ thống lọc bỏ, không cảnh báo giả.
- **Tình huống 3 (HS04, HS06):** Xu hướng giảm kéo dài 3 tuần liên tiếp $\rightarrow$ Kích hoạt cảnh báo Mức 2 và Mức 1.
- **Tình huống 4 (HS07):** Sau can thiệp vi phân bài tập 15 phút, dữ liệu phục hồi $\rightarrow$ Chuyển trạng thái "Đã cải thiện".
- **Tình huống 5 (HS08):** Học sinh mới chuyển lớp, dữ liệu dưới 3 tuần $\rightarrow$ Hệ thống yêu cầu bổ sung dữ liệu, không suy diễn sai lệch.

---

### 5. Khởi Chạy Dự Án
```bash
# Cài đặt thư viện
npm install

# Khởi chạy full-stack với Express & Gemini AI proxy
npm run dev

# Kiểm tra cú pháp và build sản phẩm
npm run lint
npm run build
```
