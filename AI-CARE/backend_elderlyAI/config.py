# ==============================================================================
# TẬP TIN CẤU HÌNH HỆ THỐNG BACKEND ELDERLY AI (CONFIG.PY)
# ==============================================================================
# Tập tin này quản lý tất cả các tham số môi trường, kết nối Cơ sở dữ liệu,
# thông tin bảo mật và các khóa API kết nối dịch vụ bên ngoài (Google Gemini API).
# ==============================================================================

import os
from urllib.parse import quote_plus

class Config:
    """
    Lớp chứa cấu hình trung tâm cho toàn bộ Flask Backend Application.
    """
    
    # --------------------------------------------------------------------------
    # Cấu hình Cơ sở dữ liệu MySQL / MariaDB
    # --------------------------------------------------------------------------
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "ElderlyCareAI")

    encoded_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

    # Đường dẫn URI kết nối CSDL sử dụng PyMySQL làm driver
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}"
    )

    # Tắt tính năng theo dõi biến đổi đối tượng của SQLAlchemy để tối ưu hiệu năng
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Khóa bí mật dùng để mã hóa Session và JWT Tokens
    SECRET_KEY = os.getenv("SECRET_KEY", "elderly_ai_secret_key_2026")

    # Giữ nguyên thứ tự các key trong dữ liệu JSON trả về
    JSON_SORT_KEYS = False

    # --------------------------------------------------------------------------
    # Cấu hình Máy chủ Flask (Backend Server)
    # --------------------------------------------------------------------------
    BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT = int(os.getenv("BACKEND_PORT", "5000"))

    # Cấu hình CORS cho phép các domain Frontend kết nối
    CORS_ORIGINS = "*"

    # --------------------------------------------------------------------------
    # Cấu hình Google Gemini AI API
    # --------------------------------------------------------------------------
    # Khóa API để truy vấn Google Gemini AI Studio
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # Tên mô hình Gemini tiêu chuẩn (mặc định dùng gemini-1.5-flash tương thích 100% với REST API v1beta)
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
