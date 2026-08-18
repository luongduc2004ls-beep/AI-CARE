from datetime import datetime
from database import db

class AuditLog(db.Model):
    """
    Bảng nhật ký kiểm toán (Audit Trail) ghi vết mọi thay đổi dữ liệu quan trọng trong hệ thống.
    """
    __tablename__ = "AuditLogs"

    audit_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(64), nullable=False)  # 'CREATE_PATIENT', 'UPDATE_PATIENT', 'DELETE_PATIENT', etc.
    entity_type = db.Column(db.String(64), nullable=False)  # 'Patient', 'Medicine', 'Schedule'
    entity_id = db.Column(db.String(64), nullable=False)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "audit_id": self.audit_id,
            "user_id": self.user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
