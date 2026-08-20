from flask import Blueprint, jsonify, request
from services.notification_service import (
    get_all_notifications,
    get_unread_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    delete_notification,
    create_notification
)

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("/notifications", methods=["GET"])
@notification_bp.route("/alerts", methods=["GET"])
def list_notifications():
    """Lấy danh sách thông báo và cảnh báo theo phân quyền Role & Bệnh nhân"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")
    limit = request.args.get("limit", 100, type=int)

    # Nếu gọi qua route /my/alerts thì mặc định role là User
    if request.path.endswith("/my/alerts"):
        user_role = user_role or "User"

    data = get_all_notifications(user_id=user_id, user_role=user_role, patient_id=patient_id, limit=limit)
    return jsonify({
        "success": True,
        "total": len(data),
        "data": data
    }), 200


@notification_bp.route("/notifications", methods=["POST"])
def new_notification():
    """Tạo mới một thông báo / cảnh báo"""
    payload = request.get_json() or {}
    data = create_notification(payload)
    return jsonify({
        "success": True,
        "data": data
    }), 201


@notification_bp.route("/notifications/history", methods=["GET"])
def notification_history():
    """Lấy lịch sử tất cả các cảnh báo đã từng xuất hiện theo phân quyền"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")
    limit = request.args.get("limit", 100, type=int)

    data = get_all_notifications(user_id=user_id, user_role=user_role, patient_id=patient_id, limit=limit)
    return jsonify({
        "success": True,
        "total": len(data),
        "data": data
    }), 200


@notification_bp.route("/notifications/unread", methods=["GET"])
def unread_notifications():
    """Lấy các cảnh báo chưa đọc theo phân quyền"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")
    limit = request.args.get("limit", 100, type=int)

    data = get_unread_notifications(user_id=user_id, user_role=user_role, patient_id=patient_id, limit=limit)
    return jsonify({
        "success": True,
        "total": len(data),
        "data": data
    }), 200


@notification_bp.route("/notifications/unread-count", methods=["GET"])
def unread_count():
    """Đếm số lượng cảnh báo chưa đọc theo phân quyền"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    data = get_unread_notifications(user_id=user_id, user_role=user_role, patient_id=patient_id)
    return jsonify({
        "success": True,
        "unread_count": len(data)
    }), 200


@notification_bp.route("/notifications/<int:notif_id>/read", methods=["PUT"])
def mark_read(notif_id):
    """Đánh dấu 1 cảnh báo đã đọc"""
    success = mark_notification_read(notif_id)
    return jsonify({
        "success": success,
        "message": "Đã cập nhật trạng thái thông báo"
    }), 200


@notification_bp.route("/notifications/read-all", methods=["PUT"])
def mark_read_all():
    """Đánh dấu tất cả thông báo đã đọc"""
    success = mark_all_notifications_read()
    return jsonify({
        "success": success,
        "message": "Đã đánh dấu tất cả cảnh báo là đã đọc"
    }), 200


@notification_bp.route("/notifications/<int:notif_id>", methods=["DELETE"])
def remove_notification(notif_id):
    """Xóa 1 thông báo khỏi lịch sử"""
    success = delete_notification(notif_id)
    return jsonify({
        "success": success,
        "message": "Đã xóa thông báo"
    }), 200
