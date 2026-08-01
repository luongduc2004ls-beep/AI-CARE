# ==========================================================
# health_controller.py
# Controller quản lý hồ sơ chỉ số sức khỏe (HealthRecord)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Filter, Sort, Search, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi HealthService xử lý nghiệp vụ
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
from services.health_service import HealthService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách chỉ số sức khỏe (Phân trang, Lọc, Tìm kiếm, Sắp xếp)
# GET /api/health-records
# ==========================================================

def get_all_health_records() -> Any:
    """
    Xử lý API lấy danh sách chỉ số sức khỏe có Phân trang, Lọc và Sắp xếp.

    Query Params:
        page (int): Trang hiện tại (Mặc định 1).
        per_page (int): Số lượng item/trang (Mặc định 10).
        patient_id (str): Lọc theo mã bệnh nhân.
        risk_level (str): Lọc theo mức rủi ro (Thấp/Trung bình/Cao).
        search (str): Từ khóa tìm kiếm.
        sort_by (str): Cột sắp xếp (Mặc định 'timestamp').
        order (str): Thứ tự 'asc' hoặc 'desc' (Mặc định 'desc').

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    patient_id = request.args.get("patient_id", None, type=str)
    risk_level = request.args.get("risk_level", None, type=str)
    search = request.args.get("search", None, type=str)
    sort_by = request.args.get("sort_by", "timestamp", type=str)
    order = request.args.get("order", "desc", type=str)

    logger.info("Controller: Yêu cầu lấy danh sách chỉ số sức khỏe (Page=%s, PerPage=%s)", page, per_page)
    records, total = HealthService.get_all(
        page=page,
        per_page=per_page,
        patient_id=patient_id,
        risk_level=risk_level,
        search=search,
        sort_by=sort_by,
        order=order
    )

    items = [record.to_dict() for record in records]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách chỉ số sức khỏe thành công",
        data=result_data
    )


# ==========================================================
# Lấy chi tiết bản ghi sức khỏe theo (patient_id, timestamp)
# GET /api/health-records/<patient_id>/<timestamp>
# ==========================================================

def get_health_record(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API lấy chi tiết một bản ghi chỉ số sức khỏe.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian ghi nhận.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
    record = HealthService.get_by_id(patient_id, timestamp)

    if record is None:
        logger.warning("Controller: Không tìm thấy bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
        return ResponseBuilder.not_found(message="Không tìm thấy bản ghi chỉ số sức khỏe")

    return ResponseBuilder.success(
        message="Lấy thông tin chỉ số sức khỏe thành công",
        data=record.to_dict()
    )


# ==========================================================
# Lấy bản ghi sức khỏe mới nhất của bệnh nhân
# GET /api/patients/<patient_id>/health-records/latest
# ==========================================================

def get_latest_patient_health_record(patient_id: str) -> Any:
    """
    Xử lý API lấy chỉ số sức khỏe gần nhất của một bệnh nhân.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Lấy chỉ số sức khỏe mới nhất bệnh nhân ID: '%s'", patient_id)
    record = HealthService.get_latest_by_patient_id(patient_id)

    if record is None:
        logger.warning("Controller: Chưa có dữ liệu sức khỏe cho bệnh nhân '%s'", patient_id)
        return ResponseBuilder.not_found(message="Chưa có dữ liệu chỉ số sức khỏe cho bệnh nhân này")

    return ResponseBuilder.success(
        message="Lấy chỉ số sức khỏe mới nhất thành công",
        data=record.to_dict()
    )


# ==========================================================
# Ghi nhận chỉ số sức khỏe mới
# POST /api/health-records
# ==========================================================

def create_health_record() -> Any:
    """
    Xử lý API ghi nhận bản ghi chỉ số sức khỏe mới.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu ghi nhận chỉ số sức khỏe mới.")
    data = request.get_json()

    if data is None or "patient_id" not in data or "timestamp" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'patient_id' hoặc 'timestamp'")

    record = HealthService.create(data)
    logger.info("Controller: Tạo thành công bản ghi sức khỏe cho bệnh nhân '%s'", record.patient_id)

    return ResponseBuilder.created(
        message="Ghi nhận chỉ số sức khỏe thành công",
        data=record.to_dict()
    )


# ==========================================================
# Cập nhật bản ghi sức khỏe
# PUT /api/health-records/<patient_id>/<timestamp>
# ==========================================================

def update_health_record(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API cập nhật thông tin chỉ số sức khỏe.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian ghi nhận.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    record = HealthService.update(patient_id, timestamp, data)
    if record is None:
        return ResponseBuilder.not_found(message="Không tìm thấy bản ghi chỉ số sức khỏe để cập nhật")

    return ResponseBuilder.updated(
        message="Cập nhật chỉ số sức khỏe thành công",
        data=record.to_dict()
    )


# ==========================================================
# Xóa bản ghi sức khỏe
# DELETE /api/health-records/<patient_id>/<timestamp>
# ==========================================================

def delete_health_record(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API xóa bản ghi chỉ số sức khỏe.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian ghi nhận.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
    deleted = HealthService.delete(patient_id, timestamp)

    if not deleted:
        return ResponseBuilder.not_found(message="Không tìm thấy bản ghi chỉ số sức khỏe để xóa")

    return ResponseBuilder.deleted(message="Xóa bản ghi chỉ số sức khỏe thành công")
