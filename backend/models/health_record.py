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
