from datetime import datetime, date
from database import db


class Prescription(db.Model):
    """
    Bảng Đơn Thuốc của Bệnh Nhân (Prescriptions).
    Mỗi bệnh nhân có thể có nhiều đơn thuốc điều trị theo thời gian.
    """
    __tablename__ = "Prescriptions"

    prescription_id = db.Column(db.Integer, primary_key=True)
    prescription_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_name = db.Column(db.String(100), default="BS. Chuyên Khoa Lão")
    diagnosis = db.Column(db.String(255), default="Điều trị và theo dõi định kỳ")
    prescription_date = db.Column(db.Date, default=date.today)
    start_date = db.Column(db.Date, default=date.today)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="Active", index=True)  # Active, Completed, Cancelled
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship(
        "PrescriptionItem",
        backref="prescription",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "prescription_id": self.prescription_id,
            "prescription_code": self.prescription_code,
            "user_id": self.user_id,
            "doctor_name": self.doctor_name,
            "diagnosis": self.diagnosis,
            "prescription_date": self.prescription_date.isoformat() if self.prescription_date else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "note": self.note,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PrescriptionItem(db.Model):
    """
    Chi tiết từng loại thuốc được chỉ định trong một Đơn Thuốc (PrescriptionItems).
    Cho phép cùng 1 loại thuốc (Amlodipine) có liều lượng, cách dùng, số lần uống
    hoàn toàn riêng biệt cho từng bệnh nhân.
    """
    __tablename__ = "PrescriptionItems"

    prescription_item_id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(
        db.Integer,
        db.ForeignKey("Prescriptions.prescription_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    medicine_id = db.Column(
        db.Integer,
        db.ForeignKey("Medicines.medicine_id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    dosage = db.Column(db.String(50), nullable=False, default="1 viên")       # ví dụ: "5mg", "10mg", "2 viên"
    frequency = db.Column(db.String(50), nullable=False, default="1 lần/ngày") # ví dụ: "2 lần/ngày", "Sáng - Tối"
    quantity = db.Column(db.Integer, default=30)
    unit = db.Column(db.String(20), default="Viên")
    instruction = db.Column(db.Text, default="Uống sau khi ăn")
    start_date = db.Column(db.Date, default=date.today)
    end_date = db.Column(db.Date, nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    medicine = db.relationship("Medicine", lazy=True)
    schedules = db.relationship(
        "MedicineSchedule",
        backref="prescription_item",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "prescription_item_id": self.prescription_item_id,
            "prescription_id": self.prescription_id,
            "medicine_id": self.medicine_id,
            "medicine_code": self.medicine.medicine_code if self.medicine else None,
            "medicine_name": self.medicine.medicine_name if self.medicine else "Thuốc",
            "dosage": self.dosage,
            "frequency": self.frequency,
            "quantity": self.quantity,
            "unit": self.unit,
            "instruction": self.instruction,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "note": self.note
        }
