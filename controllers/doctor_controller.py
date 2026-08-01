# ==========================================================
# doctor_controller.py
# Controller quản lý bác sĩ điều trị (Doctor)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Search, Body)
#     - Validate dữ liệu đầu vào
#     - Gọi DoctorService xử lý nghiệp vụ
#     - Trả về Response JSON chuẩn hóa bằng ResponseBuilder
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any

from flask import request

from middleware.response import ResponseBuilder
from services.doctor_service import DoctorService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách bác sĩ (Phân trang, Tìm kiếm)
# GET /api/doctors
# ==========================================================

def get_all_doctors() -> Any:
    """
    Xử lý API lấy danh sách bác sĩ điều trị có Phân trang và Tìm kiếm.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", None, type=str)

    logger.info("Controller: Yêu cầu lấy danh sách bác sĩ (Page=%s, PerPage=%s)", page, per_page)
    doctors, total = DoctorService.get_all(page=page, per_page=per_page, search=search)

    items = [doctor.to_dict() for doctor in doctors]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách bác sĩ thành công",
        data=result_data
    )


# ==========================================================
# Lấy danh sách bác sĩ của 1 bệnh nhân
# GET /api/patients/<patient_id>/doctors
# ==========================================================

def get_patient_doctors(patient_id: str) -> Any:
    """
    Xử lý API lấy danh sách bác sĩ quản lý một bệnh nhân.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy danh sách bác sĩ cho bệnh nhân ID: '%s'", patient_id)
    doctors = DoctorService.get_by_patient_id(patient_id)
    items = [doctor.to_dict() for doctor in doctors]

    return ResponseBuilder.success(
        message="Lấy danh sách bác sĩ của bệnh nhân thành công",
        data=items
    )


# ==========================================================
# Thêm mới bác sĩ
# POST /api/doctors
# ==========================================================

def create_doctor() -> Any:
    """
    Xử lý API phân công / thêm bác sĩ điều trị.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu tạo bác sĩ mới.")
    data = request.get_json()

    if data is None or "patient_id" not in data or "doctor_name" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'patient_id' hoặc 'doctor_name'")

    doctor = DoctorService.create(data)
    logger.info("Controller: Tạo thành công bác sĩ '%s'", doctor.doctor_name)

    return ResponseBuilder.created(
        message="Thêm bác sĩ thành công",
        data=doctor.to_dict()
    )


# ==========================================================
# Xóa bác sĩ
# DELETE /api/doctors/<patient_id>/<doctor_name>
# ==========================================================

def delete_doctor(patient_id: str, doctor_name: str) -> Any:
    """
    Xử lý API xóa phân công bác sĩ.

    Args:
        patient_id (str): Mã bệnh nhân.
        doctor_name (str): Tên bác sĩ.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa bác sĩ '%s'", doctor_name)
    deleted = DoctorService.delete(patient_id, doctor_name)

    if not deleted:
        return ResponseBuilder.not_found(message="Không tìm thấy bác sĩ để xóa")

    return ResponseBuilder.deleted(message="Xóa bác sĩ thành công")
