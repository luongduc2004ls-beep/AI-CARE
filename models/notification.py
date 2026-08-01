# ==========================================================
# notification.py
# Model Notification quản lý thông báo và cảnh báo hệ thống
# Khớp 100% với bảng `notifications` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model Notification
# ==========================================================

class Notification(db.Model):
    """
    Model lưu trữ các thông báo, lịch gửi cảnh báo cho bệnh nhân.
    Bảng: notifications
    """

    __tablename__ = "notifications"

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

    timestamp = db.Column(
        db.String(50),
        primary_key=True,
        nullable=False,
        doc="Thời gian phát sinh thông báo (Primary Key)"
    )

    alert_status = db.Column(
        db.String(50),
        nullable=True,
        doc="Trạng thái cảnh báo (Bình thường / Cảnh báo / Khẩn cấp)"
    )

    reminder_sent = db.Column(
        db.String(50),
        nullable=True,
        doc="Trạng thái đã gửi thông báo"
    )

    acknowledged = db.Column(
        db.String(50),
        nullable=True,
        doc="Trạng thái đã xác nhận thông báo"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    patient = db.relationship(
        "Patient",
        back_populates="notifications",
        lazy="select"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model Notification thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu thông báo dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "timestamp": self.timestamp,
            "alert_status": self.alert_status,
            "reminder_sent": self.reminder_sent,
            "acknowledged": self.acknowledged,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng Notification.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return (
            f"<Notification patient_id='{self.patient_id}', "
            f"timestamp='{self.timestamp}', status='{self.alert_status}'>"
        )
