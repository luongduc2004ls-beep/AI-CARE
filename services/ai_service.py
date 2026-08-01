# ==========================================================
# ai_service.py
# Tầng Service xử lý các tính năng trí tuệ nhân tạo (AI Assistant)
# Phân tích sức khỏe, tư vấn thuốc và hỗ trợ người cao tuổi
# Khớp 100% với các bảng MySQL hiện tại
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional

from database import db
from models.health_record import HealthRecord
from models.patient import Patient

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class AIService
# ==========================================================

class AIService:
    """
    Lớp xử lý các thuật toán phân tích AI và tư vấn chăm sóc sức khỏe người cao tuổi.
    """

    # ======================================================
    # Phân tích chỉ số sức khỏe bằng AI
    # ======================================================
    @staticmethod
    def analyze_health(health_record_data: dict) -> Dict[str, Any]:
        """
        Phân tích tự động các chỉ số sức khỏe sinh hiệu để phát hiện bất thường.

        Args:
            health_record_data (dict): Dictionary chứa các chỉ số sinh hiệu.

        Returns:
            Dict[str, Any]: Kết quả phân tích, mức độ rủi ro và các khuyến nghị AI.
        """
        logger.info("Service AI: Tiến hành phân tích chỉ số sức khỏe.")

        warnings: List[str] = []
        status: str = "Bình thường"
        risk_level: str = "Thấp"
        recommendations: List[str] = []

        heart_rate = health_record_data.get("heart_rate")
        blood_pressure = health_record_data.get("blood_pressure")
        blood_glucose = health_record_data.get("blood_glucose")
        spo2 = health_record_data.get("spo2")
        body_temperature = health_record_data.get("body_temperature")

        # Đánh giá nhịp tim
        if heart_rate is not None:
            heart_rate = int(heart_rate)
            if heart_rate > 100:
                warnings.append("Nhịp tim nhanh bất thường (>100 bpm).")
                status = "Cảnh báo"
            elif heart_rate < 50:
                warnings.append("Nhịp tim chậm bất thường (<50 bpm).")
                status = "Cảnh báo"

        # Đánh giá nồng độ Oxy SpO2
        if spo2 is not None:
            spo2 = float(spo2)
            if spo2 < 95.0:
                warnings.append("Nồng độ Oxy trong máu SpO2 thấp (< 95%).")
                status = "Khẩn cấp"
                risk_level = "Cao"

        # Đánh giá đường huyết
        if blood_glucose is not None:
            blood_glucose = float(blood_glucose)
            if blood_glucose > 180.0:
                warnings.append("Đường huyết cao (> 180 mg/dL).")
                if status != "Khẩn cấp":
                    status = "Cảnh báo"
            elif blood_glucose < 70.0:
                warnings.append("Hạ đường huyết nghiêm trọng (< 70 mg/dL).")
                status = "Khẩn cấp"
                risk_level = "Cao"

        # Đánh giá thân nhiệt
        if body_temperature is not None:
            body_temperature = float(body_temperature)
            if body_temperature >= 38.0:
                warnings.append("Thân nhiệt cao (Sốt >= 38.0°C).")
                if status != "Khẩn cấp":
                    status = "Cảnh báo"

        if not warnings:
            recommendations.append("Các chỉ số sinh hiệu ở mức an toàn. Duy trì thói quen sinh hoạt tốt.")
        else:
            recommendations.append("Nghỉ ngơi ở nơi thoáng mát và theo dõi lại chỉ số.")

        return {
            "status": status,
            "risk_level": risk_level,
            "warnings": warnings,
            "recommendations": recommendations,
        }

    # ======================================================
    # Trợ lý AI trò chuyện và tư vấn (AI Health Assistant Chatbot)
    # ======================================================
    @staticmethod
    def chat_assistant(user_message: str, patient_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Trợ lý Virtual AI tư vấn sức khỏe, phản hồi thắc mắc cho người cao tuổi.

        Args:
            user_message (str): Câu hỏi của người dùng.
            patient_id (Optional[str]): ID bệnh nhân nếu có.

        Returns:
            Dict[str, Any]: Câu trả lời của Trợ lý AI CARE.
        """
        logger.info("Service AI: Trợ lý trò chuyện tư vấn người dùng.")

        patient_name = "Bác"
        if patient_id:
            patient = db.session.get(Patient, patient_id)
            if patient and patient.name:
                patient_name = patient.name

        msg_lower = user_message.lower()

        if "huyết áp" in msg_lower:
            reply = f"Chào {patient_name}, chỉ số huyết áp bình thường ở người cao tuổi thường dao động khoảng 120/80 mmHg. Hãy nghỉ ngơi và thông báo cho người thân nếu có bất thường!"
        elif "uống thuốc" in msg_lower or "nhắc thuốc" in msg_lower:
            reply = f"Hệ thống AI CARE luôn sẵn sàng nhắc lịch uống thuốc cho {patient_name}. Hãy đảm bảo uống thuốc đúng giờ nhé!"
        else:
            reply = f"Dạ cháu là Trợ lý AI CARE luôn đồng hành chăm sóc sức khỏe cho {patient_name}. {patient_name} có thể hỏi cháu về huyết áp, nhịp tim, đường huyết hoặc lịch uống thuốc ạ!"

        return {
            "question": user_message,
            "answer": reply,
            "patient_name": patient_name,
        }
