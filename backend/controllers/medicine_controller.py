from flask import request
from services.medicine_service import MedicineService
from services.medicine_schedule_service import DEFAULT_SCHEDULE_STATUS
from middleware.response import success, error


def _date_to_text(value):

    if value is None:
        return None

    return value.isoformat()


def _datetime_to_text(value):

    if value is None:
        return None

    return value.isoformat()


def _time_to_text(value):

    if value is None:
        return None

    return value.strftime("%H:%M")


def _medicine_to_dict(item):

    schedule = MedicineService.get_display_schedule(item)
    schedule_time = ""
    schedule_status = DEFAULT_SCHEDULE_STATUS
    schedule_id = None
    scheduled_date = None

    if schedule is not None:
        schedule_time = _time_to_text(schedule.take_time) or ""
        schedule_status = schedule.status
        schedule_id = schedule.schedule_id
        scheduled_date = _date_to_text(schedule.scheduled_date)

    return {

        "medicine_id": item.medicine_id,
        "medicine_code": item.medicine_code,
        "id": item.medicine_id,
        "medicine_name": item.medicine_name,
        "name": item.medicine_name,
        "dosage": item.dosage,
        "frequency": item.frequency,
        "quantity": item.quantity,
        "instruction": item.instruction,
        "start_date": _date_to_text(item.start_date),
        "expire_date": _date_to_text(item.expire_date),
        "schedule_id": schedule_id,
        "scheduled_date": scheduled_date,
        "time": schedule_time,
        "status": schedule_status,
        "created_at": _datetime_to_text(item.created_at),
        "updated_at": _datetime_to_text(item.updated_at)

    }


def get_all_medicines():

    medicines = MedicineService.get_all()

    result = []

    for item in medicines:

        result.append(_medicine_to_dict(item))

    return success("Medicine list", result)


def get_medicine(medicine_id):

    medicine = MedicineService.get_by_id(medicine_id)

    if medicine is None:
        return error("Medicine not found",404)

    return success("Medicine detail", _medicine_to_dict(medicine))


def create_medicine():

    data = request.get_json(silent=True)

    try:
        medicine = MedicineService.create(data)
    except ValueError as exc:
        return error(str(exc),400)

    return success(

        "Medicine created",

        _medicine_to_dict(medicine),

        201

    )


def update_medicine(medicine_id):

    data = request.get_json(silent=True)

    try:
        medicine = MedicineService.update(medicine_id,data)
    except ValueError as exc:
        return error(str(exc),400)

    if medicine is None:

        return error("Medicine not found",404)

    return success("Medicine updated", _medicine_to_dict(medicine))


def update_medicine_status(medicine_id):

    data = request.get_json(silent=True) or {}

    try:
        medicine = MedicineService.update_status(
            medicine_id,
            data.get("status"),
            data.get("note")
        )
    except ValueError as exc:
        return error(str(exc),400)

    if medicine is None:

        return error("Medicine not found",404)

    return success("Medicine status updated", _medicine_to_dict(medicine))


def delete_medicine(medicine_id):

    deleted = MedicineService.delete(medicine_id)

    if not deleted:

        return error("Medicine not found",404)

    return success("Medicine deleted")


def search_medicine():

    keyword = request.args.get("keyword","")

    medicines = MedicineService.search(keyword)

    result = []

    for item in medicines:

        result.append(_medicine_to_dict(item))

    return success("Search result",result)


def expired_medicine():

    medicines = MedicineService.expired()

    result=[]

    for item in medicines:

        result.append(_medicine_to_dict(item))

    return success("Expired medicine",result)


def low_stock():

    medicines=MedicineService.low_stock()

    result=[]

    for item in medicines:

        result.append(_medicine_to_dict(item))

    return success("Low stock",result)
