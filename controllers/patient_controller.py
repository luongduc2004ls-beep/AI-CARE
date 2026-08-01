# ==========================================================
# patient_controller.py
# Controller quản lý bệnh nhân (Patient)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Filter, Sort, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi PatientService xử lý nghiệp vụ
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
from services.patient_service import PatientService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách bệnh nhân (Phân trang, Tìm kiếm, Lọc, Sắp xếp)
# GET /api/patients
# ==========================================================

def get_all_patients() -> Any:
    """
    Xử lý API lấy danh sách bệnh nhân có hỗ trợ Phân trang, Tìm kiếm và Sắp xếp.

    Query Params:
        page (int): Trang hiện tại (Mặc định 1).
        per_page (int): Số lượng item/trang (Mặc định 10).
        search (str): Từ khóa tìm kiếm.
        sort_by (str): Cột sắp xếp (Mặc định 'patient_id').
        order (str): Thứ tự 'asc' hoặc 'desc' (Mặc định 'asc').

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", None, type=str)
    sort_by = request.args.get("sort_by", "patient_id", type=str)
    order = request.args.get("order", "asc", type=str)

    logger.info("Controller: Yêu cầu lấy danh sách bệnh nhân (Page=%s, PerPage=%s)", page, per_page)
    patients, total = PatientService.get_all(
        page=page,
        per_page=per_page,
        search=search,
        sort_by=sort_by,
        order=order
    )

    items = [patient.to_dict() for patient in patients]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách bệnh nhân thành công",
        data=result_data
    )


# ==========================================================
# Lấy chi tiết bệnh nhân theo ID
# GET /api/patients/<patient_id>
# ==========================================================

def get_patient(patient_id: str) -> Any:
    """
    Xử lý API lấy thông tin chi tiết một bệnh nhân theo ID.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy chi tiết bệnh nhân ID: '%s'", patient_id)
    patient = PatientService.get_by_id(patient_id)

    if patient is None:
        logger.warning("Controller: Không tìm thấy bệnh nhân ID: '%s'", patient_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin bệnh nhân")

    return ResponseBuilder.success(
        message="Lấy thông tin bệnh nhân thành công",
        data=patient.to_dict()
    )


# ==========================================================
# Thêm mới hồ sơ bệnh nhân
# POST /api/patients
# ==========================================================

def create_patient() -> Any:
    """
    Xử lý API thêm mới một hồ sơ bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu tạo mới bệnh nhân.")
    data = request.get_json()

    if data is None:
        logger.warning("Controller: Dữ liệu gửi lên rỗng.")
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    is_valid, message = Validator.validate_patient(data)
    if not is_valid:
        logger.warning("Controller: Dữ liệu bệnh nhân không hợp lệ: %s", message)
        return ResponseBuilder.bad_request(message=message)

    # Kiểm tra xem patient_id đã tồn tại chưa
    existing = PatientService.get_by_id(data["patient_id"])
    if existing:
        logger.warning("Controller: patient_id '%s' đã tồn tại", data["patient_id"])
        return ResponseBuilder.conflict(message=f"Bệnh nhân với mã '{data['patient_id']}' đã tồn tại")

    patient = PatientService.create(data)
    logger.info("Controller: Tạo thành công bệnh nhân ID: '%s'", patient.patient_id)

    return ResponseBuilder.created(
        message="Thêm hồ sơ bệnh nhân thành công",
        data=patient.to_dict()
    )


# ==========================================================
# Cập nhật thông tin bệnh nhân
# PUT /api/patients/<patient_id>
# ==========================================================

def update_patient(patient_id: str) -> Any:
    """
    Xử lý API cập nhật thông tin bệnh nhân theo ID.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật bệnh nhân ID: '%s'", patient_id)
    data = request.get_json()

    if data is None:
        logger.warning("Controller: Dữ liệu gửi lên rỗng.")
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    patient = PatientService.update(patient_id, data)

    if patient is None:
        logger.warning("Controller: Không tìm thấy bệnh nhân ID '%s' để cập nhật", patient_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin bệnh nhân")

    logger.info("Controller: Cập nhật thành công bệnh nhân ID: '%s'", patient_id)
    return ResponseBuilder.updated(
        message="Cập nhật hồ sơ bệnh nhân thành công",
        data=patient.to_dict()
    )


# ==========================================================
# Xóa hồ sơ bệnh nhân
# DELETE /api/patients/<patient_id>
# ==========================================================

def delete_patient(patient_id: str) -> Any:
    """
    Xử lý API xóa một hồ sơ bệnh nhân theo ID.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa bệnh nhân ID: '%s'", patient_id)
    deleted = PatientService.delete(patient_id)

    if not deleted:
        logger.warning("Controller: Không tìm thấy bệnh nhân ID '%s' để xóa", patient_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin bệnh nhân")

    logger.info("Controller: Xóa thành công bệnh nhân ID: '%s'", patient_id)
    return ResponseBuilder.deleted(message="Xóa hồ sơ bệnh nhân thành công")
