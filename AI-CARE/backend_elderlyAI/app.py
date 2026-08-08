from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

from config import Config
from database import db

# Import Routes danh mục dịch vụ hệ thống
from routes.medicine_routes import medicine_bp
from routes.dashboard_routes import dashboard_bp
from routes.patient_routes import patient_bp
from routes.camera_routes import camera_bp
from routes.notification_routes import notification_bp
from routes.auth_routes import auth_bp
from routes.chatbot_routes import chatbot_bp, chat_with_gemini  # Route Trợ lý Chatbot AI Gemini

# Import Error Handler trung tâm
from middleware.exception import register_error

# ==============================================================================
# Khởi tạo Ứng dụng Flask (Flask Application Initialization)
# ==============================================================================
app = Flask(__name__)

# Tải cấu hình từ lớp Config
app.config.from_object(Config)

# Khởi tạo tiện ích CSDL SQLAlchemy. Việc kết nối thực tế diễn ra khi thực hiện query.
db.init_app(app)
app.config["DATABASE_AVAILABLE"] = None

# Cấu hình CORS cho phép ứng dụng Frontend truy cập tài nguyên API
CORS(
    app,
    origins=Config.CORS_ORIGINS
)

# Đăng ký Bộ xử lý lỗi toàn cục (Global Exception Handler)
register_error(app)

# ==============================================================================
# Đăng ký Blueprints (Register API Routes)
# ==============================================================================
app.register_blueprint(medicine_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(patient_bp, url_prefix="/api")
app.register_blueprint(camera_bp, url_prefix="/api")
app.register_blueprint(notification_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")  # API Trợ lý Chatbot AI Google Gemini (/api/chatbot/chat)

# Đăng ký thêm Alias Endpoint /chat hỗ trợ khớp trực tiếp với component ChatbotWidget của bạn
@app.route("/chat", methods=["POST"])
def chat_direct_alias():
    """
    Alias Endpoint trực tiếp /chat để tương thích hoàn toàn với ChatbotWidget có sẵn của dự án.
    """
    return chat_with_gemini()


def get_database_status():
    """
    Kiểm tra trạng thái kết nối cơ sở dữ liệu MySQL/MariaDB.
    """
    try:
        db.session.execute(text("SELECT 1"))
        app.config["DATABASE_AVAILABLE"] = True
        return {
            "connected": True,
            "message": "Database connected"
        }
    except SQLAlchemyError as exc:
        db.session.rollback()
        app.config["DATABASE_AVAILABLE"] = False
        return {
            "connected": False,
            "message": "Database unavailable",
            "error": str(exc.orig) if getattr(exc, "orig", None) else str(exc)
        }


def create_tables_if_database_is_ready():
    """
    Tự động khởi tạo các bảng CSDL nếu kết nối MySQL đã sẵn sàng.
    """
    try:
        db.create_all()
        app.config["DATABASE_AVAILABLE"] = True
        print("Database connected. Tables are ready.")
    except SQLAlchemyError as exc:
        db.session.rollback()
        app.config["DATABASE_AVAILABLE"] = False
        print("Database unavailable. Backend will keep running without MySQL.")
        print(str(exc.orig) if getattr(exc, "orig", None) else str(exc))


@app.route("/")
def home():
    """
    Endpoint mặc định kiểm tra thông tin thông số Backend.
    """
    return {
        "project": "Elderly AI Backend",
        "version": "1.0",
        "status": "Running",
        "database": get_database_status(),
        "gemini_chatbot": "Ready at /api/chatbot/chat and /chat"
    }


@app.route("/health")
def health():
    """
    Endpoint kiểm tra tình trạng sức khỏe máy chủ (Health Check).
    """
    database = get_database_status()

    return {
        "success": True,
        "status": "Running",
        "database": database
    }, 200 if database["connected"] else 503


if __name__ == "__main__":
    with app.app_context():
        create_tables_if_database_is_ready()

    app.run(
        host=Config.BACKEND_HOST,
        port=Config.BACKEND_PORT,
        debug=True
    )
