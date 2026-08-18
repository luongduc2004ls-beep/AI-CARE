"""
Analytics & Patient Risk Tools for Gemini Function Calling
"""
from typing import Dict, Any, List

def get_patient_risk(patient_id: str) -> Dict[str, Any]:
    """
    Đánh giá mức độ rủi ro sức khỏe & nguy cơ té ngã của một bệnh nhân cụ thể.

    Args:
        patient_id: Mã hoặc tên bệnh nhân.
    """
    return {
        "patient_id": patient_id,
        "fall_risk_score": 20,
        "risk_level": "LOW",
        "primary_factors": ["Huyết áp ổn định", "Đã uống thuốc đúng giờ", "Không có sự cố ngã trong 7 ngày qua"],
        "recommendation": "Duy trì lịch uống thuốc và theo dõi qua camera thường quy."
    }


def get_high_risk_patients() -> List[Dict[str, Any]]:
    """
    Truy vấn danh sách các bệnh nhân đang có nguy cơ té ngã hoặc rủi ro sức khỏe cao nhất trong hệ thống.
    """
    return [
        {
            "patient": "Nguyễn Văn An",
            "patient_id": "PAT10000",
            "age": 71,
            "location": "Phòng ngủ 101",
            "fall_risk": 82,
            "risk_level": "HIGH",
            "reason": "Phát hiện tư thế nghiêng bất thường 78.5° trong phòng ngủ"
        },
        {
            "patient": "Trần Thị B",
            "patient_id": "PAT10002",
            "age": 76,
            "location": "Nhà vệ sinh",
            "fall_risk": 65,
            "risk_level": "MODERATE",
            "reason": "Tiền sử chóng mặt khi chuyển tư thế"
        }
    ]


def get_system_statistics() -> Dict[str, Any]:
    """
    Lấy bảng số liệu thống kê tổng quan toàn bộ hệ thống ElderlyCare AI.
    """
    return {
        "total_cameras": 12,
        "online_cameras": 12,
        "total_patients": 12,
        "unread_alerts": 3,
        "critical_alerts": 1,
        "system_confidence": "98.4%",
        "safety_status": "NORMAL_MONITORING"
    }
