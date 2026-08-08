# ==============================================================================
# ROUTE BACKEND CHO TÍNH NĂNG CHATBOT AI GOOGLE GEMINI (CHATBOT_ROUTES.PY)
# ==============================================================================
# File Router định nghĩa các HTTP Endpoints nhận yêu cầu từ Frontend React,
# chuyển dữ liệu cho ChatbotService xử lý và trả về phản hồi JSON tiêu chuẩn.
# ==============================================================================

from flask import Blueprint, request, jsonify
from services.chatbot_service import ChatbotService

# Tạo Flask Blueprint định danh cho các API liên quan tới Chatbot
chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chatbot/chat", methods=["POST"])
def chat_with_gemini():
    """
    Endpoint tiếp nhận tin nhắn chat từ người dùng và gửi tới Gemini AI.
    
    Phương thức: POST
    URL: /api/chatbot/chat
    Payload mẫu (JSON):
    {
        "message": "Bệnh tiểu đường nên ăn gì?",
        "session_id": "user_123",
        "history": [...]
    }
    
    Phản hồi (JSON):
    {
        "success": true,
        "reply": "Đối với người bệnh tiểu đường...",
        "session_id": "user_123",
        "error": null
    }
    """
    try:
        # Lấy dữ liệu JSON gửi lên từ Client request body
        data = request.get_json(silent=True) or {}
        
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id", "default_session")
        history = data.get("history", [])

        # Kiểm tra nội dung tin nhắn không rỗng
        if not user_message:
            return jsonify({
                "success": False,
                "reply": "⚠️ Bạn chưa nhập nội dung tin nhắn.",
                "session_id": session_id,
                "error": "Missing message field"
            }), 200

        # Gọi ChatbotService để gửi tin nhắn đến Gemini API và nhận phản hồi
        result = ChatbotService.process_chat(
            user_message=user_message,
            session_id=session_id,
            history=history
        )

        # Trả về HTTP Status 200 kèm phản hồi dạng JSON để Frontend hiển thị lời nhắn hướng dẫn lỗi rõ ràng
        return jsonify(result), 200

    except Exception as e:
        # Xử lý các ngoại lệ hệ thống ngoài dự kiến
        return jsonify({
            "success": False,
            "reply": f"⚠️ Đã có lỗi xảy ra ở máy chủ Backend: {str(e)}",
            "session_id": "error",
            "error": str(e)
        }), 200


@chatbot_bp.route("/chatbot/clear", methods=["POST"])
def clear_chat_history():
    """
    Endpoint xóa lịch sử hội thoại của một phiên làm việc.
    
    Phương thức: POST
    URL: /api/chatbot/clear
    Payload mẫu (JSON):
    {
        "session_id": "user_123"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("session_id", "default_session")

        ChatbotService.clear_session(session_id)

        return jsonify({
            "success": True,
            "message": f"Đã xóa lịch sử cuộc trò chuyện cho session: {session_id}"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 200


@chatbot_bp.route("/chatbot/status", methods=["GET"])
def check_chatbot_status():
    """
    Endpoint kiểm tra trạng thái kết nối và cấu hình Gemini API Key.
    
    Phương thức: GET
    URL: /api/chatbot/status
    """
    api_key = ChatbotService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key != "YOUR_GEMINI_API_KEY" and api_key != "your_gemini_api_key_here")

    return jsonify({
        "success": True,
        "configured": is_configured,
        "model": ChatbotService.get_model_name(),
        "status_message": "Đã sẵn sàng" if is_configured else "Chưa cấu hình GEMINI_API_KEY trong file .env"
    }), 200
