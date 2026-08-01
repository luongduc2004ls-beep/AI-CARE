# ==========================================================
# dashboard_routes.py
# Định nghĩa các API Route cho tổng quan Dashboard
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

from flask import Blueprint

from controllers.dashboard_controller import (
    get_dashboard_activities,
    get_dashboard_summary,
)

# ==========================================================
# Khởi tạo Blueprint
# ==========================================================

dashboard_bp = Blueprint(
    "dashboard",
    __name__
)


# ==========================================================
# Khai báo các API Endpoints
# ==========================================================

@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def route_get_dashboard_summary():
    """
    Route lấy số liệu thống kê tổng quan cho Dashboard.
    """
    return get_dashboard_summary()


@dashboard_bp.route("/api/dashboard/recent-activities", methods=["GET"])
def route_get_dashboard_activities():
    """
    Route lấy danh sách các hoạt động mới nhất.
    """
    return get_dashboard_activities()
