"""
Authentication Service (JWT Generation, Verification & User Management)
ElderlyCare AI System
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
from models.user import User
from config import Config
from services.rbac_service import RBACService


class AuthService:
    """
    Dịch vụ xử lý Xác thực, Mã hóa JWT và Quản lý Người dùng.
    """

    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = 168  # 7 ngày

    @classmethod
    def get_jwt_secret(cls) -> str:
        return Config.SECRET_KEY or "elderly_ai_secret_key_jwt_secure_2026"

    @classmethod
    def generate_token(cls, user: User) -> str:
        """
        Tạo mã JWT Token có chữ ký số bảo mật và thời hạn hết hạn rõ ràng.
        """
        payload = {
            "sub": str(user.user_id),
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role or "User",
            "patient_code": user.patient_code,
            "full_name": user.full_name,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=cls.JWT_EXPIRATION_HOURS)
        }
        return jwt.encode(payload, cls.get_jwt_secret(), algorithm=cls.JWT_ALGORITHM)

    @classmethod
    def verify_token(cls, token: str) -> Optional[User]:
        """
        Xác thực chữ ký và thời hạn của JWT Token, sau đó tải User từ Database.
        """
        if not token:
            return None
        try:
            payload = jwt.decode(token, cls.get_jwt_secret(), algorithms=[cls.JWT_ALGORITHM])
            user_id = payload.get("user_id") or payload.get("sub")
            if not user_id:
                return None
            user = db.session.get(User, int(user_id))
            if user and (user.is_active is None or user.is_active is True):
                return user
            return None
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
            return None

    @classmethod
    def decode_token_payload(cls, token: str) -> Optional[Dict[str, Any]]:
        """
        Giải mã payload của token (nếu hợp lệ).
        """
        try:
            return jwt.decode(token, cls.get_jwt_secret(), algorithms=[cls.JWT_ALGORITHM])
        except Exception:
            return None

    @classmethod
    def login(cls, username_or_email: str, password: str) -> Tuple[Dict[str, Any], int]:
        """
        Đăng nhập bằng username/email và mật khẩu đã hash an toàn.
        """
        uname = (username_or_email or "").strip()
        pwd = (password or "").strip()

        if not uname or not pwd:
            return {
                "success": False,
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu."
                }
            }, 400

        user = User.query.filter(
            (User.username == uname) | (User.email == uname) | (User.patient_code == uname)
        ).first()

        if not user:
            if uname.lower() in ("user1", "user_1", "patient1"):
                user = User.query.filter((User.user_id == 1) | (User.patient_code == "PAT10000")).first()
            elif uname.lower() in ("user2", "user_2", "patient2"):
                user = User.query.filter((User.user_id == 2) | (User.patient_code == "PAT10001")).first()
            elif uname.lower().startswith("pat"):
                user = User.query.filter(User.patient_code.ilike(uname)).first()

        if not user:
            return {
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Tên đăng nhập hoặc mật khẩu không chính xác."
                }
            }, 401

        # Xác thực mật khẩu qua Werkzeug check_password_hash
        is_valid = user.check_password(pwd)
        if not is_valid:
            return {
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Tên đăng nhập hoặc mật khẩu không chính xác."
                }
            }, 401

        token = cls.generate_token(user)
        user_dict = user.to_dict()
        user_dict["permissions"] = RBACService.get_authorized_patient_ids_for_user(user.user_id, user.role)

        return {
            "success": True,
            "message": f"Đăng nhập thành công! Xin chào {user.full_name}.",
            "token": token,
            "user": user_dict
        }, 200

    @classmethod
    def register(cls, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Đăng ký tài khoản mới với mật khẩu được băm (hash) chuẩn mật mã.
        """
        username = (data.get("username") or "").strip()
        password = (data.get("password") or "").strip()
        email = (data.get("email") or "").strip()
        full_name = (data.get("full_name") or username).strip()
        role = data.get("role", "User")
        phone = data.get("phone", "")

        if not username or not password:
            return {
                "success": False,
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Tên đăng nhập và mật khẩu là bắt buộc."
                }
            }, 400

        if len(password) < 6:
            return {
                "success": False,
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Mật khẩu phải chứa ít nhất 6 ký tự."
                }
            }, 400

        existing = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing:
            return {
                "success": False,
                "error": {
                    "code": "CONFLICT",
                    "message": "Tên đăng nhập hoặc Email đã được đăng ký trên hệ thống."
                }
            }, 409

        try:
            new_user = User(
                username=username,
                email=email if email else None,
                full_name=full_name,
                role=role,
                phone=phone,
                patient_code=f"PAT_{username.upper()}_{int(datetime.utcnow().timestamp())}",
                created_at=datetime.utcnow()
            )
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()

            token = cls.generate_token(new_user)
            return {
                "success": True,
                "message": "Đăng ký tài khoản thành công!",
                "token": token,
                "user": new_user.to_dict()
            }, 201
        except Exception as exc:
            db.session.rollback()
            return {
                "success": False,
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": f"Không thể lưu tài khoản: {str(exc)}"
                }
            }, 500

    @classmethod
    def get_me(cls, user: User) -> Dict[str, Any]:
        """
        Trả về thông tin chi tiết người dùng đã xác thực và danh sách quyền hạn.
        """
        user_dict = user.to_dict()
        user_dict["permissions"] = RBACService.get_authorized_patient_ids_for_user(user.user_id, user.role)
        return {
            "success": True,
            "user": user_dict
        }


# Helper functions duy trì tương thích
def register_user(data):
    return AuthService.register(data)

def login_user(username, password):
    return AuthService.login(username, password)

def update_user_profile(user_id, data):
    try:
        user = db.session.get(User, int(user_id)) if str(user_id).isdigit() else None
        if not user:
            return {"success": False, "error": {"code": "NOT_FOUND", "message": "Không tìm thấy người dùng"}}, 404
        for f in ["full_name", "email", "phone", "emergency_contact", "address"]:
            if f in data:
                setattr(user, f, str(data[f]).strip())
        db.session.commit()
        return {"success": True, "message": "Cập nhật hồ sơ thành công", "user": user.to_dict()}, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "error": {"code": "DATABASE_ERROR", "message": str(e)}}, 500

def change_user_password(user_id, current_pwd, new_pwd):
    try:
        user = db.session.get(User, int(user_id)) if str(user_id).isdigit() else None
        if not user:
            return {"success": False, "error": {"code": "NOT_FOUND", "message": "Không tìm thấy người dùng"}}, 404
        if not user.check_password(current_pwd):
            return {"success": False, "error": {"code": "UNAUTHORIZED", "message": "Mật khẩu hiện tại không đúng"}}, 400
        if len(new_pwd) < 6:
            return {"success": False, "error": {"code": "BAD_REQUEST", "message": "Mật khẩu mới tối thiểu 6 ký tự"}}, 400
        user.set_password(new_pwd)
        db.session.commit()
        return {"success": True, "message": "Đổi mật khẩu thành công"}, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "error": {"code": "DATABASE_ERROR", "message": str(e)}}, 500
