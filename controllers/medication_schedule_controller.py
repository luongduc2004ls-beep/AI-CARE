# ==========================================================
# medication_schedule_controller.py
# Controller quản lý lịch uống thuốc (MedicationSchedule)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Filter, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi MedicationScheduleService xử lý nghiệp vụ
#     - Trả về Response JSON chuẩn hóa bằng ResponseBuilder
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any

from flask import request

from middleware.response import ResponseBuilder
from middleware.validator import Validator
from services.medication_schedule_service import MedicationScheduleService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách lịch uống thuốc (Phân trang, Lọc)
# GET /api/medication-schedules
# ==========================================================

def get_all_medication_schedules() -> Any:
    """
    Xử lý API lấy danh sách lịch uống thuốc có hỗ trợ Phân trang và Lọc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    patient_id = request.args.get("patient_id", None, type=str)
    medicine_id = request.args.get("medicine_id", None, type=str)

    logger.info("Controller: Yêu cầu lấy danh sách lịch uống thuốc (Page=%s, PerPage=%s)", page, per_page)
    schedules, total = MedicationScheduleService.get_all(
        page=page,
        per_page=per_page,
        patient_id=patient_id,
        medicine_id=medicine_id
    )

    items = [schedule.to_dict() for schedule in schedules]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách lịch uống thuốc thành công",
        data=result_data
    )


# ==========================================================
# Lấy chi tiết lịch uống thuốc theo khóa chính
# GET /api/medication-schedules/<patient_id>/<medicine_id>/<scheduled_time>
# ==========================================================

def get_medication_schedule(patient_id: str, medicine_id: str, scheduled_time: str) -> Any:
    """
    Xử lý API lấy chi tiết một lịch uống thuốc.

    Args:
        patient_id (str): Mã bệnh nhân.
        medicine_id (str): Mã thuốc.
        scheduled_time (str): Giờ nhắc nhở.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy lịch uống thuốc ('%s', '%s', '%s')", patient_id, medicine_id, scheduled_time)
    schedule = MedicationScheduleService.get_by_id(patient_id, medicine_id, scheduled_time)

    if schedule is None:
        logger.warning("Controller: Không tìm thấy lịch uống thuốc")
        return ResponseBuilder.not_found(message="Không tìm thấy lịch uống thuốc")

    return ResponseBuilder.success(
        message="Lấy thông tin lịch uống thuốc thành công",
        data=schedule.to_dict()
    )


# ==========================================================
# Lấy danh sách lịch uống thuốc của 1 bệnh nhân
# GET /api/patients/<patient_id>/medication-schedules
# ==========================================================

def get_patient_medication_schedules(patient_id: str) -> Any:
    """
    Xử lý API lấy danh sách lịch uống thuốc của một bệnh nhân.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Lấy lịch uống thuốc cho bệnh nhân ID: '%s'", patient_id)
    schedules = MedicationScheduleService.get_by_patient_id(patient_id)
    items = [schedule.to_dict() for schedule in schedules]

    return ResponseBuilder.success(
        message="Lấy lịch uống thuốc của bệnh nhân thành công",
        data=items
    )


# ==========================================================
# Thêm mới lịch uống thuốc
# POST /api/medication-schedules
# ==========================================================

def create_medication_schedule() -> Any:
    """
    Xử lý API thêm mới một lịch uống thuốc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu tạo lịch uống thuốc mới.")
    data = request.get_json()

    if data is None or "patient_id" not in data or "medicine_id" not in data or "scheduled_time" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'patient_id', 'medicine_id' hoặc 'scheduled_time'")

    schedule = MedicationScheduleService.create(data)
    logger.info("Controller: Tạo thành công lịch uống thuốc")

    return ResponseBuilder.created(
        message="Thêm lịch uống thuốc thành công",
        data=schedule.to_dict()
    )


# ==========================================================
# Cập nhật lịch uống thuốc
# PUT /api/medication-schedules/<patient_id>/<medicine_id>/<scheduled_time>
# ==========================================================

def update_medication_schedule(patient_id: str, medicine_id: str, scheduled_time: str) -> Any:
    """
    Xử lý API cập nhật thông tin lịch uống thuốc.

    Args:
        patient_id (str): Mã bệnh nhân.
        medicine_id (str): Mã thuốc.
        scheduled_time (str): Giờ nhắc nhở.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật lịch uống thuốc")
    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    schedule = MedicationScheduleService.update(patient_id, medicine_id, scheduled_time, data)
    if schedule is None:
        return ResponseBuilder.not_found(message="Không tìm thấy lịch uống thuốc để cập nhật")

    return ResponseBuilder.updated(
        message="Cập nhật lịch uống thuốc thành công",
        data=schedule.to_dict()
    )


# ==========================================================
# Xóa lịch uống thuốc
# DELETE /api/medication-schedules/<patient_id>/<medicine_id>/<scheduled_time>
# ==========================================================

def delete_medication_schedule(patient_id: str, medicine_id: str, scheduled_time: str) -> Any:
    """
    Xử lý API xóa lịch uống thuốc.

    Args:
        patient_id (str): Mã bệnh nhân.
        medicine_id (str): Mã thuốc.
        scheduled_time (str): Giờ nhắc nhở.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa lịch uống thuốc")
    deleted = MedicationScheduleService.delete(patient_id, medicine_id, scheduled_time)

    if not deleted:
        return ResponseBuilder.not_found(message="Không tìm thấy lịch uống thuốc để xóa")

    return ResponseBuilder.deleted(message="Xóa lịch uống thuốc thành công")
