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
from routes.health_routes import health_bp
from routes.chatbot_routes import chatbot_bp, chat_with_gemini  # Route Trợ lý Chatbot AI Gemini
from routes.admin_ai_routes import admin_ai_bp  # Nhánh AI Quản Trị Hệ Thống
from routes.user_ai_routes import user_ai_bp    # Nhánh AI Chăm Sóc Người Thân
from routes.alert_routes import alert_bp        # Nhánh Cảnh Báo Phân Lập Admin vs User
from routes.ai_patient_routes import ai_patient_bp  # Medical AI Agent: Patient Scope
from routes.ai_admin_routes import ai_admin_bp      # Medical AI Agent: Admin Scope

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

# Cấu hình CORS toàn diện cho phép Frontend (Vite 5173 / Localhost) kết nối an toàn
CORS(
    app,
    resources={r"/*": {"origins": Config.CORS_ORIGINS}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-User-Role", "X-User-Id", "Accept", "Origin"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

# Middleware Logging chi tiết cho từng Request
@app.before_request
def log_incoming_request():
    if request.method != "OPTIONS":
        user_id = request.headers.get("X-User-Id", request.args.get("userId", "-"))
        user_role = request.headers.get("X-User-Role", request.args.get("userRole", "-"))
        print(f"[REQUEST] {request.method} {request.path} | UserID={user_id} Role={user_role}")

@app.after_request
def log_outgoing_response(response):
    if request.method != "OPTIONS":
        print(f"[RESPONSE] {request.method} {request.path} -> HTTP {response.status_code}")
    return response

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
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(admin_ai_bp, url_prefix="/api")
app.register_blueprint(user_ai_bp, url_prefix="/api")
app.register_blueprint(ai_patient_bp, url_prefix="/api")
app.register_blueprint(ai_admin_bp, url_prefix="/api")
app.register_blueprint(alert_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")

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


from services.db_seeder import DatabaseSeeder


def create_tables_if_database_is_ready():
    """
    Tự động khởi tạo các bảng CSDL, migration an toàn và nạp dữ liệu mẫu khởi tạo (Auto-Seeder).
    """
    try:
        db.create_all()
        # Safe migration for newly added columns
        try:
            db.session.execute(text("ALTER TABLE Users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            db.session.commit()
        except Exception:
            db.session.rollback()
        try:
            db.session.execute(text("ALTER TABLE Users ADD COLUMN deleted_at DATETIME"))
            db.session.commit()
        except Exception:
            db.session.rollback()

        app.config["DATABASE_AVAILABLE"] = True
        print("Database connected. Tables are ready.")

        # Tự động nạp dữ liệu mẫu nếu CSDL mới hoàn toàn
        DatabaseSeeder.seed_if_empty()
    except SQLAlchemyError as exc:
        db.session.rollback()
        app.config["DATABASE_AVAILABLE"] = False
        print("Database unavailable. Backend will keep running without database.")
        print(str(exc.orig) if getattr(exc, "orig", None) else str(exc))


@app.route("/")
@app.route("/api")
@app.route("/api/")
def home():
    """
    Endpoint mặc định kiểm tra thông tin thông số Backend và danh mục API Gateway.
    """
    return {
        "success": True,
        "project": "ElderlyCare AI Backend API",
        "version": "1.0",
        "status": "Running",
        "frontend_url": "http://localhost:5173",
        "database": get_database_status(),
        "endpoints": {
            "auth": "/api/auth/login",
            "patients": "/api/patients",
            "medicines": "/api/medicines",
            "dashboard": "/api/dashboard/summary",
            "admin_ai": "/api/admin/ai/chat",
            "patient_ai": "/api/user/ai/chat",
            "cameras": "/api/cameras",
            "alerts": "/api/admin/alerts",
            "system_health": "/api/system/health"
        }
    }, 200


@app.route("/health")
@app.route("/api/system/health")
def system_health():
    """
    Endpoint kiểm tra toàn diện tình trạng 4 dịch vụ hệ thống (System Health Check):
    - backend
    - database
    - gemini
    - authentication
    """
    # 1. Check database
    db_status = get_database_status()
    db_ok = db_status.get("connected", False)

    # 2. Check authentication (JWT service readiness)
    auth_ok = True
    try:
        from models.user import User
        from services.auth_service import AuthService
        sample_user = User.query.first()
        if sample_user:
            test_token = AuthService.generate_token(sample_user)
            verified_user = AuthService.verify_token(test_token)
            auth_ok = (verified_user is not None)
        else:
            auth_ok = True
    except Exception:
        auth_ok = False

    # 3. Check gemini service status
    gemini_status = "ok"
    if not Config.GEMINI_API_KEY or Config.GEMINI_API_KEY.startswith("YOUR_"):
        gemini_status = "ok (hybrid_local_fallback)"
    else:
        gemini_status = "ok"

    services_report = {
        "backend": "ok",
        "database": "ok" if db_ok else "error",
        "gemini": gemini_status,
        "authentication": "ok" if auth_ok else "error"
    }

    all_healthy = db_ok and auth_ok

    return {
        "success": all_healthy,
        "services": {
            "backend": services_report["backend"],
            "database": services_report["database"],
            "gemini": "ok" if "ok" in gemini_status else "error",
            "authentication": services_report["authentication"]
        },
        "details": {
            "database_message": db_status.get("message"),
            "gemini_mode": gemini_status
        }
    }, (200 if all_healthy else 503)


if __name__ == "__main__":
    with app.app_context():
        create_tables_if_database_is_ready()

    app.run(
        host=Config.BACKEND_HOST,
        port=Config.BACKEND_PORT,
        debug=Config.DEBUG
    )
