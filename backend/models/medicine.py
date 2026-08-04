from database import db
from datetime import datetime


class Medicine(db.Model):

    __tablename__ = "Medicines"

    medicine_id = db.Column(
        db.Integer,
        primary_key=True
    )

    medicine_code = db.Column(
        db.String(50),
        unique=True
    )

    medicine_name = db.Column(
        db.String(100),
        nullable=False
    )

    dosage = db.Column(
        db.String(100)
    )

    frequency = db.Column(
        db.String(100)
    )

    quantity = db.Column(
        db.Integer,
        default=0
    )

    instruction = db.Column(
        db.Text
    )

    start_date = db.Column(
        db.Date
    )

    expire_date = db.Column(
        db.Date
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

    schedules = db.relationship(
        "MedicineSchedule",
        backref="medicine",
        lazy=True,
        order_by="MedicineSchedule.scheduled_date, MedicineSchedule.take_time",
        cascade="all, delete-orphan"
    )
