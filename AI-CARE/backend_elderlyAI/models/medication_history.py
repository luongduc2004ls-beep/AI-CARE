from datetime import datetime
from database import db


class MedicationHistory(db.Model):
    """
    Bảng Nhật Ký Uống Thuốc (MedicationHistory).
    Ghi nhận lịch sử từng lần uống thuốc thực tế của bệnh nhân để theo dõi tuân thủ điều trị.
    """
    __tablename__ = "MedicationHistory"

    history_id = db.Column(db.Integer, primary_key=True)
    schedule_id = db.Column(
        db.Integer,
        db.ForeignKey("MedicineSchedules.schedule_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    prescription_item_id = db.Column(
        db.Integer,
        db.ForeignKey("PrescriptionItems.prescription_item_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    scheduled_time = db.Column(db.DateTime, nullable=True)
    actual_taken_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Đúng giờ")  # Đúng giờ, Trễ giờ, Quên uống, Bỏ lỡ
    taken_by = db.Column(db.String(100), default="Bệnh nhân")  # Bệnh nhân, Người thân, Điều dưỡng
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", lazy=True)
    prescription_item = db.relationship("PrescriptionItem", lazy=True)

    def to_dict(self):
        return {
            "history_id": self.history_id,
            "schedule_id": self.schedule_id,
            "prescription_item_id": self.prescription_item_id,
            "user_id": self.user_id,
            "patient_code": self.user.patient_code if self.user else None,
            "patient_name": self.user.full_name if self.user else None,
            "medicine_name": self.prescription_item.medicine.medicine_name if self.prescription_item and self.prescription_item.medicine else "Thuốc",
            "dosage": self.prescription_item.dosage if self.prescription_item else "",
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "actual_taken_time": self.actual_taken_time.isoformat() if self.actual_taken_time else None,
            "status": self.status,
            "taken_by": self.taken_by,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
