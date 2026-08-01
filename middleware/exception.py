# ==========================================================
# exception.py
# Xử lý ngoại lệ chung cho toàn bộ hệ thống
# ==========================================================

from __future__ import annotations

import logging
import traceback

from flask import Flask

from middleware.response import ResponseBuilder

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)

logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s | %(levelname)s | %(message)s"

)


# ==========================================================
# Đăng ký xử lý Exception cho Flask
# ==========================================================

def register_exception_handler(app: Flask) -> None:
    """
    Đăng ký xử lý ngoại lệ toàn cục.
    """

    @app.errorhandler(Exception)
    def handle_exception(error):
        """
        Xử lý tất cả Exception chưa được bắt.
        """

        logger.error(str(error))

        logger.error(traceback.format_exc())

        return ResponseBuilder.internal_server_error(
            message="Đã xảy ra lỗi trong hệ thống."
        )


# ==========================================================
# Hàm ghi Log Exception
# ==========================================================

def log_exception(error: Exception) -> None:
    """
    Ghi log ngoại lệ.
    """

    logger.error(str(error))

    logger.error(traceback.format_exc())
