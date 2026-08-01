# ==========================================================
# app.py
# Điểm khởi chạy chính của ứng dụng Backend AI CARE
# Chịu trách nhiệm:
#     - Khởi tạo ứng dụng Flask
#     - Cấu hình Database, CORS, Middleware
#     - Đăng ký toàn bộ Route Blueprints
#     - Tự động tạo bảng Database nếu chưa tồn tại
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any

from flask import Flask
from flask_cors import CORS

from config import Config
from database import db
from middleware.exception import register_exception_handler
from middleware.response import ResponseBuilder

# Import tất cả Models để SQLAlchemy nhận diện khi create_all
from models.health_record import HealthRecord
from models.medicine import Medicine
from models.notification import Notification
from models.patient import Patient

# Import các Route Blueprints
from routes.ai_routes import ai_bp
from routes.dashboard_routes import dashboard_bp
from routes.health_routes import health_bp
from routes.medicine_routes import medicine_bp
from routes.notification_routes import notification_bp
from routes.patient_routes import patient_bp

# ==========================================================
# Cấu hình Logging toàn hệ thống
# ==========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


# ==========================================================
# Hàm tạo và cấu hình ứng dụng Flask (App Factory)
# ==========================================================

def create_app() -> Flask:
    """
    Khởi tạo và cấu hình Flask Application.

    Returns:
        Flask: Đối tượng ứng dụng Flask đã được khởi tạo hoàn chỉnh.
    """
    flask_app = Flask(__name__)

    # Load cấu hình ứng dụng từ Config
    flask_app.config.from_object(Config)

    # Đăng ký xử lý ngoại lệ toàn cục
    register_exception_handler(flask_app)

    # Cấu hình CORS cho phép ReactJS Frontend truy cập API
    CORS(
        flask_app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Khởi tạo SQLAlchemy với Flask App
    db.init_app(flask_app)

    # Đăng ký các Blueprints vào ứng dụng
    flask_app.register_blueprint(medicine_bp)
    flask_app.register_blueprint(patient_bp)
    flask_app.register_blueprint(health_bp)
    flask_app.register_blueprint(notification_bp)
    flask_app.register_blueprint(dashboard_bp)
    flask_app.register_blueprint(ai_bp)

    # ======================================================
    # Route kiểm tra trạng thái Backend
    # GET /
    # ======================================================
    @flask_app.route("/", methods=["GET"])
    def index() -> Any:
        """
        Route mặc định kiểm tra sức khỏe và trạng thái hoạt động của Backend.

        Returns:
            Response JSON từ ResponseBuilder.
        """
        return ResponseBuilder.success(
            message="Hệ thống Backend AI CARE hoạt động bình thường",
            data={
                "project": "AI CARE – Hệ thống hỗ trợ người cao tuổi",
                "version": "1.0.0",
                "status": "Running",
                "environment": "Production-Ready"
            }
        )

    return flask_app


# ==========================================================
# Khởi tạo đối tượng app chính
# ==========================================================

app = create_app()


# ==========================================================
# Khởi chạy máy chủ Flask
# ==========================================================

if __name__ == "__main__":
    logger.info("Đang khởi tạo các bảng Database trong MySQL...")
    with app.app_context():
        db.create_all()
        logger.info("Khởi tạo Database thành công!")

    logger.info("Đang khởi chạy Flask Server trên http://0.0.0.0:5000...")
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )