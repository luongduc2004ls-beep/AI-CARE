# ==========================================================
# medication_schedule.py
# Model MedicationSchedule quản lý lịch uống thuốc của bệnh nhân
# Khớp 100% với bảng `medication_schedules` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model MedicationSchedule
# ==========================================================

class MedicationSchedule(db.Model):
    """
    Model lưu trữ thông tin nhắc lịch uống thuốc cho bệnh nhân.
    Bảng: medication_schedules
    """

    __tablename__ = "medication_schedules"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    patient_id = db.Column(
        db.String(50),
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        doc="Mã bệnh nhân (Foreign Key / Primary Key)"
    )

    medicine_id = db.Column(
        db.String(50),
        db.ForeignKey("medicines.medicine_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        doc="Mã thuốc (Foreign Key / Primary Key)"
    )

    scheduled_time = db.Column(
        db.String(50),
        primary_key=True,
        nullable=False,
        doc="Giờ nhắc nhở uống thuốc (Primary Key)"
    )

    medicine_start_date = db.Column(
        db.String(50),
        nullable=True,
        doc="Ngày bắt đầu đợt dùng thuốc"
    )

    medicine_end_date = db.Column(
        db.String(50),
        nullable=True,
        doc="Ngày kết thúc đợt dùng thuốc"
    )

    reminder_type = db.Column(
        db.String(50),
        nullable=True,
        doc="Hình thức nhắc nhở (VD: Đèn led, Loa, Thông báo)"
    )

    reminder_sent = db.Column(
        db.String(50),
        nullable=True,
        doc="Trạng thái đã gửi nhắc nhở"
    )

    acknowledged = db.Column(
        db.String(50),
        nullable=True,
        doc="Xác nhận người bệnh đã uống thuốc"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    patient = db.relationship(
        "Patient",
        back_populates="medication_schedules",
        lazy="select"
    )

    medicine = db.relationship(
        "Medicine",
        back_populates="medication_schedules",
        lazy="select"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model MedicationSchedule thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu lịch uống thuốc dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "medicine_id": self.medicine_id,
            "medicine_start_date": self.medicine_start_date,
            "medicine_end_date": self.medicine_end_date,
            "scheduled_time": self.scheduled_time,
            "reminder_type": self.reminder_type,
            "reminder_sent": self.reminder_sent,
            "acknowledged": self.acknowledged,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng MedicationSchedule.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return (
            f"<MedicationSchedule patient_id='{self.patient_id}', "
            f"medicine_id='{self.medicine_id}', time='{self.scheduled_time}'>"
        )
