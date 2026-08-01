# ==========================================================
# notification_controller.py
# Controller quản lý thông báo và cảnh báo (Notification)
# Chức năng:
#     - Nhận Request từ Client (Pagination, Filter, Body)
#     - Validate dữ liệu đầu vào bằng Validator
#     - Gọi NotificationService xử lý nghiệp vụ
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
from services.notification_service import NotificationService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy danh sách thông báo (Phân trang, Lọc)
# GET /api/notifications
# ==========================================================

def get_all_notifications() -> Any:
    """
    Xử lý API lấy danh sách thông báo có hỗ trợ Phân trang và Lọc.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    patient_id = request.args.get("patient_id", None, type=str)
    alert_status = request.args.get("alert_status", None, type=str)

    logger.info("Controller: Yêu cầu lấy danh sách thông báo (Page=%s, PerPage=%s)", page, per_page)
    notifications, total = NotificationService.get_all(
        page=page,
        per_page=per_page,
        patient_id=patient_id,
        alert_status=alert_status
    )

    items = [notification.to_dict() for notification in notifications]
    result_data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1
    }

    return ResponseBuilder.success(
        message="Lấy danh sách thông báo thành công",
        data=result_data
    )


# ==========================================================
# Lấy chi tiết thông báo theo (patient_id, timestamp)
# GET /api/notifications/<patient_id>/<timestamp>
# ==========================================================

def get_notification(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API lấy chi tiết một bản ghi thông báo.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian phát sinh thông báo.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy thông báo ('%s', '%s')", patient_id, timestamp)
    notification = NotificationService.get_by_id(patient_id, timestamp)

    if notification is None:
        logger.warning("Controller: Không tìm thấy thông báo")
        return ResponseBuilder.not_found(message="Không tìm thấy thông báo")

    return ResponseBuilder.success(
        message="Lấy thông tin thông báo thành công",
        data=notification.to_dict()
    )


# ==========================================================
# Lấy danh sách thông báo của 1 bệnh nhân
# GET /api/patients/<patient_id>/notifications
# ==========================================================

def get_patient_notifications(patient_id: str) -> Any:
    """
    Xử lý API lấy danh sách thông báo của một bệnh nhân.

    Args:
        patient_id (str): Mã bệnh nhân.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Lấy thông báo cho bệnh nhân ID: '%s'", patient_id)
    notifications = NotificationService.get_by_patient_id(patient_id)
    items = [notification.to_dict() for notification in notifications]

    return ResponseBuilder.success(
        message="Lấy thông báo của bệnh nhân thành công",
        data=items
    )


# ==========================================================
# Thêm mới thông báo
# POST /api/notifications
# ==========================================================

def create_notification() -> Any:
    """
    Xử lý API tạo mới một thông báo / cảnh báo.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu tạo thông báo mới.")
    data = request.get_json()

    if data is None or "patient_id" not in data or "timestamp" not in data:
        logger.warning("Controller: Dữ liệu gửi lên rỗng hoặc thiếu trường bắt buộc.")
        return ResponseBuilder.bad_request(message="Thiếu trường 'patient_id' hoặc 'timestamp'")

    notification = NotificationService.create(data)
    logger.info("Controller: Tạo thành công thông báo")

    return ResponseBuilder.created(
        message="Tạo thông báo thành công",
        data=notification.to_dict()
    )


# ==========================================================
# Cập nhật thông báo
# PUT /api/notifications/<patient_id>/<timestamp>
# ==========================================================

def update_notification(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API cập nhật thông tin thông báo.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian phát sinh thông báo.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu cập nhật thông báo ('%s', '%s')", patient_id, timestamp)
    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(message="Dữ liệu yêu cầu không hợp lệ")

    notification = NotificationService.update(patient_id, timestamp, data)
    if notification is None:
        return ResponseBuilder.not_found(message="Không tìm thấy thông báo để cập nhật")

    return ResponseBuilder.updated(
        message="Cập nhật thông báo thành công",
        data=notification.to_dict()
    )


# ==========================================================
# Xóa thông báo
# DELETE /api/notifications/<patient_id>/<timestamp>
# ==========================================================

def delete_notification(patient_id: str, timestamp: str) -> Any:
    """
    Xử lý API xóa một thông báo.

    Args:
        patient_id (str): Mã bệnh nhân.
        timestamp (str): Thời gian phát sinh thông báo.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu xóa thông báo ('%s', '%s')", patient_id, timestamp)
    deleted = NotificationService.delete(patient_id, timestamp)

    if not deleted:
        return ResponseBuilder.not_found(message="Không tìm thấy thông báo để xóa")

    return ResponseBuilder.deleted(message="Xóa thông báo thành công")
