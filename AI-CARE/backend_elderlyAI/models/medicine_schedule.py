from database import db
from datetime import datetime


ALLOWED_SCHEDULE_STATUSES = (
    "Đã uống",
    "Chưa uống",
    "Quên uống"
)


class MedicineSchedule(db.Model):
    """
    Bảng Lịch Uống Thuốc (MedicineSchedules).
    Liên kết chặt chẽ với từng PrescriptionItem của đơn thuốc bệnh nhân.
    """
    __tablename__ = "MedicineSchedules"

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('Đã uống', 'Chưa uống', 'Quên uống')",
            name="chk_medicine_schedule_status"
        ),
    )

    schedule_id = db.Column(
        db.Integer,
        primary_key=True
    )

    prescription_item_id = db.Column(
        db.Integer,
        db.ForeignKey("PrescriptionItems.prescription_item_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    medicine_id = db.Column(
        db.Integer,
        db.ForeignKey("Medicines.medicine_id", ondelete="CASCADE"),
        nullable=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    scheduled_date = db.Column(
        db.Date,
        nullable=False,
        index=True
    )

    take_time = db.Column(
        db.Time,
        nullable=False
    )

    dose_amount = db.Column(
        db.String(50),
        default="1 viên"
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Chưa uống",
        index=True
    )

    taken_at = db.Column(
        db.DateTime,
        nullable=True
    )

    note = db.Column(
        db.Text
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

    def to_dict(self):
        med_name = "Thuốc"
        med_dosage = self.dose_amount or "1 viên"
        med_instruction = ""
        if self.prescription_item:
            if self.prescription_item.medicine:
                med_name = self.prescription_item.medicine.medicine_name
            med_dosage = self.prescription_item.dosage or self.dose_amount or "1 viên"
            med_instruction = self.prescription_item.instruction or ""
        elif self.medicine:
            med_name = self.medicine.medicine_name
            med_dosage = self.medicine.dosage or self.dose_amount or "1 viên"

        return {
            "schedule_id": self.schedule_id,
            "prescription_item_id": self.prescription_item_id,
            "medicine_id": self.medicine_id or (self.prescription_item.medicine_id if self.prescription_item else None),
            "medicine_name": med_name,
            "dosage": med_dosage,
            "instruction": med_instruction,
            "user_id": self.user_id,
            "patient_code": self.user.patient_code if self.user else None,
            "patient_name": self.user.full_name if self.user else None,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "take_time": self.take_time.strftime("%H:%M") if self.take_time else "08:00",
            "time": self.take_time.strftime("%H:%M") if self.take_time else "08:00",
            "status": self.status,
            "taken_at": self.taken_at.isoformat() if self.taken_at else None,
            "note": self.note
        }
