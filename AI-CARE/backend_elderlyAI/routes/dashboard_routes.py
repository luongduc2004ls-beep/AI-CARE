from flask import Blueprint, jsonify, request
from services.dashboard_service import DashboardService
from controllers.dashboard_controller import (
    dashboard,
    statistics,
    medicine_chart,
    dashboard_charts,
    medicine_bar_chart,
    medicine_pie_chart,
    medicine_line_chart,
    summary,
    recent_activities
)

dashboard_bp = Blueprint("dashboard", __name__)

# Legacy and Admin Dashboard Endpoints
dashboard_bp.route("/dashboard", methods=["GET"])(dashboard)
dashboard_bp.route("/dashboard/statistics", methods=["GET"])(statistics)
dashboard_bp.route("/dashboard/chart", methods=["GET"])(medicine_chart)
dashboard_bp.route("/dashboard/charts", methods=["GET"])(dashboard_charts)
dashboard_bp.route("/dashboard/charts/bar", methods=["GET"])(medicine_bar_chart)
dashboard_bp.route("/dashboard/charts/pie", methods=["GET"])(medicine_pie_chart)
dashboard_bp.route("/dashboard/charts/line", methods=["GET"])(medicine_line_chart)
dashboard_bp.route("/dashboard/summary", methods=["GET"])(summary)
dashboard_bp.route("/dashboard/recent-activities", methods=["GET"])(recent_activities)

# Explicit Admin Dashboard Route
@dashboard_bp.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    """Tổng quan điều hành toàn hệ thống cho Quản trị viên"""
    data = DashboardService.get_admin_dashboard()
    return jsonify({
        "success": True,
        "scope": "SYSTEM_ADMIN",
        "data": data
    }), 200

# Explicit User Scoped Dashboard Route
@dashboard_bp.route("/my/dashboard", methods=["GET"])
def user_dashboard():
    """Tổng quan chăm sóc người thân cá nhân (Chỉ trong phạm vi Patient Scope)"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    data, status_code = DashboardService.get_user_dashboard(
        user_id=user_id,
        patient_id=patient_id,
        user_role=user_role
    )

    if status_code == 403:
        return jsonify({
            "success": False,
            "message": "403 Forbidden: Bạn không có quyền truy cập dữ liệu của bệnh nhân này."
        }), 403

    return jsonify({
        "success": True,
        "scope": "PATIENT_CARE",
        "data": data
    }), 200
