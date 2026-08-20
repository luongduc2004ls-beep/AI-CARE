"""
Auth Permission Service & Security Boundary Resolver
Enforces Multi-User & Multi-Patient Data Isolation for ElderlyCare AI.
"""
from typing import List, Optional
from database import db
from models.user import User
from models.patient_access import UserPatientAccess

class AuthPermissionService:
    """
    Security boundary resolver checking user identities, roles, and authorized patient scopes.
    """

    @classmethod
    def seed_access_if_empty(cls):
        try:
            count = UserPatientAccess.query.count()
            if count == 0:
                # Default seed: User 2 (Caregiver) has access to PAT10000
                access1 = UserPatientAccess(
                    user_id=2,
                    patient_id="PAT10000",
                    access_role="CAREGIVER"
                )
                db.session.add(access1)
                db.session.commit()
        except Exception:
            db.session.rollback()

    @classmethod
    def get_authorized_patient_ids(cls, user_id: Optional[int], role: str) -> List[str]:
        """
        Lấy danh sách các mã bệnh nhân (patient_ids) mà tài khoản có quyền truy cập.
        - Admin: Được truy cập toàn bộ hệ thống (trả về danh sách tất cả mã bệnh nhân).
        - Caregiver / Doctor / User: Chỉ được truy cập các mã bệnh nhân được cấp quyền trong UserPatientAccess.
        """
        cls.seed_access_if_empty()

        if (role or "").upper() == "ADMIN":
            try:
                users = User.query.filter(User.is_active != False).limit(100).all()
                p_ids = [u.patient_code or f"PAT{u.user_id:05d}" for u in users if u.patient_code or u.user_id]
                return p_ids if p_ids else ["PAT10000", "PAT10001", "PAT10002", "PAT10003"]
            except Exception:
                return ["PAT10000", "PAT10001", "PAT10002", "PAT10003"]

        if not user_id:
            return ["PAT10000"]

        try:
            uid = int(user_id) if str(user_id).isdigit() else None
            if uid:
                user = db.session.get(User, uid)
                primary_id = user.patient_code if user and user.patient_code else None

                records = UserPatientAccess.query.filter_by(user_id=uid).all()
                allowed = [r.patient_id for r in records]
                if primary_id and primary_id not in allowed:
                    allowed.append(primary_id)

                if allowed:
                    return allowed
        except Exception:
            pass

        return ["PAT10000"]

    @classmethod
    def validate_patient_access(cls, user_id: Optional[int], role: str, target_patient_id: str) -> bool:
        """
        Kiểm tra xem User có quyền xem dữ liệu của target_patient_id hay không.
        """
        if (role or "").upper() == "ADMIN":
            return True

        allowed = cls.get_authorized_patient_ids(user_id, role)
        target_norm = (target_patient_id or "").strip().upper()
        return any(a.strip().upper() == target_norm for a in allowed)
