# ==============================================================================
# ROUTE BACKEND CHO TÍNH NĂNG CHATBOT AI GOOGLE GEMINI (CHATBOT_ROUTES.PY)
# ==============================================================================
# File Router định nghĩa các HTTP Endpoints:
# - POST /api/ai/chat
# - POST /api/chatbot/chat
# - POST /api/chatbot/clear
# - GET  /api/chatbot/status
# - GET  /api/ai/conversations
# ==============================================================================

from flask import Blueprint, request, jsonify
from services.chatbot_service import ChatbotService
from models.conversation import Conversation

chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/ai/chat", methods=["POST"])
@chatbot_bp.route("/chatbot/chat", methods=["POST"])
def chat_with_gemini():
    """
    Endpoint tiếp nhận tin nhắn chat từ người dùng và gửi tới Gemini AI Function Calling.
    
    Payload mẫu (JSON):
    {
        "message": "Tình trạng sức khỏe của Nguyễn Văn An hôm nay thế nào?",
        "conversationId": "conv_001",
        "patientId": "PAT10000",
        "userRole": "Admin"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        
        user_message = data.get("message", "").strip()
        conversation_id = data.get("conversationId") or data.get("session_id") or "default_session"
        patient_id = data.get("patientId") or data.get("patient_id") or "PAT10000"
        history = data.get("history", [])
        user_id = data.get("userId") or data.get("user_id")
        user_role = data.get("userRole") or data.get("role") or "Admin"

        if not user_message:
            return jsonify({
                "success": False,
                "reply": "⚠️ Bạn chưa nhập nội dung tin nhắn.",
                "conversationId": conversation_id,
                "error": "Missing message field"
            }), 200

        result = ChatbotService.process_chat(
            user_message=user_message,
            conversation_id=conversation_id,
            patient_id=patient_id,
            history=history,
            user_id=user_id,
            user_role=user_role
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "reply": f"⚠️ Lỗi máy chủ xử lý AI: {str(e)}",
            "conversationId": "error",
            "error": str(e)
        }), 200


@chatbot_bp.route("/ai/conversations", methods=["GET"])
def list_conversations():
    """
    Lấy danh sách các cuộc hội thoại gần đây.
    """
    try:
        convs = Conversation.query.order_by(Conversation.updated_at.desc()).limit(20).all()
        return jsonify({
            "success": True,
            "conversations": [c.to_dict() for c in convs]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 200


@chatbot_bp.route("/chatbot/clear", methods=["POST"])
def clear_chat_history():
    """
    Endpoint xóa lịch sử hội thoại của một phiên.
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("session_id") or data.get("conversationId") or "default_session"

        ChatbotService.clear_session(session_id)

        return jsonify({
            "success": True,
            "message": f"Đã xóa lịch sử cuộc trò chuyện: {session_id}"
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
    """
    api_key = ChatbotService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key != "YOUR_GEMINI_API_KEY")

    return jsonify({
        "success": True,
        "configured": is_configured,
        "model": ChatbotService.get_model_name(),
        "status_message": "Đã sẵn sàng" if is_configured else "Chưa cấu hình GEMINI_API_KEY trong .env (chạy chế độ phân tích AI nội bộ)"
    }), 200
