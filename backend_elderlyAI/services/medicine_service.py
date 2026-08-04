from datetime import date, datetime, time as time_type

from sqlalchemy import or_
from sqlalchemy.orm import selectinload

from database import db
from models.medicine import Medicine
from models.medicine_schedule import MedicineSchedule
from services.medicine_schedule_service import (
    DEFAULT_SCHEDULE_STATUS,
    normalize_schedule_status
)


def _get_value(data, *keys):

    for key in keys:
        if key in data:
            return data.get(key)

    return None


def _has_any(data, *keys):

    return any(key in data for key in keys)


def _parse_date(value, field_name):

    if value in (None, ""):
        return None

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
        return time_type(8, 0)

    if isinstance(value, time_type):
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


def _parse_quantity(value):

    if value in (None, ""):
        return 0

    try:
        quantity = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("Quantity must be a number") from exc

    if quantity < 0:
        raise ValueError("Quantity must be greater than or equal to 0")

    return quantity


def _schedule_sort_key(schedule):

    scheduled_date = schedule.scheduled_date or date.max
    take_time = schedule.take_time or time_type.max

    return scheduled_date, take_time


def _sorted_schedules(medicine):

    return sorted(
        medicine.schedules or [],
        key=_schedule_sort_key
    )


def _find_schedule_by_date(medicine, scheduled_date):

    if scheduled_date is None:
        return None

    for schedule in medicine.schedules or []:
        if schedule.scheduled_date == scheduled_date:
            return schedule

    return None


def _sync_program_schedule(medicine, data):

    if not _has_any(data, "time", "take_time", "status", "scheduled_date", "note"):
        return None

    scheduled_date = None

    if "scheduled_date" in data:
        scheduled_date = _parse_date(
            data.get("scheduled_date"),
            "scheduled_date"
        ) or date.today()

    schedule = _find_schedule_by_date(medicine, scheduled_date)

    if schedule is None:
        schedule = MedicineService.get_display_schedule(medicine)

    if schedule is None:
        raw_time = _get_value(data, "time", "take_time") or "08:00"
        take_time = _parse_time(
            raw_time,
            "time"
        )
        schedule = MedicineSchedule(
            medicine=medicine,
            scheduled_date=scheduled_date or date.today(),
            take_time=take_time,
            status=normalize_schedule_status(
                data.get("status"),
                use_default=True
            )
        )
        db.session.add(schedule)
    else:
        if scheduled_date is not None:
            schedule.scheduled_date = scheduled_date

        if _has_any(data, "time", "take_time"):
            schedule.take_time = _parse_time(
                _get_value(data, "time", "take_time"),
                "time"
            )

        if "status" in data:
            schedule.status = normalize_schedule_status(
                data.get("status"),
                use_default=False
            )

    if "note" in data:
        schedule.note = data.get("note")

    return schedule


class MedicineService:

    @staticmethod
    def get_display_schedule(medicine):

        schedules = _sorted_schedules(medicine)

        if not schedules:
            return None

        today = date.today()

        for schedule in schedules:
            if (
                schedule.scheduled_date == today
                and schedule.status != "Đã uống"
            ):
                return schedule

        for schedule in schedules:
            if schedule.scheduled_date == today:
                return schedule

        for schedule in schedules:
            if schedule.scheduled_date and schedule.scheduled_date >= today:
                return schedule

        return schedules[-1]

    @staticmethod
    def get_all():

        return Medicine.query.options(
            selectinload(Medicine.schedules)
        ).order_by(
            Medicine.created_at.desc()
        ).all()

    @staticmethod
    def get_by_id(id):

        return Medicine.query.options(
            selectinload(Medicine.schedules)
        ).filter(
            Medicine.medicine_id == id
        ).first()

    @staticmethod
    def create(data):

        if not data:
            raise ValueError("Request body is empty")

        medicine_name = _get_value(data, "medicine_name", "name")

        if not medicine_name:
            raise ValueError("Medicine name is required")

        medicine = Medicine(

            medicine_code=data.get("medicine_code"),

            medicine_name=str(medicine_name).strip(),

            dosage=data.get("dosage"),

            frequency=data.get("frequency"),

            quantity=_parse_quantity(data.get("quantity")),

            instruction=data.get("instruction"),

            start_date=_parse_date(
                data.get("start_date"),
                "start_date"
            ),

            expire_date=_parse_date(
                data.get("expire_date"),
                "expire_date"
            )

        )

        db.session.add(medicine)
        db.session.flush()

        _sync_program_schedule(medicine, data)

        db.session.commit()

        return medicine

    @staticmethod
    def update(id, data):

        medicine = MedicineService.get_by_id(id)

        if medicine is None:
            return None

        if not data:
            raise ValueError("Request body is empty")

        if "medicine_code" in data:
            medicine.medicine_code = data.get("medicine_code")

        if _has_any(data, "name", "medicine_name"):
            medicine_name = data.get("name") or data.get("medicine_name")

            if not medicine_name:
                raise ValueError("Medicine name is required")

            medicine.medicine_name = str(medicine_name).strip()

        if "dosage" in data:
            medicine.dosage = data.get("dosage")

        if "frequency" in data:
            medicine.frequency = data.get("frequency")

        if "quantity" in data:
            medicine.quantity = _parse_quantity(data.get("quantity"))

        if "instruction" in data:
            medicine.instruction = data.get("instruction")

        if "start_date" in data:
            medicine.start_date = _parse_date(
                data.get("start_date"),
                "start_date"
            )

        if "expire_date" in data:
            medicine.expire_date = _parse_date(
                data.get("expire_date"),
                "expire_date"
            )

        _sync_program_schedule(medicine, data)

        db.session.commit()

        return medicine

    @staticmethod
    def update_status(id, status, note=None):

        medicine = MedicineService.get_by_id(id)

        if medicine is None:
            return None

        data = {
            "status": status
        }

        if MedicineService.get_display_schedule(medicine) is None:
            data["time"] = datetime.now().strftime("%H:%M")

        if note is not None:
            data["note"] = note

        _sync_program_schedule(medicine, data)

        db.session.commit()

        return medicine

    @staticmethod
    def delete(id):

        medicine = db.session.get(Medicine, id)

        if medicine is None:
            return False

        db.session.delete(medicine)

        db.session.commit()

        return True

    @staticmethod
    def search(keyword):

        return Medicine.query.options(
            selectinload(Medicine.schedules)
        ).filter(

            or_(

                Medicine.medicine_name.like(f"%{keyword}%"),

                Medicine.dosage.like(f"%{keyword}%")

            )

        ).order_by(
            Medicine.medicine_name.asc()
        ).all()

    @staticmethod
    def low_stock():

        return Medicine.query.options(
            selectinload(Medicine.schedules)
        ).filter(

            Medicine.quantity < 10

        ).all()

    @staticmethod
    def expired():

        return Medicine.query.options(
            selectinload(Medicine.schedules)
        ).filter(

            Medicine.expire_date < datetime.today().date()

        ).all()
