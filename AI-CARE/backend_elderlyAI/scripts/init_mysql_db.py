# ==============================================================================
# TẬP TIN TỰ ĐỘNG KHỞI TẠO CSDL MYSQL VÀ IMPORT FILE EXCEL (INIT_MYSQL_DB.PY)
# ==============================================================================

import os
import sys
from pathlib import Path
import pymysql
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

# Tải cấu hình môi trường từ file .env
load_dotenv(BASE_DIR / ".env")

def create_mysql_database_if_not_exists():
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "ElderlyCareAI_v2")

    print(f"🔄 Đang kết nối tới MySQL Server ({db_host}) để tạo CSDL '{db_name}'...")
    
    try:
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            charset='utf8mb4'
        )
        with connection.cursor() as cursor:
            sql = f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            cursor.execute(sql)
            print(f"✅ Đã đảm bảo CSDL '{db_name}' tồn tại trên MySQL!")
        connection.close()
    except Exception as e:
        print(f"⚠️ Lỗi khi kết nối/tạo CSDL MySQL: {e}")
        print("Vui lòng kiểm tra lại MySQL dịch vụ đã bật và thông tin user/password trong file .env")
        sys.exit(1)

def main():
    # 1. Tạo database nếu chưa có
    create_mysql_database_if_not_exists()

    from urllib.parse import quote_plus
    from app import app
    from database import db
    import models # import toàn bộ models để SQLAlchemy nhận diện

    # Đảm bảo URI kết nối được encode đúng ký tự đặc biệt trong mật khẩu (như %)
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "ElderlyCareAI_v2")
    encoded_pw = quote_plus(db_password) if db_password else ""
    app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{db_user}:{encoded_pw}@{db_host}/{db_name}"

    print("🔄 Đang tự động tạo toàn bộ các bảng trong MySQL...")
    with app.app_context():
        db.create_all()
        print("✅ Đã tạo thành công tất cả các bảng (Users, Medicines, HealthRecords, MedicineSchedules, Notifications, FallHistory, Cameras)!")

        # 3. Import dữ liệu từ file Excel mới
        from scripts.import_ai_care_dataset import import_dataset, DEFAULT_DATASET
        print(f"📊 Đang import dữ liệu từ file Excel: {DEFAULT_DATASET}...")
        
        try:
            summary = import_dataset(DEFAULT_DATASET)
            print("\n🎉 ===================================================")
            print("🎉 TÍCH HỢP VÀ IMPORT DỮ LIỆU THÀNH CÔNG RỰC RỠ!")
            print("🎉 ===================================================")
            for k, v in summary.items():
                print(f"   • {k}: {v} bản ghi")
        except Exception as e:
            print(f"❌ Lỗi khi import dữ liệu Excel: {e}")

if __name__ == "__main__":
    main()
