from database import db
from datetime import datetime


class HealthRecord(db.Model):

    __tablename__ = "HealthRecords"

    record_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id"),
        nullable=False
    )

    recorded_at = db.Column(
        db.DateTime
    )

    blood_pressure = db.Column(
        db.String(20)
    )

    heart_rate = db.Column(
        db.Integer
    )

    spo2 = db.Column(
        db.Integer
    )

    body_temperature = db.Column(
        db.Float
    )

    blood_glucose = db.Column(
        db.Integer
    )

    disease = db.Column(
        db.String(100)
    )

    fall_history = db.Column(
        db.String(20)
    )

    fall_risk_score = db.Column(
        db.Integer
    )

    risk_level = db.Column(
        db.String(50)
    )

    adherence_rate = db.Column(
        db.Integer
    )

    ai_prediction = db.Column(
        db.String(255)
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
        u = getattr(self, "user", None)
        return {
            "record_id": self.record_id,
            "id": self.record_id,
            "user_id": self.user_id,
            "patient_id": u.patient_code if u else f"PAT{self.user_id:05d}",
            "patient_name": u.full_name if u else "Bệnh nhân",
            "blood_pressure": self.blood_pressure or "120/80",
            "heart_rate": self.heart_rate or 75,
            "spo2": self.spo2 or 98,
            "body_temperature": self.body_temperature or 36.8,
            "temperature": self.body_temperature or 36.8,
            "blood_glucose": self.blood_glucose or 95,
            "glucose": self.blood_glucose or 95,
            "disease": self.disease or "Theo dõi sức khỏe định kỳ",
            "fall_risk_score": self.fall_risk_score or 15,
            "risk_level": self.risk_level or "Thấp",
            "adherence_rate": self.adherence_rate or 100,
            "ai_prediction": self.ai_prediction or "Chỉ số ổn định",
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else (self.created_at.isoformat() if self.created_at else None),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

