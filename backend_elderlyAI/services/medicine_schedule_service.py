from datetime import date, datetime, time

from database import db
from models.medicine import Medicine
from models.user import User
from models.medicine_schedule import (
    ALLOWED_SCHEDULE_STATUSES,
    MedicineSchedule
)

DEFAULT_SCHEDULE_STATUS = "Chưa uống"

SCHEDULE_STATUS_ALIASES = {
    "Đã uống": "Đã uống",
    "Da uong": "Đã uống",
    "Taken": "Đã uống",
    "taken": "Đã uống",
    "Chưa uống": "Chưa uống",
    "Chua uong": "Chưa uống",
    "Pending": "Chưa uống",
    "pending": "Chưa uống",
    "Quên uống": "Quên uống",
    "Quen uong": "Quên uống",
    "Missed": "Quên uống",
    "missed": "Quên uống"
}


def _get_value(data, *keys):

    for key in keys:
        if key in data:
            return data.get(key)

    return None


def _has_any(data, *keys):

    return any(key in data for key in keys)


def _parse_date(value, field_name):

    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

    if isinstance(value, date) and not isinstance(value, datetime):
        return value

    try:
        return datetime.strptime(
            value,
            "%Y-%m-%d"
        ).date()
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        ) from exc


def _parse_time(value, field_name):

    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

    if isinstance(value, time):
        return value

    for time_format in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(
                value,
                time_format
            ).time()
        except (TypeError, ValueError):
            continue

    raise ValueError(f"{field_name} must use HH:MM format")


def _parse_positive_integer(value, field_name):

    if value in (None, ""):
        raise ValueError(f"{field_name} is required")

    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a number") from exc

    if number <= 0:
        raise ValueError(f"{field_name} must be greater than 0")

    return number


def normalize_schedule_status(value, use_default=True):

    if value in (None, "") and use_default:
        status = "Chưa uống"
    elif value in (None, ""):
        raise ValueError("status is required")
    else:
        status = str(value).strip()

    status = SCHEDULE_STATUS_ALIASES.get(status, status)

    if status not in ALLOWED_SCHEDULE_STATUSES:
        raise ValueError(
            "Status must be one of: "
            + ", ".join(ALLOWED_SCHEDULE_STATUSES)
        )

    return status


class MedicineScheduleService:

    @staticmethod
    def get_all(filters=None):

        filters = filters or {}

        query = MedicineSchedule.query

        if filters.get("user_id"):
            query = query.filter(
                MedicineSchedule.user_id == _parse_positive_integer(
                    filters["user_id"],
                    "user_id"
                )
            )

        if filters.get("medicine_id"):
            query = query.filter(
                MedicineSchedule.medicine_id == _parse_positive_integer(
                    filters["medicine_id"],
                    "medicine_id"
                )
            )

        if filters.get("scheduled_date"):
            query = query.filter(
                MedicineSchedule.scheduled_date == _parse_date(
                    filters["scheduled_date"],
                    "scheduled_date"
                )
            )

        if filters.get("status"):
            query = query.filter(
                MedicineSchedule.status == normalize_schedule_status(
                    filters["status"]
                )
            )

        return query.order_by(
            MedicineSchedule.scheduled_date.asc(),
            MedicineSchedule.take_time.asc()
        ).all()

    @staticmethod
    def get_by_id(schedule_id):

        return db.session.get(MedicineSchedule, schedule_id)

    @staticmethod
    def get_by_medicine(medicine_id):

        return MedicineSchedule.query.filter(
            MedicineSchedule.medicine_id == medicine_id
        ).order_by(
            MedicineSchedule.scheduled_date.asc(),
            MedicineSchedule.take_time.asc()
        ).all()

    @staticmethod
    def create(data):

        if not data:
            raise ValueError("Request body is empty")

        medicine_id = _parse_positive_integer(
            data.get("medicine_id"),
            "medicine_id"
        )

        medicine = db.session.get(Medicine, medicine_id)

        if medicine is None:
            raise LookupError("Medicine not found")

        user_id = data.get("user_id")

        if user_id not in (None, ""):
            user_id = _parse_positive_integer(user_id, "user_id")
            user = db.session.get(User, user_id)

            if user is None:
                raise LookupError("User not found")
        else:
            user_id = None

        schedule = MedicineSchedule(
            medicine_id=medicine_id,
            user_id=user_id,
            scheduled_date=_parse_date(
                _get_value(data, "scheduled_date", "date"),
                "scheduled_date"
            ),
            take_time=_parse_time(
                _get_value(data, "take_time", "time"),
                "take_time"
            ),
            status=normalize_schedule_status(
                data.get("status"),
                use_default=True
            ),
            note=data.get("note")
        )

        db.session.add(schedule)
        db.session.commit()

        return schedule

    @staticmethod
    def update(schedule_id, data):

        schedule = db.session.get(MedicineSchedule, schedule_id)

        if schedule is None:
            return None

        if not data:
            raise ValueError("Request body is empty")

        if "medicine_id" in data:
            medicine_id = _parse_positive_integer(
                data.get("medicine_id"),
                "medicine_id"
            )

            medicine = db.session.get(Medicine, medicine_id)

            if medicine is None:
                raise LookupError("Medicine not found")

            schedule.medicine_id = medicine_id

        if "user_id" in data:
            user_id = data.get("user_id")

            if user_id in (None, ""):
                schedule.user_id = None
            else:
                user_id = _parse_positive_integer(user_id, "user_id")
                user = db.session.get(User, user_id)

                if user is None:
                    raise LookupError("User not found")

                schedule.user_id = user_id

        if _has_any(data, "scheduled_date", "date"):
            schedule.scheduled_date = _parse_date(
                _get_value(data, "scheduled_date", "date"),
                "scheduled_date"
            )

        if _has_any(data, "take_time", "time"):
            schedule.take_time = _parse_time(
                _get_value(data, "take_time", "time"),
                "take_time"
            )

        if "status" in data:
            schedule.status = normalize_schedule_status(
                data.get("status"),
                use_default=False
            )

        if "note" in data:
            schedule.note = data.get("note")

        db.session.commit()

        return schedule

    @staticmethod
    def update_status(schedule_id, status, note=None):

        schedule = db.session.get(MedicineSchedule, schedule_id)

        if schedule is None:
            return None

        schedule.status = normalize_schedule_status(
            status,
            use_default=False
        )

        if note is not None:
            schedule.note = note

        db.session.commit()

        return schedule

    @staticmethod
    def delete(schedule_id):

        schedule = db.session.get(MedicineSchedule, schedule_id)

        if schedule is None:
            return False

        db.session.delete(schedule)

        db.session.commit()

        return True
