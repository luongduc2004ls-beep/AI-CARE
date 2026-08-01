# ==========================================================
# notification_routes.py
# Định nghĩa toàn bộ API Route cho quản lý thông báo / cảnh báo
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

from flask import Blueprint

from controllers.notification_controller import (
    count_unread_notifications,
    create_notification,
    delete_notification,
    get_all_notifications,
    get_notification,
    get_patient_notifications,
    get_unread_notifications,
    mark_all_as_read,
    mark_as_read,
)

# ==========================================================
# Khởi tạo Blueprint
# ==========================================================

notification_bp = Blueprint(
    "notification",
    __name__
)


# ==========================================================
# Khai báo các API Endpoints
# ==========================================================

@notification_bp.route("/api/notifications", methods=["GET"])
def route_get_all_notifications():
    """
    Route lấy toàn bộ danh sách thông báo.
    """
    return get_all_notifications()


@notification_bp.route("/api/notifications/unread", methods=["GET"])
def route_get_unread_notifications():
    """
    Route lấy danh sách thông báo chưa đọc.
    """
    return get_unread_notifications()


@notification_bp.route("/api/notifications/unread-count", methods=["GET"])
def route_count_unread_notifications():
    """
    Route đếm số lượng thông báo chưa đọc.
    """
    return count_unread_notifications()


@notification_bp.route("/api/notifications/<int:notification_id>", methods=["GET"])
def route_get_notification(notification_id: int):
    """
    Route lấy chi tiết thông báo theo ID.
    """
    return get_notification(notification_id)


@notification_bp.route("/api/patients/<int:patient_id>/notifications", methods=["GET"])
def route_get_patient_notifications(patient_id: int):
    """
    Route lấy thông báo dành cho một bệnh nhân.
    """
    return get_patient_notifications(patient_id)


@notification_bp.route("/api/notifications", methods=["POST"])
def route_create_notification():
    """
    Route tạo thông báo mới.
    """
    return create_notification()


@notification_bp.route("/api/notifications/read-all", methods=["PUT"])
def route_mark_all_as_read():
    """
    Route đánh dấu tất cả thông báo là đã đọc.
    """
    return mark_all_as_read()


@notification_bp.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def route_mark_as_read(notification_id: int):
    """
    Route đánh dấu thông báo theo ID là đã đọc.
    """
    return mark_as_read(notification_id)


@notification_bp.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
def route_delete_notification(notification_id: int):
    """
    Route xóa thông báo theo ID.
    """
    return delete_notification(notification_id)
