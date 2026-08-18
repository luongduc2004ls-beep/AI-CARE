from database import db
from datetime import datetime


class User(db.Model):

    __tablename__ = "Users"

    user_id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=True
    )

    role = db.Column(
        db.String(50),
        default="Caregiver"
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

    caregiver_relation = db.Column(
        db.String(50)
    )

    caregiver_age = db.Column(
        db.Integer
    )

    caregiver_phone = db.Column(
        db.String(20)
    )

    caregiver_email = db.Column(
        db.String(120)
    )

    doctor_name = db.Column(
        db.String(100)
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    deleted_at = db.Column(
        db.DateTime,
        nullable=True
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

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        user_role = "Admin" if (self.role or "").upper() == "ADMIN" else "User"
        return {
            "user_id": self.user_id,
            "id": self.user_id,
            "patient_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "fullName": self.full_name,
            "role": user_role,
            "patient_code": self.patient_code,
            "device_id": self.device_id,
            "phone": self.phone,
            "emergency_contact": self.emergency_contact,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

