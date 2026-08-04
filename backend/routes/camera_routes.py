from flask import Blueprint, jsonify, request
from services.camera_service import (
    get_all_cameras,
    add_new_camera,
    trigger_fall_simulation,
    get_active_alerts,
    acknowledge_alert
)

camera_bp = Blueprint("camera_bp", __name__)


@camera_bp.route("/cameras", methods=["GET"])
def list_cameras():
    """Lấy danh sách tất cả các camera AI kết nối"""
    cameras = get_all_cameras()
    return jsonify({
        "success": True,
        "total": len(cameras),
        "data": cameras
    }), 200


@camera_bp.route("/cameras", methods=["POST"])
def create_camera():
    """Đăng ký camera RTSP mới"""
    data = request.get_json() or {}
    result, status_code = add_new_camera(data)
    return jsonify(result), status_code


@camera_bp.route("/cameras/<int:camera_id>/trigger-fall", methods=["POST"])
def trigger_fall(camera_id):
    """
    Kích hoạt chạy thử phát hiện ngã từ Camera (Trial Run)
    """
    res = trigger_fall_simulation(camera_id)
    return jsonify(res), 200


@camera_bp.route("/cameras/alerts", methods=["GET"])
def list_alerts():
    """Lấy danh sách các cảnh báo ngã khẩn cấp"""
    alerts = get_active_alerts()
    return jsonify({
        "success": True,
        "total": len(alerts),
        "data": alerts
    }), 200


@camera_bp.route("/cameras/alerts/<int:alert_id>/acknowledge", methods=["POST"])
def ack_alert(alert_id):
    """Xác nhận đã xử lý hoặc chuyển trạng thái cảnh báo ngã"""
    data = request.get_json() or {}
    status_code = data.get("status", "ACKNOWLEDGED")
    res = acknowledge_alert(alert_id, status_code)
    return jsonify(res), 200
