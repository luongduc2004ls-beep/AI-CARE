# ==========================================================
# caregiver_controller.py
# Controller quản lý người chăm sóc (Caregiver)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Search, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi CaregiverService xử lý nghiệp vụ
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
from services.caregiver_service import CaregiverService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách người chăm sóc (Phân trang, Tìm kiếm)
# GET /api/caregivers
# ==========================================================

def get_all_caregivers() -> Any:
    """
    Xử lý API lấy danh sách người chăm sóc có Phân trang và Tìm kiếm.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", None, type=str)

    logger.info("Controller: Yêu cầu lấy danh sách người chăm sóc (Page=%s, PerPage=%s)", page, per_page)
    caregivers, total = CaregiverService.get_all(page=page, per_page=per_page, search=search)

    items = [caregiver.to_dict() for caregiver in caregivers]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách người chăm sóc thành công",
        data=result_data
    )


# ==========================================================
# Lấy danh sách người chăm sóc của 1 bệnh nhân
# GET /api/patients/<patient_id>/caregivers
# ==========================================================

def get_patient_caregivers(patient_id: str) -> Any:
    """
    Xử lý API lấy danh sách người chăm sóc của một bệnh nhân.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy người chăm sóc cho bệnh nhân ID: '%s'", patient_id)
    caregivers = CaregiverService.get_by_patient_id(patient_id)
    items = [caregiver.to_dict() for caregiver in caregivers]

    return ResponseBuilder.success(
        message="Lấy danh sách người chăm sóc của bệnh nhân thành công",
        data=items
    )


# ==========================================================
# Thêm mới người chăm sóc
# POST /api/caregivers
# ==========================================================

def create_caregiver() -> Any:
    """
    Xử lý API phân công / thêm người chăm sóc mới.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu tạo người chăm sóc mới.")
    data = request.get_json()

    if data is None or "patient_id" not in data or "caregiver_name" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'patient_id' hoặc 'caregiver_name'")

    caregiver = CaregiverService.create(data)
    logger.info("Controller: Tạo thành công người chăm sóc '%s'", caregiver.caregiver_name)

    return ResponseBuilder.created(
        message="Thêm người chăm sóc thành công",
        data=caregiver.to_dict()
    )


# ==========================================================
# Cập nhật thông tin người chăm sóc
# PUT /api/caregivers/<patient_id>/<caregiver_name>
# ==========================================================

def update_caregiver(patient_id: str, caregiver_name: str) -> Any:
    """
    Xử lý API cập nhật thông tin người chăm sóc.

    Args:
        patient_id (str): Mã bệnh nhân.
        caregiver_name (str): Tên người chăm sóc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật người chăm sóc '%s'", caregiver_name)
    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    caregiver = CaregiverService.update(patient_id, caregiver_name, data)
    if caregiver is None:
        return ResponseBuilder.not_found(message="Không tìm thấy người chăm sóc để cập nhật")

    return ResponseBuilder.updated(
        message="Cập nhật thông tin người chăm sóc thành công",
        data=caregiver.to_dict()
    )


# ==========================================================
# Xóa người chăm sóc
# DELETE /api/caregivers/<patient_id>/<caregiver_name>
# ==========================================================

def delete_caregiver(patient_id: str, caregiver_name: str) -> Any:
    """
    Xử lý API xóa người chăm sóc.

    Args:
        patient_id (str): Mã bệnh nhân.
        caregiver_name (str): Tên người chăm sóc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa người chăm sóc '%s'", caregiver_name)
    deleted = CaregiverService.delete(patient_id, caregiver_name)

    if not deleted:
        return ResponseBuilder.not_found(message="Không tìm thấy người chăm sóc để xóa")

    return ResponseBuilder.deleted(message="Xóa người chăm sóc thành công")
