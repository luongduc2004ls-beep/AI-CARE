"""
RBAC Service (Role-Based Access Control) & Patient Scope Isolation
ElderlyCare AI System
"""

from typing import List, Optional, Dict, Any
from database import db
from models.user import User
from models.patient_access import UserPatientAccess


ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "SUPER_ADMIN": [
        "*"
    ],
    "ADMIN": [
        "*"
    ],
    "MEDICAL_ADMIN": [
        "patients.read",
        "health.read",
        "medications.read",
        "alerts.read",
        "camera.read",
        "medical.ask",
        "analytics.read"
    ],
    "CARE_MANAGER": [
        "patients.read",
        "health.read",
        "medications.read",
        "alerts.read",
        "camera.read",
        "medical.ask"
    ],
    "VIEWER": [
        "patients.read.basic",
        "dashboard.view"
    ],
    "PATIENT": [
        "profile.read.self",
        "vitals.read.self",
        "meds.read.self",
        "alerts.read.self",
        "camera.read.self",
        "medical.ask"
    ],
    "CAREGIVER": [
        "profile.read.self",
        "vitals.read.self",
        "meds.read.self",
        "alerts.read.self",
        "camera.read.self",
        "medical.ask"
    ],
    "USER": [
        "profile.read.self",
        "vitals.read.self",
        "meds.read.self",
        "alerts.read.self",
        "camera.read.self",
        "medical.ask"
    ]
}


class RBACService:
    """
    Dịch vụ quản lý phân quyền và ranh giới bảo mật bệnh nhân.
    """

    @classmethod
    def normalize_role(cls, role: Optional[str]) -> str:
        if not role:
            return "USER"
        r = str(role).strip().upper()
        if r in ["SUPER_ADMIN", "SUPERADMIN"]:
            return "SUPER_ADMIN"
        if r in ["ADMIN", "ADMINISTRATOR"]:
            return "ADMIN"
        if r in ["MEDICAL_ADMIN", "DOCTOR", "BAC_SI"]:
            return "MEDICAL_ADMIN"
        if r in ["CARE_MANAGER", "MANAGER"]:
            return "CARE_MANAGER"
        if r in ["VIEWER", "GUEST"]:
            return "VIEWER"
        if r in ["PATIENT", "BENH_NHAN"]:
            return "PATIENT"
        if r in ["CAREGIVER", "NGUOI_THAN"]:
            return "CAREGIVER"
        return "USER"

    @classmethod
    def has_permission(cls, role: str, permission: str) -> bool:
        normalized = cls.normalize_role(role)
        perms = ROLE_PERMISSIONS.get(normalized, [])
        if "*" in perms or "system.*" in perms:
            return True
        if permission in perms:
            return True
        perm_prefix = permission.split(".")[0] + ".*"
        return perm_prefix in perms

    @classmethod
    def is_admin_role(cls, role: str) -> bool:
        norm = cls.normalize_role(role)
        return norm in ["SUPER_ADMIN", "ADMIN", "MEDICAL_ADMIN", "CARE_MANAGER", "VIEWER"]

    @classmethod
    def get_authorized_patient_ids_for_user(cls, user_id: Optional[int], role: str) -> List[str]:
        norm_role = cls.normalize_role(role)
        if cls.is_admin_role(norm_role):
            try:
                users = User.query.filter(User.is_active != False).all()
                return [u.patient_code or f"PAT{u.user_id:05d}" for u in users if u.patient_code or u.user_id]
            except Exception:
                return ["PAT10000"]

        if not user_id:
            return ["PAT10000"]

        try:
            uid = int(user_id) if str(user_id).isdigit() else None
            if uid:
                user = db.session.get(User, uid)
                primary_code = user.patient_code if user and user.patient_code else None
                records = UserPatientAccess.query.filter_by(user_id=uid).all()
                allowed = [r.patient_id.upper() for r in records if r.patient_id]
                if primary_code and primary_code.upper() not in allowed:
                    allowed.append(primary_code.upper())
                if allowed:
                    return allowed
        except Exception:
            pass

        return ["PAT10000"]

    @classmethod
    def validate_patient_access(cls, user_id: Optional[int], role: str, target_patient_id: str) -> bool:
        norm_role = cls.normalize_role(role)
        if cls.is_admin_role(norm_role):
            return True

        if not target_patient_id:
            return False

        allowed_ids = cls.get_authorized_patient_ids_for_user(user_id, role)
        target_norm = target_patient_id.strip().upper()
        return target_norm in [a.strip().upper() for a in allowed_ids]

    @classmethod
    def get_primary_patient_id(cls, user_id: Optional[int], role: str) -> str:
        allowed = cls.get_authorized_patient_ids_for_user(user_id, role)
        return allowed[0] if allowed else "PAT10000"
