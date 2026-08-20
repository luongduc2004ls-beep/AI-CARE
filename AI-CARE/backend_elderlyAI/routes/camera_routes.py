from flask import Blueprint, jsonify, request
from services.camera_service import (
    get_all_cameras,
    add_new_camera,
    update_camera,
    delete_camera,
    trigger_fall_simulation
)
from services.alert_service import AlertService

camera_bp = Blueprint("camera_bp", __name__)


# ==========================================================
# ADMIN CAMERA ENDPOINTS
# ==========================================================

@camera_bp.route("/admin/cameras", methods=["GET"])
@camera_bp.route("/cameras", methods=["GET"])
def list_admin_cameras():
    """Lấy danh sách tất cả các camera trong hệ thống (dành cho Quản trị viên)"""
    role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    cameras = get_all_cameras(user_role=role, user_id=user_id)
    return jsonify({
        "success": True,
        "total": len(cameras),
        "data": cameras
    }), 200


@camera_bp.route("/admin/cameras", methods=["POST"])
@camera_bp.route("/cameras", methods=["POST"])
def create_camera():
    """Đăng ký camera mới trong CSDL"""
    data = request.get_json() or {}
    result, status_code = add_new_camera(data)
    return jsonify(result), status_code


@camera_bp.route("/admin/cameras/<int:camera_id>", methods=["PATCH", "PUT"])
@camera_bp.route("/cameras/<int:camera_id>", methods=["PATCH", "PUT"])
def patch_camera(camera_id):
    """Cập nhật cấu hình camera"""
    data = request.get_json() or {}
    updated = update_camera(camera_id, data)
    if not updated:
        return jsonify({"success": False, "message": "Không tìm thấy Camera"}), 404
    return jsonify({"success": True, "data": updated}), 200


@camera_bp.route("/admin/cameras/<int:camera_id>", methods=["DELETE"])
@camera_bp.route("/cameras/<int:camera_id>", methods=["DELETE"])
def remove_camera(camera_id):
    """Xóa camera khỏi CSDL"""
    success = delete_camera(camera_id)
    if not success:
        return jsonify({"success": False, "message": "Không tìm thấy Camera"}), 404
    return jsonify({"success": True, "message": "Đã xóa Camera thành công"}), 200


# ==========================================================
# USER SCOPED CAMERA ENDPOINTS
# ==========================================================

@camera_bp.route("/my/cameras", methods=["GET"])
def list_my_cameras():
    """Lấy danh sách Camera chỉ thuộc về bệnh nhân mà người dùng được phân quyền"""
    role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    cameras = get_all_cameras(user_role=role, user_id=user_id)
    return jsonify({
        "success": True,
        "total": len(cameras),
        "data": cameras
    }), 200


# ==========================================================
# ALERT MANAGEMENT & LIFECYCLE ENDPOINTS
# ==========================================================

@camera_bp.route("/cameras/alerts", methods=["GET"])
def list_camera_alerts():
    """Lấy danh sách tất cả các cảnh báo sự cố từ camera"""
    role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    status = request.args.get("status")
    alerts = AlertService.get_alerts(user_role=role, user_id=user_id, status=status)
    return jsonify({
        "success": True,
        "total": len(alerts),
        "data": alerts
    }), 200


@camera_bp.route("/cameras/alerts/<int:alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert_route(alert_id):
    """Xác nhận đã tiếp nhận cảnh báo (Chuyển trạng thái sang ACKNOWLEDGED)"""
    data = request.get_json() or {}
    ack_by = data.get("acknowledged_by", "Quản trị viên trực ca")
    res = AlertService.acknowledge_alert(alert_id, acknowledged_by=ack_by)
    if not res:
        return jsonify({"success": False, "message": "Không tìm thấy cảnh báo"}), 404
    return jsonify({"success": True, "data": res}), 200


@camera_bp.route("/cameras/alerts/<int:alert_id>/resolve", methods=["POST"])
def resolve_alert_route(alert_id):
    """Xử lý hoàn tất cảnh báo (Chuyển trạng thái sang RESOLVED)"""
    data = request.get_json() or {}
    res_by = data.get("resolved_by", "Bác sĩ phụ trách")
    note = data.get("resolution_note", "Đã kiểm tra an toàn và xử lý xong")
    res = AlertService.resolve_alert(alert_id, resolved_by=res_by, resolution_note=note)
    if not res:
        return jsonify({"success": False, "message": "Không tìm thấy cảnh báo"}), 404
    return jsonify({"success": True, "data": res}), 200


@camera_bp.route("/cameras/<int:camera_id>/trigger-fall", methods=["POST"])
def trigger_fall(camera_id):
    """Kích hoạt chạy thử phát hiện té ngã từ Camera (Trial Run)"""
    data = request.get_json() or {}
    snapshot_url = data.get("snapshot_url")
    res = trigger_fall_simulation(camera_id, snapshot_url=snapshot_url)
    return jsonify(res), 200
