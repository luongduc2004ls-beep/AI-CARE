from database import db
from datetime import datetime


class User(db.Model):

    __tablename__ = "Users"

    user_id = db.Column(
        db.Integer,
        primary_key=True
    )

    patient_code = db.Column(
        db.String(50),
        unique=True
    )

    device_id = db.Column(
        db.String(50),
        unique=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    gender = db.Column(
        db.String(20)
    )

    date_of_birth = db.Column(
        db.Date
    )

    age = db.Column(
        db.Integer
    )

    phone = db.Column(
        db.String(20)
    )

    address = db.Column(
        db.Text
    )

    emergency_contact = db.Column(
        db.String(100)
    )

    height_cm = db.Column(
        db.Integer
    )

    weight_kg = db.Column(
        db.Integer
    )

    blood_group = db.Column(
        db.String(10)
    )

    allergy = db.Column(
        db.String(255)
    )

    caregiver_name = db.Column(
        db.String(100)
    )

    caregiver_phone = db.Column(
        db.String(20)
    )

    doctor_name = db.Column(
        db.String(100)
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

    medicine_schedules = db.relationship(
        "MedicineSchedule",
        backref="user",
        lazy=True
    )

    health_records = db.relationship(
        "HealthRecord",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    notifications = db.relationship(
        "Notification",
        backref="user",
        lazy=True
    )

    fall_history = db.relationship(
        "FallHistory",
        backref="user",
        lazy=True
    )
