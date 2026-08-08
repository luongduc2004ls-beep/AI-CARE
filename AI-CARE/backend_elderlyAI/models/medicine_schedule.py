from database import db
from datetime import datetime


ALLOWED_SCHEDULE_STATUSES = (
    "Đã uống",
    "Chưa uống",
    "Quên uống"
)


class MedicineSchedule(db.Model):

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

    medicine_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "Medicines.medicine_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id"),
        nullable=True
    )

    scheduled_date = db.Column(
        db.Date,
        nullable=False
    )

    take_time = db.Column(
        db.Time,
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Chưa uống"
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
