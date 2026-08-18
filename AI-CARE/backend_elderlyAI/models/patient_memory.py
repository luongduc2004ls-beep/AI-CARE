from datetime import datetime
from database import db

class UserPatientMemory(db.Model):
    __tablename__ = "user_patient_memories"

    memory_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    patient_id = db.Column(db.String(32), nullable=False, index=True)
    memory_type = db.Column(db.String(64), default="CARE_PREFERENCE")  # PREFERENCE, ROUTINE, DIETARY, NOTE
    key = db.Column(db.String(128), nullable=False)
    value = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "memory_id": self.memory_id,
            "user_id": self.user_id,
            "patient_id": self.patient_id,
            "memory_type": self.memory_type,
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AIAuditLog(db.Model):
    __tablename__ = "ai_audit_logs"

    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=True)
    user_role = db.Column(db.String(32), default="Admin")
    action_type = db.Column(db.String(64), nullable=False)  # SEARCH, UPDATE_PATIENT, ASSIGN_CAMERA, RESOLVE_ALERT
    target_id = db.Column(db.String(64), nullable=True)
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), default="SUCCESS")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "user_id": self.user_id,
            "user_role": self.user_role,
            "action_type": self.action_type,
            "target_id": self.target_id,
            "details": self.details,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
