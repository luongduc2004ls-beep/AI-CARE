# ==============================================================================
# ALERT ROUTES (ALERT_ROUTES.PY)
# Phân Tách Hoàn Toàn API Cảnh Báo: Admin vs User (RBAC & Multi-Tenant Isolation)
# ==============================================================================

from flask import Blueprint, request, jsonify
from services.alert_service import AlertService
from services.auth_permission_service import AuthPermissionService

alert_bp = Blueprint("alert_bp", __name__)


# ==============================================================================
# 1. ADMIN ALERT ENDPOINTS (Yêu cầu authenticated user.role === 'Admin')
# ==============================================================================

@alert_bp.route("/admin/alerts", methods=["GET"])
def get_admin_alerts_endpoint():
    """
    [ADMIN ONLY] Lấy danh sách toàn bộ cảnh báo toàn hệ thống kèm bộ lọc & phân trang.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Yêu cầu quyền Quản trị viên (Admin) để truy cập cảnh báo toàn hệ thống"
        }), 403

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    filters = {
        "patient_id": request.args.get("patient_id") or request.args.get("patientId"),
        "camera_id": request.args.get("camera_id") or request.args.get("cameraId"),
        "alert_type": request.args.get("alert_type") or request.args.get("alertType"),
        "severity": request.args.get("severity"),
        "status": request.args.get("status"),
        "from_date": request.args.get("from_date") or request.args.get("fromDate"),
        "to_date": request.args.get("to_date") or request.args.get("toDate")
    }

    result = AlertService.get_admin_alerts_paginated(filters=filters, page=page, limit=limit)
    return jsonify({
        "success": True,
        **result
    }), 200


@alert_bp.route("/admin/alerts/<int:alert_id>", methods=["GET"])
def get_admin_alert_detail_endpoint(alert_id):
    """
    [ADMIN ONLY] Xem chi tiết một cảnh báo theo ID.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Chỉ Admin mới có quyền xem chi tiết cảnh báo hệ thống"
        }), 403

    alert_data, err = AlertService.get_alert_by_id(alert_id, user_role="Admin")
    if err:
        return jsonify({"success": False, "message": err}), 404

    return jsonify({"success": True, "alert": alert_data}), 200


@alert_bp.route("/admin/alerts/<int:alert_id>/status", methods=["PATCH", "PUT"])
def update_admin_alert_status_endpoint(alert_id):
    """
    [ADMIN ONLY] Cập nhật trạng thái xử lý cảnh báo (Acknowledge / Resolve).
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Chỉ Admin mới có quyền cập nhật trạng thái cảnh báo hệ thống"
        }), 403

    data = request.get_json() or {}
    new_status = data.get("status", "RESOLVED")
    operator = data.get("operator_name") or data.get("resolved_by") or "Quản trị viên"
    note = data.get("note") or data.get("resolution_note")

    updated, err = AlertService.update_alert_status(
        alert_id=alert_id,
        new_status=new_status,
        user_role="Admin",
        operator_name=operator,
        note=note
    )
    if err:
        return jsonify({"success": False, "message": err}), 400

    return jsonify({
        "success": True,
        "alert": updated,
        "message": f"Đã chuyển trạng thái cảnh báo sang '{new_status}' thành công"
    }), 200


@alert_bp.route("/admin/alerts/stats", methods=["GET"])
def get_admin_alert_stats_endpoint():
    """
    [ADMIN ONLY] Thống kê tổng hợp số liệu cảnh báo, sự cố té ngã, sinh hiệu toàn viện.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Chỉ Admin mới có quyền xem thống kê toàn viện"
        }), 403

    stats = AlertService.get_alert_stats(user_role="Admin")
    return jsonify({
        "success": True,
        "stats": stats
    }), 200


@alert_bp.route("/admin/patients/<patient_id>/alerts", methods=["GET"])
def get_admin_patient_alerts_endpoint(patient_id):
    """
    [ADMIN ONLY] Lấy danh sách cảnh báo của một bệnh nhân cụ thể.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Yêu cầu quyền Admin"
        }), 403

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    filters = {"patient_id": str(patient_id).strip()}

    result = AlertService.get_admin_alerts_paginated(filters=filters, page=page, limit=limit)
    return jsonify({
        "success": True,
        **result
    }), 200


# ==============================================================================
# 2. USER / CAREGIVER ALERT ENDPOINTS (100% Phân Lập Dữ Liệu Bệnh Nhân)
# ==============================================================================

@alert_bp.route("/user/alerts", methods=["GET"])
def get_user_alerts_endpoint():
    """
    [USER / CAREGIVER ONLY]
    Lấy danh sách cảnh báo an toàn dành riêng cho các bệnh nhân mà tài khoản được cấp quyền.
    Tuyệt đối không lấy toàn bộ Alerts hệ thống.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    filters = {
        "alert_type": request.args.get("alert_type") or request.args.get("alertType"),
        "severity": request.args.get("severity"),
        "status": request.args.get("status")
    }

    result, err = AlertService.get_user_alerts_paginated(
        user_id=user_id,
        user_role=user_role,
        target_patient_id=None,
        filters=filters,
        page=page,
        limit=limit
    )
    if err:
        return jsonify({"success": False, "message": err}), 403

    return jsonify({
        "success": True,
        **result
    }), 200


@alert_bp.route("/user/alerts/<int:alert_id>", methods=["GET"])
def get_user_alert_detail_endpoint(alert_id):
    """
    [USER / CAREGIVER ONLY]
    Xem chi tiết một cảnh báo thuộc về người thân của mình.
    Trả về 403 nếu cảnh báo thuộc về bệnh nhân khác.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    alert_data, err = AlertService.get_alert_by_id(alert_id, user_id=user_id, user_role=user_role)
    if err:
        return jsonify({"success": False, "message": err}), 403

    return jsonify({"success": True, "alert": alert_data}), 200


@alert_bp.route("/user/patients/<patient_id>/alerts", methods=["GET"])
def get_user_patient_alerts_endpoint(patient_id):
    """
    [USER / CAREGIVER ONLY]
    Xem cảnh báo của một bệnh nhân cụ thể.
    Backend BẮT BUỘC kiểm tra quyền UserPatientAccess trước khi trả về.
    Nếu User không được cấp quyền với patient_id này -> 403 Forbidden.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    # Validate quyền truy cập
    target_pid = str(patient_id).strip()
    is_allowed = AuthPermissionService.validate_patient_access(user_id, user_role, target_pid)
    if not is_allowed:
        return jsonify({
            "success": False,
            "message": f"403 Forbidden: Bạn không có quyền truy cập cảnh báo của bệnh nhân '{target_pid}'"
        }), 403

    filters = {
        "alert_type": request.args.get("alert_type") or request.args.get("alertType"),
        "severity": request.args.get("severity"),
        "status": request.args.get("status")
    }

    result, err = AlertService.get_user_alerts_paginated(
        user_id=user_id,
        user_role=user_role,
        target_patient_id=target_pid,
        filters=filters,
        page=page,
        limit=limit
    )
    if err:
        return jsonify({"success": False, "message": err}), 403

    return jsonify({
        "success": True,
        **result
    }), 200


@alert_bp.route("/user/alerts/stats", methods=["GET"])
def get_user_alert_stats_endpoint():
    """
    [USER / CAREGIVER ONLY]
    Thống kê các cảnh báo chỉ thuộc về người thân được cấp quyền.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    stats = AlertService.get_alert_stats(user_id=user_id, user_role=user_role)
    return jsonify({
        "success": True,
        "stats": stats
    }), 200


@alert_bp.route("/user/alerts/<int:alert_id>/status", methods=["PATCH", "PUT"])
@alert_bp.route("/alerts/<int:alert_id>/status", methods=["PATCH", "PUT"])
def update_user_alert_status_endpoint(alert_id):
    """
    [USER / CAREGIVER] Cập nhật trạng thái xử lý cảnh báo (Đã xử lý / Chưa xử lý / Đang theo dõi).
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    # Kiểm tra quyền với cảnh báo này
    alert_data, err = AlertService.get_alert_by_id(alert_id, user_id=user_id, user_role=user_role)
    if err:
        return jsonify({"success": False, "message": err}), 403

    data = request.get_json() or {}
    new_status = data.get("status", "RESOLVED")
    operator = data.get("operator_name") or data.get("resolved_by") or "Người thân"
    note = data.get("note") or data.get("resolution_note")

    updated, update_err = AlertService.update_alert_status(
        alert_id=alert_id,
        new_status=new_status,
        user_role=user_role,
        operator_name=operator,
        note=note
    )
    if update_err:
        return jsonify({"success": False, "message": update_err}), 400

    return jsonify({
        "success": True,
        "alert": updated,
        "message": f"Đã cập nhật trạng thái cảnh báo sang '{new_status}' thành công"
    }), 200
