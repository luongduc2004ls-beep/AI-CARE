from database import db
from datetime import datetime


class Camera(db.Model):
    __tablename__ = "Cameras"

    camera_id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    rtsp_url = db.Column(
        db.String(255),
        nullable=False
    )

    location = db.Column(
        db.String(100),
        default="Phòng Ngủ"
    )

    status = db.Column(
        db.String(20),
        default="ONLINE"  # ONLINE, OFFLINE, WARNING
    )

    ai_enabled = db.Column(
        db.Boolean,
        default=True
    )

    sensitivity = db.Column(
        db.String(20),
        default="Medium"  # Low, Medium, High
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "camera_id": self.camera_id,
            "name": self.name,
            "rtsp_url": self.rtsp_url,
            "location": self.location,
            "status": self.status,
            "ai_enabled": self.ai_enabled,
            "sensitivity": self.sensitivity,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }
