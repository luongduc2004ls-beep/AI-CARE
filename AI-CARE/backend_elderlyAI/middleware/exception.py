"""
Global JSON Error Handlers
ElderlyCare AI System
"""

from flask import jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException


def register_error(app):
    """
    Đăng ký bộ xử lý lỗi tập trung, đảm bảo 100% phản hồi từ API luôn là JSON chuẩn.
    Không bao giờ trả về HTML traceback cho client.
    """

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": getattr(error, "description", "Dữ liệu yêu cầu không hợp lệ.")
            }
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": getattr(error, "description", "Yêu cầu xác thực tài khoản / Token không hợp lệ.")
            }
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": getattr(error, "description", "403 Forbidden: Bạn không có quyền truy cập tài nguyên này.")
            }
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": getattr(error, "description", "Đường dẫn API hoặc tài nguyên không tồn tại.")
            }
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": f"Phương thức {request.method} không được hỗ trợ trên endpoint này."
            }
        }), 405

    @app.errorhandler(409)
    def conflict(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "CONFLICT",
                "message": getattr(error, "description", "Xung đột dữ liệu trong cơ sở dữ liệu.")
            }
        }), 409

    @app.errorhandler(422)
    def unprocessable_entity(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "UNPROCESSABLE_ENTITY",
                "message": getattr(error, "description", "Không thể xử lý nội dung yêu cầu.")
            }
        }), 422

    @app.errorhandler(SQLAlchemyError)
    def database_error(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Cơ sở dữ liệu đang bận hoặc gặp sự cố xử lý giao dịch."
            }
        }), 503

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau."
            }
        }), 500

    @app.errorhandler(Exception)
    def unhandled_exception(error):
        if isinstance(error, HTTPException):
            return jsonify({
                "success": False,
                "error": {
                    "code": error.name.upper().replace(" ", "_"),
                    "message": error.description
                }
            }), error.code
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Lỗi máy chủ xử lý tác vụ."
            }
        }), 500
