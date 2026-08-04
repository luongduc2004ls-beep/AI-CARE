from flask import request

from middleware.response import error, success
from services.medicine_schedule_service import MedicineScheduleService


def _date_to_text(value):

    if value is None:
        return None

    return value.isoformat()


def _time_to_text(value):

    if value is None:
        return None

    return value.strftime("%H:%M")


def _datetime_to_text(value):

    if value is None:
        return None

    return value.isoformat()


def _schedule_to_dict(item):

    scheduled_date = _date_to_text(item.scheduled_date)
    take_time = _time_to_text(item.take_time)

    result = {

        "schedule_id": item.schedule_id,
        "id": item.schedule_id,
        "medicine_id": item.medicine_id,
        "user_id": item.user_id,
        "scheduled_date": scheduled_date,
        "date": scheduled_date,
        "take_time": take_time,
        "time": take_time,
        "status": item.status,
        "note": item.note,
        "created_at": _datetime_to_text(item.created_at),
        "updated_at": _datetime_to_text(item.updated_at)

    }

    if item.user:
        result["patient"] = {
            "user_id": item.user.user_id,
            "patient_code": item.user.patient_code,
            "full_name": item.user.full_name
        }

    if item.medicine:
        result["medicine"] = {
            "medicine_id": item.medicine.medicine_id,
            "medicine_name": item.medicine.medicine_name,
            "dosage": item.medicine.dosage
        }

    return result


def get_all_medicine_schedules():

    filters = {
        "medicine_id": request.args.get("medicine_id"),
        "user_id": request.args.get("user_id"),
        "scheduled_date": request.args.get("scheduled_date") or request.args.get("date"),
        "status": request.args.get("status")
    }

    try:
        schedules = MedicineScheduleService.get_all(filters)
    except ValueError as exc:
        return error(str(exc),400)

    result = []

    for item in schedules:
        result.append(_schedule_to_dict(item))

    return success("Medicine schedule list", result)


def get_medicine_schedule(schedule_id):

    schedule = MedicineScheduleService.get_by_id(schedule_id)

    if schedule is None:
        return error("Medicine schedule not found",404)

    return success(
        "Medicine schedule detail",
        _schedule_to_dict(schedule)
    )


def get_medicine_schedules_by_medicine(medicine_id):

    schedules = MedicineScheduleService.get_by_medicine(medicine_id)

    result = []

    for item in schedules:
        result.append(_schedule_to_dict(item))

    return success("Medicine schedule list", result)


def create_medicine_schedule():

    data = request.get_json(silent=True)

    try:
        schedule = MedicineScheduleService.create(data)
    except LookupError as exc:
        return error(str(exc),404)
    except ValueError as exc:
        return error(str(exc),400)

    return success(
        "Medicine schedule created",
        _schedule_to_dict(schedule),
        201
    )


def update_medicine_schedule(schedule_id):

    data = request.get_json(silent=True)

    try:
        schedule = MedicineScheduleService.update(schedule_id,data)
    except LookupError as exc:
        return error(str(exc),404)
    except ValueError as exc:
        return error(str(exc),400)

    if schedule is None:
        return error("Medicine schedule not found",404)

    return success(
        "Medicine schedule updated",
        _schedule_to_dict(schedule)
    )


def update_medicine_schedule_status(schedule_id):

    data = request.get_json(silent=True) or {}

    try:
        schedule = MedicineScheduleService.update_status(
            schedule_id,
            data.get("status"),
            data.get("note")
        )
    except ValueError as exc:
        return error(str(exc),400)

    if schedule is None:
        return error("Medicine schedule not found",404)

    return success(
        "Medicine schedule status updated",
        _schedule_to_dict(schedule)
    )


def delete_medicine_schedule(schedule_id):

    deleted = MedicineScheduleService.delete(schedule_id)

    if not deleted:
        return error("Medicine schedule not found",404)

    return success("Medicine schedule deleted")
