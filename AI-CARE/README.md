# 📖 HƯỚNG DẪN THIẾT LẬP DỰ ÁN ELDERLYCARE AI TRÊN MÁY TÍNH MỚI

Tài liệu này hướng dẫn chi tiết từng bước từ một máy tính hoàn toàn mới (Fresh Machine) sau khi clone mã nguồn từ GitHub để khởi chạy trọn vẹn toàn bộ hệ thống ElderlyCare AI mà không gặp bất kỳ lỗi thiếu môi trường hoặc thiếu dữ liệu nào.

---

## 📋 MỤC LỤC 14 BƯỚC THIẾT LẬP

1. [Clone mã nguồn từ Git Repository](#1-clone-mã-nguồn-từ-git-repository)
2. [Cài đặt Python (Phiên bản 3.10 trở lên)](#2-cài-đặt-python)
3. [Cài đặt Node.js & npm (Node 18 trở lên)](#3-cài-đặt-nodejs--npm)
4. [Tạo Virtual Environment & Cài đặt Dependencies Backend](#4-cài-đặt-backend-dependencies)
5. [Cài đặt Dependencies Frontend](#5-cài-đặt-frontend-dependencies)
6. [Tạo File Cấu Hình .env](#6-tạo-file-cấu-hình-env)
7. [Lựa Chọn Cơ Sở Dữ Liệu (SQLite Tự Động hoặc MySQL)](#7-lựa-chọn-cơ-sở-dữ-liệu)
8. [Import Cấu Trúc Database Schema (Nếu dùng MySQL)](#8-import-database-schema)
9. [Import Dữ Liệu Mẫu Seed & Demo Data](#9-import-dữ-liệu-mẫu-demo)
10. [Cấu Hình Khóa Google Gemini AI API](#10-cấu-hình-gemini-ai)
11. [Khởi Chạy Backend Server (Flask)](#11-khởi-chạy-backend-server)
12. [Khởi Chạy Frontend Server (React + Vite)](#12-khởi-chạy-frontend-server)
13. [Kiểm Tra System Health Check Endpoint](#13-kiểm-tra-system-health-check)
14. [Kiểm Thử Chatbot AI & Các Tính Năng Quản Trị](#14-kiểm-thử-chatbot-ai)

---

### 1. Clone Mã Nguồn Từ Git Repository
Mở Terminal / PowerShell và clone dự án về máy:
```bash
git clone https://github.com/luongduc2004ls-beep/AI-CARE.git
cd AI-CARE
```

---

### 2. Cài Đặt Python
- Đảm bảo máy tính đã cài đặt Python 3.10+ (Khuyến nghị Python 3.11, 3.12, 3.13 hoặc 3.14).
- Kiểm tra phiên bản:
```bash
python --version
```

---

### 3. Cài Đặt Node.js & npm
- Cài đặt Node.js phiên bản LTS từ [nodejs.org](https://nodejs.org/).
- Kiểm tra phiên bản:
```bash
node --version
npm --version
```

---

### 4. Cài Đặt Backend Dependencies
Di chuyển vào thư mục backend, tạo môi trường ảo Python và cài đặt thư viện:
```bash
cd backend_elderlyAI

# Tạo môi trường ảo (Virtual Environment)
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Trên Linux / macOS:
# source venv/bin/activate

# Cài đặt toàn bộ thư viện cần thiết:
pip install -r requirements.txt
```

---

### 5. Cài Đặt Frontend Dependencies
Mở cửa sổ Terminal mới, di chuyển vào thư mục frontend:
```bash
cd frontend_elderlyAI
npm install
```

---

### 6. Tạo File Cấu Hình .env
Tại thư mục `backend_elderlyAI`, sao chép file mẫu `.env.example` thành `.env`:
```bash
# Trên Windows PowerShell:
Copy-Item .env.example .env

# Trên Linux / macOS:
# cp .env.example .env
```

Nội dung file `.env`:
```env
# 1. Cơ sở dữ liệu
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ElderlyCareAI

# 2. Khóa bảo mật JWT
SECRET_KEY=elderly_ai_secret_key_jwt_secure_2026_salt_32bytes
JWT_SECRET_KEY=elderly_ai_secret_key_jwt_secure_2026_salt_32bytes

# 3. Google Gemini API (Tùy chọn kết nối API trực tiếp từ Google AI Studio)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash

# 4. Cấu hình Backend Server
FLASK_ENV=production
DEBUG=False
BACKEND_HOST=0.0.0.0
BACKEND_PORT=5000
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

---

### 7. Lựa Chọn Cơ Sở Dữ Liệu

#### 🟢 Cách 1 (Khuyến nghị - Không cần cài đặt MySQL):
- Mặc định hệ thống tự động sử dụng **SQLite** (`instance/elderly_ai.db`).
- **Auto-Seeder** sẽ tự động phát hiện CSDL mới, tạo toàn bộ 21 bảng và nạp 100% dữ liệu lâm sàng mẫu ngay lần đầu khởi chạy!

#### 🔵 Cách 2 (Dùng MySQL Server):
- Cài đặt MySQL Server / XAMPP.
- Đặt biến `USE_MYSQL=true` trong `.env`.
- Mở MySQL và tạo Database:
```sql
CREATE DATABASE ElderlyCareAI CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 8. Import Database Schema (Nếu dùng MySQL)
Nếu bạn chọn dùng MySQL, import cấu trúc bảng từ file:
```bash
mysql -u root -p ElderlyCareAI < database/schema.sql
```

---

### 9. Import Dữ Liệu Mẫu Demo (Nếu dùng MySQL)
Import dữ liệu mẫu bệnh nhân, bác sĩ, đơn thuốc, lịch uống thuốc, camera:
```bash
mysql -u root -p ElderlyCareAI < database/seed.sql
```

---

### 10. Cấu Hình Gemini AI
- Truy cập [Google AI Studio](https://aistudio.google.com/) để lấy API Key miễn phí.
- Điền vào `GEMINI_API_KEY` trong file `.env`.
- *Lưu ý: Nếu không có API Key, hệ thống vẫn hoạt động thông minh nhờ Hybrid Clinical Intelligence Engine tích hợp sẵn.*

---

### 11. Khởi Chạy Backend Server
Trong thư mục `backend_elderlyAI` (với virtualenv đã kích hoạt):
```bash
python app.py
```
👉 Backend API sẽ hoạt động tại: `http://127.0.0.1:5000/api`

---

### 12. Khởi Chạy Frontend Server
Trong thư mục `frontend_elderlyAI`:
```bash
npm run dev
```
👉 Truy cập giao diện người dùng tại: `http://localhost:5173`

---

### 13. Kiểm Tra System Health Check
Mở trình duyệt hoặc dùng lệnh curl để kiểm tra tình trạng 4 phân hệ:
```bash
curl http://127.0.0.1:5000/api/system/health
```
Kết quả trả về đạt chuẩn:
```json
{
  "success": true,
  "services": {
    "backend": "ok",
    "database": "ok",
    "gemini": "ok",
    "authentication": "ok"
  }
}
```

---

### 14. Kiểm Thử Chatbot AI

#### 🔑 Tài Khoản Đăng Nhập Mẫu:
- **Admin**: `admin1` / Mật khẩu: `password123`
- **Patient**: `user_pat10000` / Mật khẩu: `password123`

#### 💬 Câu Hỏi Thử Nghiệm Chatbot:
1. *"Xin chào"* -> Lời chào y tế cá nhân hóa.
2. *"PAT10000 đang uống thuốc gì?"* -> Trích xuất đơn thuốc Amlodipine 5mg từ CSDL.
3. *"Những bệnh nhân dị ứng phấn hoa?"* -> Trả về danh sách bệnh nhân dị ứng kèm phân trang.
4. *"Những bệnh nhân nguy cơ té ngã cao?"* -> Trả về danh sách chi tiết bệnh nhân nguy cơ ngã.
5. *"Có bao nhiêu bệnh nhân nguy cơ té ngã cao?"* -> Trả về con số thống kê ngắn gọn (706 bệnh nhân).
6. *"Bệnh nhân tiểu đường nên ăn gì?"* -> Tư vấn y khoa dinh dưỡng không cần mã bệnh nhân.
7. *"PAT10000 bị tiểu đường nên ăn gì?"* -> Kết hợp hồ sơ CSDL PAT10000 với tri thức y khoa.
