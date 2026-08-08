from flask import Blueprint, jsonify, request
from services.auth_service import register_user, login_user, seed_default_users_if_empty, update_user_profile, change_user_password
from models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Đăng ký tài khoản bảo mật mới"""
    data = request.get_json() or {}
    res, status_code = register_user(data)
    return jsonify(res), status_code

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Đăng nhập bằng Username & Password"""
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    res, status_code = login_user(username, password)
    return jsonify(res), status_code

@auth_bp.route("/auth/me", methods=["GET"])
def get_current_user():
    """Lấy thông tin người dùng đang đăng nhập"""
    auth_header = request.headers.get("Authorization", "")
    seed_default_users_if_empty()

    user = User.query.first()
    if user:
        return jsonify({
            "success": True,
            "user": user.to_dict()
        }), 200

    return jsonify({
        "success": False,
        "message": "Chưa đăng nhập"
    }), 401

@auth_bp.route("/auth/profile", methods=["PUT"])
def update_profile():
    """Cập nhật thông tin cá nhân người dùng"""
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    res, status_code = update_user_profile(user_id, data)
    return jsonify(res), status_code

@auth_bp.route("/auth/change-password", methods=["POST"])
def change_password():
    """Đổi mật khẩu bảo mật"""
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    res, status_code = change_user_password(user_id, current_password, new_password)
    return jsonify(res), status_code

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """Đăng xuất tài khoản"""
    return jsonify({
        "success": True,
        "message": "Đã đăng xuất an toàn khỏi hệ thống"
    }), 200
