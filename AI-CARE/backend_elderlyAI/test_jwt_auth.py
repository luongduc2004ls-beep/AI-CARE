"""
Test Suite: JWT Authentication & Password Hashing (PHASE 1)
"""

import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from datetime import datetime, timedelta
import jwt
from app import app
from database import db
from models.user import User
from services.auth_service import AuthService
from config import Config


def test_authentication():
    with app.app_context():
        print("=" * 60)
        print("RUNNING PHASE 1: JWT AUTHENTICATION TESTS")
        print("=" * 60)

        # 1. Setup / find test users
        admin_user = User.query.filter_by(username="admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@elderlyai.vn",
                full_name="Quản Trị Viên Hệ Thống",
                role="Admin",
                patient_code="PAT_ADMIN",
                is_active=True
            )
            admin_user.set_password("Admin@2026")
            db.session.add(admin_user)
            db.session.commit()
        else:
            admin_user.set_password("Admin@2026")
            db.session.commit()

        # 2. Test Login Success
        res, status = AuthService.login("admin", "Admin@2026")
        assert status == 200, f"Login failed: {res}"
        token = res["token"]
        assert token, "Token must not be empty"
        print(" -> PASS: Login with hashed password succeeded and issued JWT token.")

        # 3. Test Login Wrong Password
        res_fail, status_fail = AuthService.login("admin", "wrong_password_123")
        assert status_fail == 401, "Wrong password must return 401"
        print(" -> PASS: Login with wrong password correctly rejected (401).")

        # 4. Test Token Verification
        verified_user = AuthService.verify_token(token)
        assert verified_user is not None, "Token verification failed"
        assert verified_user.username == "admin", "Token must decode to admin user"
        print(" -> PASS: JWT signature verified and user loaded from database.")

        # 5. Test Invalid Token
        invalid_res = AuthService.verify_token("invalid.jwt.token.string")
        assert invalid_res is None, "Invalid token must return None"
        print(" -> PASS: Tampered/invalid token correctly rejected.")

        # 6. Test Expired Token
        expired_payload = {
            "sub": str(admin_user.user_id),
            "user_id": admin_user.user_id,
            "username": "admin",
            "role": "Admin",
            "exp": datetime.utcnow() - timedelta(hours=1),
            "iat": datetime.utcnow() - timedelta(hours=2)
        }
        expired_token = jwt.encode(expired_payload, Config.SECRET_KEY, algorithm="HS256")
        expired_res = AuthService.verify_token(expired_token)
        assert expired_res is None, "Expired token must return None"
        print(" -> PASS: Expired JWT token correctly rejected.")

        # 7. Test /auth/me via Flask Test Client
        client = app.test_client()

        # Without token -> 401
        res_no_auth = client.get("/api/auth/me")
        assert res_no_auth.status_code == 401, f"Expected 401, got {res_no_auth.status_code}"
        print(" -> PASS: /auth/me without Authorization header returns 401.")

        # With valid token -> 200 and correct user
        res_auth = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res_auth.status_code == 200, f"Expected 200, got {res_auth.status_code}"
        data = res_auth.get_json()
        assert data["success"] is True
        assert data["user"]["username"] == "admin"
        assert data["user"]["user_id"] == admin_user.user_id
        print(" -> PASS: /auth/me with Bearer JWT returns authenticated user details.")

        print("\n" + "=" * 60)
        print("ALL PHASE 1 AUTHENTICATION TESTS PASSED 100%!")
        print("=" * 60)


if __name__ == "__main__":
    test_authentication()
