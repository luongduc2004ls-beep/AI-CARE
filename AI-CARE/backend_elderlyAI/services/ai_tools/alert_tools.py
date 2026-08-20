"""
Alert & Notification Tools for Gemini Function Calling
Tách biệt hoàn toàn công cụ AI cho Admin và User.
"""
from typing import Dict, Any, List
from models.alert import Alert
from models.user import User
from services.alert_service import AlertService
from services.auth_permission_service import AuthPermissionService


# ==============================================================================
# 1. ADMIN AI TOOLS (Toàn quyền tra cứu toàn hệ thống)
# ==============================================================================

def admin_get_active_alerts(limit: int = 10) -> Dict[str, Any]:
    """
    [ADMIN AI] Truy vấn các cảnh báo khẩn cấp hoặc cảnh báo an toàn chưa được xử lý trong toàn viện.
    """
    try:
        res = AlertService.get_admin_alerts_paginated(
            filters={"status": "ALERTED"},
            page=1,
            limit=limit
        )
        return {
            "active_alert_count": res["pagination"]["total"],
            "alerts": res["data"]
        }
    except Exception as e:
        return {"error": str(e)}


def admin_search_alerts(status: str = None, severity: str = None, patient_id: str = None, limit: int = 10) -> Dict[str, Any]:
    """
    [ADMIN AI] Tìm kiếm và lọc toàn bộ cảnh báo toàn viện theo trạng thái, mức độ hoặc bệnh nhân.
    """
    try:
        res = AlertService.get_admin_alerts_paginated(
            filters={"status": status, "severity": severity, "patient_id": patient_id},
            page=1,
            limit=limit
        )
        return res
    except Exception as e:
        return {"error": str(e)}


def admin_get_alert_statistics() -> Dict[str, Any]:
    """
    [ADMIN AI] Thống kê tổng hợp số lượng cảnh báo toàn viện (Té ngã, Sinh hiệu, Chưa xử lý).
    """
    try:
        return AlertService.get_alert_stats(user_role="Admin")
    except Exception as e:
        return {"error": str(e)}


# Backward-compatible aliases
get_active_alerts = admin_get_active_alerts

def get_alert_history(limit: int = 10) -> List[Dict[str, Any]]:
    """Lấy lịch sử cảnh báo hệ thống"""
    try:
        res = AlertService.get_admin_alerts_paginated(page=1, limit=limit)
        return res.get("data", [])
    except Exception:
        return []


# ==============================================================================
# 2. USER AI TOOLS (Chỉ tra cứu bệnh nhân được phân quyền)
# ==============================================================================

def user_get_patient_alerts(patient_id: str, limit: int = 10) -> Dict[str, Any]:
    """
    [USER AI] Tra cứu danh sách các cảnh báo an toàn của đúng người thân đang chọn.
    """
    try:
        res, err = AlertService.get_user_alerts_paginated(
            user_id=None,
            user_role="User",
            target_patient_id=patient_id,
            filters=None,
            page=1,
            limit=limit
        )
        if err:
            return {"error": err}
        return res
    except Exception as e:
        return {"error": str(e)}
