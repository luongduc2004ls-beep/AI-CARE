from database import db
from datetime import datetime

class Alert(db.Model):
    """
    Bảng Alerts quản lý toàn bộ vòng đời cảnh báo:
    DETECTED -> CONFIRMED -> ALERTED -> ACKNOWLEDGED -> RESOLVED
    """
    __tablename__ = "Alerts"

    alert_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_id = db.Column(db.String(32), nullable=False, index=True)
    camera_id = db.Column(db.Integer, nullable=True, index=True)
    event_id = db.Column(db.Integer, nullable=True, index=True)
    alert_type = db.Column(db.String(64), nullable=False, default="FALL")
    title = db.Column(db.String(128), default="CẢNH BÁO TÉ NGÃ KHẨN CẤP")
    severity = db.Column(db.String(32), default="CRITICAL")  # CRITICAL, WARNING, INFO
    confidence = db.Column(db.Float, default=0.94)
    status = db.Column(db.String(32), default="ALERTED", index=True)  # DETECTED, CONFIRMED, ALERTED, ACKNOWLEDGED, RESOLVED
    
    location = db.Column(db.String(128), default="Phòng Ngủ 101")
    snapshot_url = db.Column(db.String(255), nullable=True)
    spine_angle = db.Column(db.Float, default=78.5)
    duration_seconds = db.Column(db.Integer, default=14)

    alert_created_at = db.Column(db.DateTime, default=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    acknowledged_by = db.Column(db.String(100), nullable=True)
    resolved_by = db.Column(db.String(100), nullable=True)
    resolution_note = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def calculate_response_time_seconds(self):
        if self.acknowledged_at and self.alert_created_at:
            return round((self.acknowledged_at - self.alert_created_at).total_seconds(), 1)
        return None

    def to_dict(self):
        resp_time = self.calculate_response_time_seconds()
        return {
            "alert_id": self.alert_id,
            "id": self.alert_id,
            "patient_id": self.patient_id,
            "camera_id": self.camera_id,
            "event_id": self.event_id,
            "alert_type": self.alert_type,
            "type": self.alert_type,
            "title": self.title,
            "severity": self.severity,
            "confidence": self.confidence,
            "confidence_percent": f"{int(self.confidence * 100)}%" if self.confidence else "94%",
            "status": self.status,
            "location": self.location,
            "snapshot_url": self.snapshot_url,
            "spine_angle": self.spine_angle,
            "duration_sec": self.duration_seconds,
            "duration_seconds": self.duration_seconds,
            "alert_created_at": self.alert_created_at.isoformat() if self.alert_created_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "response_time_seconds": resp_time,
            "response_time_text": f"{resp_time}s" if resp_time is not None else "Đang chờ xử lý",
            "acknowledged_by": self.acknowledged_by,
            "resolved_by": self.resolved_by,
            "resolution_note": self.resolution_note,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
