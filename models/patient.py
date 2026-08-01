# ==========================================================
# patient.py
# Model Patient quản lý thông tin bệnh nhân
# Khớp 100% với bảng `patients` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model Patient
# ==========================================================

class Patient(db.Model):
    """
    Model lưu trữ thông tin bệnh nhân / người cao tuổi.
    Bảng: patients
    """

    __tablename__ = "patients"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    patient_id = db.Column(
        db.String(50),
        primary_key=True,
        nullable=False,
        doc="Mã bệnh nhân (Primary Key)"
    )

    device_id = db.Column(
        db.String(100),
        nullable=True,
        doc="Mã thiết bị đeo / theo dõi"
    )

    name = db.Column(
        db.String(150),
        nullable=True,
        doc="Họ và tên bệnh nhân"
    )

    age = db.Column(
        db.Integer,
        nullable=True,
        doc="Tuổi bệnh nhân"
    )

    gender = db.Column(
        db.String(20),
        nullable=True,
        doc="Giới tính (Nam / Nữ / Khác)"
    )

    phone = db.Column(
        db.BigInteger,
        nullable=True,
        doc="Số điện thoại liên lạc"
    )

    height_cm = db.Column(
        db.Integer,
        nullable=True,
        doc="Chiều cao (cm)"
    )

    weight_kg = db.Column(
        db.Integer,
        nullable=True,
        doc="Cân nặng (kg)"
    )

    blood_group = db.Column(
        db.String(20),
        nullable=True,
        doc="Nhóm máu (A, B, AB, O...)"
    )

    allergy = db.Column(
        db.Text,
        nullable=True,
        doc="Tiền sử dị ứng"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    caregivers = db.relationship(
        "Caregiver",
        back_populates="patient",
        lazy="select",
        cascade="all, delete-orphan"
    )

    doctors = db.relationship(
        "Doctor",
        back_populates="patient",
        lazy="select",
        cascade="all, delete-orphan"
    )

    health_records = db.relationship(
        "HealthRecord",
        back_populates="patient",
        lazy="select",
        cascade="all, delete-orphan"
    )

    medication_schedules = db.relationship(
        "MedicationSchedule",
        back_populates="patient",
        lazy="select",
        cascade="all, delete-orphan"
    )

    notifications = db.relationship(
        "Notification",
        back_populates="patient",
        lazy="select",
        cascade="all, delete-orphan"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model Patient thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu bệnh nhân dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "device_id": self.device_id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "phone": self.phone,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "blood_group": self.blood_group,
            "allergy": self.allergy,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng Patient.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return f"<Patient id='{self.patient_id}', name='{self.name}'>"
