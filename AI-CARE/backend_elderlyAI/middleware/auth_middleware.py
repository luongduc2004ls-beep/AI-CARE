"""
Authentication & Authorization Middleware (JWT & RBAC Guards)
ElderlyCare AI System
"""

import functools
from flask import request, jsonify, g
from services.auth_service import AuthService
from services.rbac_service import RBACService


def get_current_user():
    """
    Trích xuất và xác thực người dùng từ Bearer JWT Token.
    Kết quả được cache trong context `g.current_user`.
    """
    if hasattr(g, "current_user") and g.current_user is not None:
        return g.current_user

    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif auth_header:
        token = auth_header.strip()

    if not token:
        g.current_user = None
        return None

    user = AuthService.verify_token(token)
    g.current_user = user
    return user


def require_auth(f):
    """
    Decorator bắt buộc request phải có JWT Token hợp lệ.
    Trả về 401 Unauthorized nếu token thiếu, sai hoặc hết hạn.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Yêu cầu đăng nhập hoặc Token xác thực không hợp lệ/đã hết hạn."
                }
            }), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*allowed_roles):
    """
    Decorator kiểm tra vai trò người dùng (RBAC).
    Chỉ cho phép các vai trò được liệt kê truy cập.
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Yêu cầu xác thực tài khoản."
                    }
                }), 401

            user_role = RBACService.normalize_role(user.role)
            normalized_allowed = [RBACService.normalize_role(r) for r in allowed_roles]

            if "*" not in normalized_allowed and user_role not in normalized_allowed:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"Truy cập bị từ chối. Tài khoản vai trò '{user.role}' không có quyền thực hiện thao tác này."
                    }
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator


def require_admin(f):
    """
    Decorator chuyên biệt chỉ cho phép các vai trò Quản trị viên (SUPER_ADMIN, ADMIN, MEDICAL_ADMIN).
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Yêu cầu đăng nhập tài khoản Quản trị viên."
                }
            }), 401

        if not RBACService.is_admin_role(user.role):
            return jsonify({
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "403 Forbidden: Chỉ Quản trị viên và Bác sĩ mới có quyền truy cập tài nguyên này."
                }
            }), 403

        return f(*args, **kwargs)
    return decorated


def require_patient_access(patient_id_kwarg="patient_id"):
    """
    Decorator kiểm tra quyền truy cập dữ liệu bệnh nhân (Patient Scope Isolation).
    - Admin: Được phép truy cập tất cả bệnh nhân.
    - User/Patient/Caregiver: Chỉ được phép truy cập bệnh nhân được phân quyền.
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Yêu cầu đăng nhập."
                    }
                }), 401

            # Lấy target patient_id từ URL kwargs, query params hoặc request body
            target_pid = kwargs.get(patient_id_kwarg) or request.args.get(patient_id_kwarg)
            if not target_pid and request.is_json:
                data = request.get_json(silent=True) or {}
                target_pid = data.get(patient_id_kwarg) or data.get("patient_id") or data.get("patientId")

            if target_pid:
                is_authorized = RBACService.validate_patient_access(
                    user_id=user.user_id,
                    role=user.role,
                    target_patient_id=target_pid
                )
                if not is_authorized:
                    return jsonify({
                        "success": False,
                        "error": {
                            "code": "FORBIDDEN",
                            "message": f"403 Forbidden: Bạn không có quyền truy cập hồ sơ bệnh nhân '{target_pid}'."
                        }
                    }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
