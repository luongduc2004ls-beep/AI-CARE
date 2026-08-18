from database import db
from datetime import datetime

class Camera(db.Model):
    """
    Bảng Camera liên kết trực tiếp với Bệnh nhân (Patient) và Vị trí giám sát.
    """
    __tablename__ = "Cameras"

    camera_id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    camera_code = db.Column(
        db.String(32),
        unique=True,
        nullable=True
    )

    patient_id = db.Column(
        db.String(32),
        nullable=True,
        index=True
    )

    device_id = db.Column(
        db.String(32),
        nullable=True
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
        default="Phòng Ngủ 101"
    )

    room = db.Column(
        db.String(64),
        default="Phòng Ngủ"
    )

    stream_type = db.Column(
        db.String(32),
        default="RTSP / H.264"
    )

    status = db.Column(
        db.String(20),
        default="ONLINE"  # ONLINE, DEGRADED, OFFLINE
    )

    ai_enabled = db.Column(
        db.Boolean,
        default=True
    )

    sensitivity = db.Column(
        db.String(20),
        default="High"  # Low, Medium, High
    )

    last_seen_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "camera_id": self.camera_id,
            "id": self.camera_id,
            "camera_code": self.camera_code or f"CAM{self.camera_id:03d}",
            "patient_id": self.patient_id or "PAT10000",
            "device_id": self.device_id or f"DEV{self.camera_id:04d}",
            "name": self.name,
            "rtsp_url": self.rtsp_url,
            "location": self.location,
            "room": self.room or self.location,
            "stream_type": self.stream_type,
            "status": self.status,
            "ai_enabled": self.ai_enabled,
            "sensitivity": self.sensitivity,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }
