# ==========================================================
# medicine.py
# Model Medicine quản lý danh mục thuốc trong hệ thống
# Khớp 100% với bảng `medicines` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model Medicine
# ==========================================================

class Medicine(db.Model):
    """
    Model lưu trữ danh mục thông tin thuốc.
    Bảng: medicines
    """

    __tablename__ = "medicines"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    medicine_id = db.Column(
        db.String(50),
        primary_key=True,
        nullable=False,
        doc="Mã thuốc (Primary Key)"
    )

    medicine_name = db.Column(
        db.String(150),
        nullable=True,
        doc="Tên loại thuốc"
    )

    dosage = db.Column(
        db.String(50),
        nullable=True,
        doc="Liều lượng (VD: 500mg, 1 viên)"
    )

    frequency = db.Column(
        db.String(50),
        nullable=True,
        doc="Tần suất sử dụng (VD: 2 lần/ngày)"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    medication_schedules = db.relationship(
        "MedicationSchedule",
        back_populates="medicine",
        lazy="select",
        cascade="all, delete-orphan"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model Medicine thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu thuốc dạng Dictionary.
        """
        return {
            "medicine_id": self.medicine_id,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "frequency": self.frequency,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng Medicine.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return f"<Medicine id='{self.medicine_id}', name='{self.medicine_name}'>"