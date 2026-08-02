from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

from config import Config
from database import db

# Import Routes
from routes.medicine_routes import medicine_bp
from routes.dashboard_routes import dashboard_bp
from routes.patient_routes import patient_bp

# Import Error Handler
from middleware.exception import register_error

# ==========================
# Khoi tao Flask App
# ==========================
app = Flask(__name__)

# Load Config
app.config.from_object(Config)

# Khoi tao Database extension. Ket noi that chi dien ra khi co query.
db.init_app(app)
app.config["DATABASE_AVAILABLE"] = None

# Cho phep Frontend goi API
CORS(
    app,
    origins=Config.CORS_ORIGINS
)

# Dang ky Error Handler
register_error(app)

# Dang ky Routes
app.register_blueprint(medicine_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(patient_bp, url_prefix="/api")



def get_database_status():
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
    return {
        "project": "Elderly AI Backend",
        "version": "1.0",
        "status": "Running",
        "database": get_database_status()
    }


@app.route("/health")
def health():
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
