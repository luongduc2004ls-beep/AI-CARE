from database import db
from datetime import datetime

class CameraEvent(db.Model):
    """
    Bảng CameraEvents lưu vết sự kiện phát hiện AI từ camera (Ngã, Chuyển động bất thường, Không cử động kéo dài).
    """
    __tablename__ = "CameraEvents"

    event_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    camera_id = db.Column(db.Integer, db.ForeignKey("Cameras.camera_id"), nullable=False, index=True)
    patient_id = db.Column(db.String(32), nullable=False, index=True)
    event_type = db.Column(db.String(64), nullable=False, default="FALL")  # FALL, ABNORMAL_MOVEMENT, LONG_INACTIVITY, LYING_DOWN
    confidence = db.Column(db.Float, default=0.92)
    severity = db.Column(db.String(32), default="CRITICAL")  # CRITICAL, WARNING, INFO
    event_started_at = db.Column(db.DateTime, default=datetime.utcnow)
    event_detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    event_ended_at = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, default=0)
    spine_angle = db.Column(db.Float, nullable=True)
    snapshot_url = db.Column(db.String(255), nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    metadata_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def calculate_duration(self):
        if self.event_ended_at and self.event_started_at:
            return int((self.event_ended_at - self.event_started_at).total_seconds())
        if self.event_started_at:
            return int((datetime.utcnow() - self.event_started_at).total_seconds())
        return self.duration_seconds or 0

    def to_dict(self):
        dur = self.calculate_duration()
        return {
            "event_id": self.event_id,
            "id": self.event_id,
            "camera_id": self.camera_id,
            "patient_id": self.patient_id,
            "event_type": self.event_type,
            "confidence": self.confidence,
            "confidence_percent": f"{int(self.confidence * 100)}%" if self.confidence else "92%",
            "severity": self.severity,
            "event_started_at": self.event_started_at.isoformat() if self.event_started_at else None,
            "event_detected_at": self.event_detected_at.isoformat() if self.event_detected_at else None,
            "event_ended_at": self.event_ended_at.isoformat() if self.event_ended_at else None,
            "duration_seconds": dur,
            "spine_angle": self.spine_angle or 78.5,
            "snapshot_url": self.snapshot_url,
            "video_url": self.video_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
