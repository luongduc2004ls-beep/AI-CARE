import os

class Config:

    DB_USER = os.getenv("DB_USER", "root")

    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    DB_HOST = os.getenv("DB_HOST", "localhost")

    DB_NAME = os.getenv("DB_NAME", "ElderlyCareAI")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = "elderly_ai_secret"

    JSON_SORT_KEYS = False

    BACKEND_HOST = os.getenv("BACKEND_HOST", "localhost")

    BACKEND_PORT = int(os.getenv("BACKEND_PORT", "5000"))

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
