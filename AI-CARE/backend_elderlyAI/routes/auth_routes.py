"""
Authentication Routes (Login, Register, /auth/me, Password Management)
ElderlyCare AI System
"""

from flask import Blueprint, jsonify, request, g
from services.auth_service import AuthService, update_user_profile, change_user_password
from middleware.auth_middleware import require_auth, get_current_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Đăng ký tài khoản bảo mật mới"""
    data = request.get_json(silent=True) or {}
    res, status_code = AuthService.register(data)
    return jsonify(res), status_code


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Đăng nhập bằng Username / Email & Mật khẩu đã mã hóa"""
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    res, status_code = AuthService.login(username, password)
    return jsonify(res), status_code


@auth_bp.route("/auth/me", methods=["GET"])
@require_auth
def get_current_user_profile():
    """
    Lấy thông tin tài khoản người dùng đang đăng nhập dựa trên JWT Token được verify.
    Tuyệt đối không trả user ngẫu nhiên.
    """
    user = g.current_user
    res = AuthService.get_me(user)
    return jsonify(res), 200


@auth_bp.route("/auth/profile", methods=["PUT"])
@require_auth
def update_profile():
    """Cập nhật thông tin cá nhân người dùng đang đăng nhập"""
    data = request.get_json(silent=True) or {}
    user = g.current_user
    res, status_code = update_user_profile(user.user_id, data)
    return jsonify(res), status_code


@auth_bp.route("/auth/change-password", methods=["POST"])
@require_auth
def change_password():
    """Đổi mật khẩu tài khoản đang đăng nhập"""
    data = request.get_json(silent=True) or {}
    user = g.current_user
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    res, status_code = change_user_password(user.user_id, current_password, new_password)
    return jsonify(res), status_code


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """Đăng xuất an toàn khỏi hệ thống"""
    return jsonify({
        "success": True,
        "message": "Đã đăng xuất an toàn khỏi hệ thống."
    }), 200
