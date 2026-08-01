# ==========================================================
# caregiver.py
# Model Caregiver quản lý thông tin người chăm sóc bệnh nhân
# Khớp 100% với bảng `caregivers` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model Caregiver
# ==========================================================

class Caregiver(db.Model):
    """
    Model lưu trữ thông tin người chăm sóc (Caregiver).
    Bảng: caregivers
    """

    __tablename__ = "caregivers"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    patient_id = db.Column(
        db.String(50),
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        doc="Mã bệnh nhân được chăm sóc (Foreign Key)"
    )

    caregiver_name = db.Column(
        db.String(150),
        primary_key=True,
        nullable=False,
        doc="Họ và tên người chăm sóc"
    )

    caregiver_phone = db.Column(
        db.BigInteger,
        nullable=True,
        doc="Số điện thoại liên lạc của người chăm sóc"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    patient = db.relationship(
        "Patient",
        back_populates="caregivers",
        lazy="select"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model Caregiver thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu người chăm sóc dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "caregiver_name": self.caregiver_name,
            "caregiver_phone": self.caregiver_phone,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng Caregiver.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return f"<Caregiver patient_id='{self.patient_id}', name='{self.caregiver_name}'>"
