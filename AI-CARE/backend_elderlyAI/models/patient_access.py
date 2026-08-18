from datetime import datetime
from database import db

class UserPatientAccess(db.Model):
    """
    Bảng phân quyền truy cập giữa Tài khoản người dùng (User) và Bệnh nhân (Patient).
    Đóng vai trò là Security Boundary cốt lõi của hệ thống.
    """
    __tablename__ = "UserPatientAccess"

    access_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    patient_id = db.Column(db.String(32), nullable=False, index=True)
    access_role = db.Column(db.String(32), default="CAREGIVER")  # 'OWNER', 'CAREGIVER', 'DOCTOR', 'ADMIN'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "patient_id", name="uq_user_patient"),
    )

    def to_dict(self):
        return {
            "access_id": self.access_id,
            "user_id": self.user_id,
            "patient_id": self.patient_id,
            "access_role": self.access_role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
