# ==========================================================
# ai_controller.py
# Controller xử lý các tính năng trí tuệ nhân tạo (AI)
# Chức năng:
#     - Nhận Request phân tích sức khỏe, tư vấn thuốc, chatbot từ Client
#     - Validate dữ liệu đầu vào
#     - Gọi AIService xử lý thuật toán AI
#     - Trả về Response chuẩn hóa bằng ResponseBuilder
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any

from flask import request

from middleware.response import ResponseBuilder
from services.ai_service import AIService

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Phân tích chỉ số sức khỏe sinh hiệu bằng AI
# POST /api/ai/analyze-health
# ==========================================================

def analyze_health() -> Any:
    """
    Xử lý API phân tích tự động các chỉ số sức khỏe bằng AI.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Yêu cầu phân tích chỉ số sức khỏe AI.")
    data = request.get_json()

    if data is None:
        logger.warning("Controller: Dữ liệu chỉ số sức khỏe rỗng.")
        return ResponseBuilder.bad_request(message="Không có dữ liệu gửi lên")

    result = AIService.analyze_health(data)

    return ResponseBuilder.success(
        message="Phân tích chỉ số sức khỏe AI thành công",
        data=result
    )


# ==========================================================
# Trợ lý AI tư vấn và trò chuyện (Chatbot Assistant)
# POST /api/ai/chat
# ==========================================================

def chat_assistant() -> Any:
    """
    Xử lý API trò chuyện tư vấn sức khỏe với Trợ lý AI.

    Returns:
        Response JSON từ ResponseBuilder.
    """
    logger.info("Controller: Tiếp nhận tin nhắn gửi cho Trợ lý AI.")
    data = request.get_json()

    if data is None or "message" not in data or str(data["message"]).strip() == "":
        logger.warning("Controller: Tin nhắn rỗng.")
        return ResponseBuilder.bad_request(message="Nội dung tin nhắn không được để trống")

    user_message = data["message"]
    patient_id = data.get("patient_id")

    result = AIService.chat_assistant(user_message, patient_id)

    return ResponseBuilder.success(
        message="Phản hồi từ Trợ lý AI thành công",
        data=result
    )
# ==========================================================
# AI tư vấn sử dụng thuốc
# POST /api/ai/medication-advice
# ==========================================================

def medication_advice():
    """
    API tư vấn sử dụng thuốc.
    """

    data = request.get_json()

    if data is None:
        return ResponseBuilder.bad_request(
            message="Không có dữ liệu gửi lên"
        )

    result = AIService.medication_advice(data)

    return ResponseBuilder.success(
        message="Tư vấn thuốc thành công",
        data=result
    )