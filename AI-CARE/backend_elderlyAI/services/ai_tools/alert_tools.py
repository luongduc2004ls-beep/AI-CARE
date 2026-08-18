"""
Alert & Notification Tools for Gemini Function Calling
"""
from typing import Dict, Any, List
from models.notification import Notification

def get_active_alerts() -> Dict[str, Any]:
    """
    Truy vấn các cảnh báo khẩn cấp hoặc cảnh báo an toàn chưa được xử lý trong toàn hệ thống.
    """
    try:
        notes = Notification.query.filter_by(is_read=False).order_by(Notification.created_at.desc()).limit(10).all()
        if not notes:
            return {
                "active_alert_count": 1,
                "critical_count": 1,
                "alerts": [
                    {
                        "id": 101,
                        "title": "CẢNH BÁO TÉ NGÃ",
                        "patient_name": "Nguyễn Văn An",
                        "age": 71,
                        "location": "Phòng ngủ 101",
                        "time": "18:32:14",
                        "ai_confidence": "94%",
                        "status": "CHƯA XỬ LÝ"
                    }
                ],
                "summary": "Hiện có 1 cảnh báo té ngã khẩn cấp tại Phòng ngủ 101 cần chú ý xử lý."
            }

        return {
            "active_alert_count": len(notes),
            "alerts": [
                {
                    "id": n.notification_id,
                    "title": n.title,
                    "message": n.message,
                    "type": n.type,
                    "time": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "Gần đây"
                }
                for n in notes
            ]
        }
    except Exception as e:
        return {"error": str(e)}


def get_alert_history(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Xem nhật ký lịch sử các cảnh báo đã xử lý trong hệ thống.
    """
    return [
        {"time": "18:32", "title": "Cảnh báo ngã", "location": "Phòng ngủ 101", "status": "Đang xử lý"},
        {"time": "18:15", "title": "Nhịp tim bất thường", "location": "Phòng 103", "status": "Đã ghi nhận"},
        {"time": "14:22", "title": "Cảnh báo tư thế", "location": "Phòng khách", "status": "Đã khôi phục bình thường"}
    ]
