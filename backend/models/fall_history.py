from database import db
from datetime import datetime


class FallHistory(db.Model):

    __tablename__ = "FallHistory"

    fall_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id")
    )

    location = db.Column(
        db.String(255)
    )

    severity = db.Column(
        db.String(50)
    )

    image = db.Column(
        db.String(255)
    )

    fall_time = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )