# ==========================================================
# medicine_controller.py
# Controller quản lý danh mục thuốc (Medicine)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Search, Sort, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi MedicineService xử lý nghiệp vụ
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
from services.medicine_service import MedicineService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách thuốc (Phân trang, Tìm kiếm, Sắp xếp)
# GET /api/medicines
# ==========================================================

def get_all_medicines() -> Any:
    """
    Xử lý API lấy danh sách thuốc có Phân trang, Tìm kiếm và Sắp xếp.

    Query Params:
        page (int): Trang hiện tại (Mặc định 1).
        per_page (int): Số lượng item/trang (Mặc định 10).
        search (str): Từ khóa tìm kiếm.
        sort_by (str): Cột sắp xếp (Mặc định 'medicine_id').
        order (str): Thứ tự 'asc' hoặc 'desc' (Mặc định 'asc').

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", None, type=str)
    sort_by = request.args.get("sort_by", "medicine_id", type=str)
    order = request.args.get("order", "asc", type=str)

    logger.info("Controller: Yêu cầu lấy danh sách thuốc (Page=%s, PerPage=%s)", page, per_page)
    medicines, total = MedicineService.get_all(
        page=page,
        per_page=per_page,
        search=search,
        sort_by=sort_by,
        order=order
    )

    items = [medicine.to_dict() for medicine in medicines]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách thuốc thành công",
        data=result_data
    )


# ==========================================================
# Lấy chi tiết thuốc theo ID
# GET /api/medicines/<medicine_id>
# ==========================================================

def get_medicine(medicine_id: str) -> Any:
    """
    Xử lý API lấy thông tin chi tiết thuốc theo ID.

    Args:
        medicine_id (str): Mã thuốc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy chi tiết thuốc ID: '%s'", medicine_id)
    medicine = MedicineService.get_by_id(medicine_id)

    if medicine is None:
        logger.warning("Controller: Không tìm thấy thuốc ID: '%s'", medicine_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin thuốc")

    return ResponseBuilder.success(
        message="Lấy thông tin thuốc thành công",
        data=medicine.to_dict()
    )


# ==========================================================
# Thêm mới thuốc
# POST /api/medicines
# ==========================================================

def create_medicine() -> Any:
    """
    Xử lý API thêm mới một loại thuốc vào danh mục.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu thêm thuốc mới.")
    data = request.get_json()

    if data is None or "medicine_id" not in data or "medicine_name" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'medicine_id' hoặc 'medicine_name'")

    is_valid, message = Validator.validate_medicine(data)
    if not is_valid:
        logger.warning("Controller: Dữ liệu thuốc không hợp lệ: %s", message)
        return ResponseBuilder.bad_request(message=message)

    # Kiểm tra xem medicine_id đã tồn tại chưa
    existing = MedicineService.get_by_id(data["medicine_id"])
    if existing:
        logger.warning("Controller: medicine_id '%s' đã tồn tại", data["medicine_id"])
        return ResponseBuilder.conflict(message=f"Thuốc với mã '{data['medicine_id']}' đã tồn tại")

    medicine = MedicineService.create(data)
    logger.info("Controller: Tạo thành công thuốc ID: '%s'", medicine.medicine_id)

    return ResponseBuilder.created(
        message="Thêm thuốc vào danh mục thành công",
        data=medicine.to_dict()
    )


# ==========================================================
# Cập nhật thông tin thuốc
# PUT /api/medicines/<medicine_id>
# ==========================================================

def update_medicine(medicine_id: str) -> Any:
    """
    Xử lý API cập nhật thông tin thuốc theo ID.

    Args:
        medicine_id (str): Mã thuốc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật thuốc ID: '%s'", medicine_id)
    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    medicine = MedicineService.update(medicine_id, data)

    if medicine is None:
        logger.warning("Controller: Không tìm thấy thuốc ID '%s' để cập nhật", medicine_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin thuốc")

    logger.info("Controller: Cập nhật thành công thuốc ID: '%s'", medicine_id)
    return ResponseBuilder.updated(
        message="Cập nhật thông tin thuốc thành công",
        data=medicine.to_dict()
    )


# ==========================================================
# Xóa thuốc
# DELETE /api/medicines/<medicine_id>
# ==========================================================

def delete_medicine(medicine_id: str) -> Any:
    """
    Xử lý API xóa một loại thuốc theo ID.

    Args:
        medicine_id (str): Mã thuốc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa thuốc ID: '%s'", medicine_id)
    deleted = MedicineService.delete(medicine_id)

    if not deleted:
        logger.warning("Controller: Không tìm thấy thuốc ID '%s' để xóa", medicine_id)
        return ResponseBuilder.not_found(message="Không tìm thấy thông tin thuốc")

    logger.info("Controller: Xóa thành công thuốc ID: '%s'", medicine_id)
    return ResponseBuilder.deleted(message="Xóa thuốc thành công")