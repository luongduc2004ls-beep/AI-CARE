# ==========================================================
# dashboard_controller.py
# Controller tổng hợp thông tin báo cáo Dashboard
# Chức năng:
#     - Nhận Request từ Client
#     - Gọi DashboardService xử lý thống kê
#     - Trả về Response chuẩn hóa bằng ResponseBuilder
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any

from middleware.response import ResponseBuilder
from services.dashboard_service import DashboardService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Lấy tổng quan số liệu Dashboard
# GET /api/dashboard/summary
# ==========================================================

def get_dashboard_summary() -> Any:
    """
    Xử lý API lấy các thông số thống kê tổng quan cho màn hình Dashboard.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy số liệu thống kê Dashboard.")
    summary_data = DashboardService.get_summary()

    return ResponseBuilder.success(
        message="Lấy dữ liệu thống kê Dashboard thành công",
        data=summary_data
    )


# ==========================================================
# Lấy danh sách hoạt động gần đây
# GET /api/dashboard/recent-activities
# ==========================================================

def get_dashboard_activities() -> Any:
    """
    Xử lý API lấy các hoạt động và dữ liệu mới nhất.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu lấy danh sách hoạt động mới nhất.")
    activities_data = DashboardService.get_recent_activities()

    return ResponseBuilder.success(
        message="Lấy danh sách hoạt động gần nhất thành công",
        data=activities_data
    )
