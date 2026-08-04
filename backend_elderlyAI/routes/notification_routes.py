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
def list_notifications():
    """Lấy danh sách tất cả thông báo và lịch sử cảnh báo"""
    data = get_all_notifications()
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
    """Lấy lịch sử tất cả các cảnh báo đã từng xuất hiện"""
    data = get_all_notifications()
    return jsonify({
        "success": True,
        "total": len(data),
        "data": data
    }), 200


@notification_bp.route("/notifications/unread", methods=["GET"])
def unread_notifications():
    """Lấy các cảnh báo chưa đọc"""
    data = get_unread_notifications()
    return jsonify({
        "success": True,
        "total": len(data),
        "data": data
    }), 200


@notification_bp.route("/notifications/unread-count", methods=["GET"])
def unread_count():
    """Đếm số lượng cảnh báo chưa đọc"""
    data = get_unread_notifications()
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
