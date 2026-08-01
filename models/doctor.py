# ==========================================================
# doctor.py
# Model Doctor quản lý thông tin bác sĩ phụ trách bệnh nhân
# Khớp 100% với bảng `doctors` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model Doctor
# ==========================================================

class Doctor(db.Model):
    """
    Model lưu trữ thông tin bác sĩ phụ trách (Doctor).
    Bảng: doctors
    """

    __tablename__ = "doctors"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    patient_id = db.Column(
        db.String(50),
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        doc="Mã bệnh nhân được quản lý (Foreign Key)"
    )

    doctor_name = db.Column(
        db.String(150),
        primary_key=True,
        nullable=False,
        doc="Họ và tên bác sĩ điều trị"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    patient = db.relationship(
        "Patient",
        back_populates="doctors",
        lazy="select"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model Doctor thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu bác sĩ dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "doctor_name": self.doctor_name,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng Doctor.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return f"<Doctor patient_id='{self.patient_id}', name='{self.doctor_name}'>"
