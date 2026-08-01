# ==========================================================
# ai_routes.py
# Định nghĩa các API Route cho tính năng AI Assistant
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

from flask import Blueprint

from controllers.ai_controller import (
    analyze_health,
    chat_assistant,
    medication_advice,
)

# ==========================================================
# Khởi tạo Blueprint
# ==========================================================

ai_bp = Blueprint(
    "ai",
    __name__
)


# ==========================================================
# Khai báo các API Endpoints
# ==========================================================

@ai_bp.route("/api/ai/analyze-health", methods=["POST"])
def route_analyze_health():
    """
    Route phân tích tự động chỉ số sức khỏe bằng AI.
    """
    return analyze_health()


@ai_bp.route("/api/ai/medication-advice", methods=["POST"])
def route_medication_advice():
    """
    Route tư vấn sử dụng thuốc từ AI.
    """
    return medication_advice()


@ai_bp.route("/api/ai/chat", methods=["POST"])
def route_chat_assistant():
    """
    Route trò chuyện tư vấn sức khỏe với Trợ lý AI.
    """
    return chat_assistant()
