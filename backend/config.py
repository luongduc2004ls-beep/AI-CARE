import os
from urllib.parse import quote_plus

class Config:

    DB_USER = os.getenv("DB_USER", "root")

    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    DB_HOST = os.getenv("DB_HOST", "localhost")

    DB_NAME = os.getenv("DB_NAME", "ElderlyCareAI")

    DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
    
    if DB_TYPE == "sqlite":
        _sqlite_file = os.getenv("SQLITE_PATH", "data/elderly_ai.db")
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "SQLALCHEMY_DATABASE_URI",
            f"sqlite:///{_sqlite_file}"
        )
    else:
        _encoded_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "SQLALCHEMY_DATABASE_URI",
            f"mysql+pymysql://{DB_USER}:{_encoded_password}@{DB_HOST}/{DB_NAME}"
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
