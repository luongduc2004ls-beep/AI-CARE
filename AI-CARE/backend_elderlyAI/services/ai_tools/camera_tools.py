"""
Camera & Fall Detection Tools for Gemini Function Calling
Queries normalized Database Tables (Cameras, Alerts, CameraEvents) with RBAC Patient Scoping.
"""
from typing import Dict, Any, List, Optional
from models.camera import Camera
from models.alert import Alert
from models.user import User

def get_camera_status(user_role: str = "Admin", allowed_patient_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Kiểm tra danh sách và trạng thái trực tuyến/ngoại tuyến của toàn bộ hệ thống camera giám sát từ CSDL.
    Báo cáo chi tiết vị trí phòng và bệnh nhân được giám sát.

    Args:
        user_role: Vai trò người dùng ('Admin' hoặc 'User' / 'Caregiver').
        allowed_patient_ids: Danh sách mã bệnh nhân được phép xem.
    """
    try:
        query = Camera.query
        if (user_role or "").upper() != "ADMIN" and allowed_patient_ids:
            query = query.filter(Camera.patient_id.in_(allowed_patient_ids))

        cams = query.all()
        if not cams:
            return {
                "total_cameras": 0,
                "online_cameras": 0,
                "offline_count": 0,
                "cameras": [],
                "status_summary": "Chưa có camera nào được gán cho phạm vi giám sát này."
            }

        online = [c for c in cams if (c.status or "").upper() != "OFFLINE"]
        offline = [c for c in cams if (c.status or "").upper() == "OFFLINE"]

        cam_list = []
        for c in cams:
            u = User.query.filter_by(patient_code=c.patient_id).first()
            cam_list.append({
                "camera_code": c.camera_code or f"CAM{c.camera_id:03d}",
                "name": c.name,
                "room": c.room or c.location,
                "location": c.location,
                "patient_id": c.patient_id,
                "patient_name": u.full_name if u else c.patient_id,
                "status": c.status,
                "ai_enabled": c.ai_enabled,
                "last_seen": c.last_seen_at.strftime("%H:%M:%S") if c.last_seen_at else "Trực tuyến"
            })

        return {
            "total_cameras": len(cams),
            "online_cameras": len(online),
            "offline_count": len(offline),
            "cameras": cam_list,
            "status_summary": f"Tổng cộng {len(cams)} camera đang kết nối ({len(online)} online, {len(offline)} offline)."
        }
    except Exception as e:
        return {"error": str(e)}


def get_recent_fall_events(user_role: str = "Admin", allowed_patient_ids: Optional[List[str]] = None, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Truy vấn các sự cố té ngã hoặc cảnh báo an toàn mới nhất từ CSDL bảng Alerts.
    """
    try:
        query = Alert.query
        if (user_role or "").upper() != "ADMIN" and allowed_patient_ids:
            query = query.filter(Alert.patient_id.in_(allowed_patient_ids))

        alerts = query.order_by(Alert.alert_created_at.desc()).limit(limit).all()
        if not alerts:
            return [{"message": "Không có cảnh báo té ngã nào được ghi nhận trong thời gian gần đây."}]

        results = []
        for a in alerts:
            u = User.query.filter_by(patient_code=a.patient_id).first()
            results.append({
                "alert_id": a.alert_id,
                "patient_name": u.full_name if u else a.patient_id,
                "patient_id": a.patient_id,
                "location": a.location,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "confidence": a.confidence_percent if hasattr(a, 'confidence_percent') else f"{int((a.confidence or 0.9) * 100)}%",
                "status": a.status,
                "duration_sec": a.duration_seconds,
                "time": a.alert_created_at.strftime("%H:%M:%S %d/%m/%Y") if a.alert_created_at else "Gần đây"
            })
        return results
    except Exception as e:
        return [{"error": str(e)}]


def get_camera_events(user_role: str = "Admin", allowed_patient_ids: Optional[List[str]] = None, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Lấy danh sách các sự kiện ghi nhận từ camera AI trong thời gian gần đây từ bảng Alerts/Events.
    """
    return get_recent_fall_events(user_role=user_role, allowed_patient_ids=allowed_patient_ids, limit=limit)


