from database import db
from datetime import datetime


class Notification(db.Model):

    __tablename__ = "Notifications"

    notification_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.user_id")
    )

    title = db.Column(
        db.String(200)
    )

    content = db.Column(
        db.Text
    )

    is_read = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )