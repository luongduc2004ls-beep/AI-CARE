from database import db
from datetime import datetime


class Medicine(db.Model):
    """
    Bảng Danh Mục Kho Dược (Medicines Master Catalog).
    Chỉ lưu thông tin danh mục thuốc chung của bệnh viện (Tên, Mã, Đơn vị, Hoạt chất, Nhóm dược lý).
    Không lưu dữ liệu riêng của từng bệnh nhân hay lịch uống.
    """
    __tablename__ = "Medicines"

    medicine_id = db.Column(
        db.Integer,
        primary_key=True
    )

    medicine_code = db.Column(
        db.String(50),
        unique=True,
        index=True
    )

    medicine_name = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    dosage = db.Column(
        db.String(100),
        nullable=True
    )

    frequency = db.Column(
        db.String(100),
        nullable=True
    )

    quantity = db.Column(
        db.Integer,
        default=100
    )

    instruction = db.Column(
        db.Text,
        nullable=True
    )

    start_date = db.Column(
        db.Date,
        nullable=True
    )

    expire_date = db.Column(
        db.Date,
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

    def to_dict(self):
        return {
            "medicine_id": self.medicine_id,
            "id": self.medicine_id,
            "medicine_code": self.medicine_code,
            "medicine_name": self.medicine_name,
            "name": self.medicine_name,
            "dosage": self.dosage or "Tiêu chuẩn",
            "frequency": self.frequency or "Theo chỉ định",
            "quantity": self.quantity,
            "instruction": self.instruction or "Theo chỉ định bác sĩ",
            "expire_date": self.expire_date.isoformat() if self.expire_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
