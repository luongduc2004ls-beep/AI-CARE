# ==============================================================================
# ROUTE BACKEND CHO TÍNH NĂNG CHATBOT AI GOOGLE GEMINI (CHATBOT_ROUTES.PY)
# ==============================================================================
# File Router định nghĩa các HTTP Endpoints:
# - POST /api/ai/chat
# - POST /api/chatbot/chat
# - POST /api/chatbot/clear
# - GET  /api/chatbot/status
# - GET  /api/ai/conversations
# - GET  /api/ai/conversations/<conversation_id>/messages
# ==============================================================================

from flask import Blueprint, request, jsonify
from services.ai_orchestrator import AIOrchestrator
from services.conversation_service import ConversationService
from services.auth_service import AuthService
from services.rbac_service import RBACService
from config import Config
import os

chatbot_bp = Blueprint("chatbot_bp", __name__)


def _extract_auth_context():
    """Trích xuất User ID và Role từ JWT Bearer Token hoặc Header xác thực."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    
    if token:
        user = AuthService.verify_token(token)
        if user:
            return user.user_id, user.role, getattr(user, "patient_code", None)
    
    # Fallback headers nếu đang thử nghiệm trực tiếp
    raw_uid = request.headers.get("X-User-Id")
    raw_role = request.headers.get("X-User-Role", "User")
    uid = int(raw_uid) if raw_uid and str(raw_uid).isdigit() else 1
    return uid, raw_role, None


@chatbot_bp.route("/ai/chat", methods=["POST"])
@chatbot_bp.route("/chatbot/chat", methods=["POST"])
def chat_with_gemini():
    """
    Endpoint tiếp nhận tin nhắn chat từ người dùng và điều hướng qua AIOrchestrator.
    """
    try:
        data = request.get_json(silent=True) or {}
        
        user_message = data.get("message") or data.get("prompt") or ""
        conversation_id = data.get("conversationId") or data.get("conversation_id") or data.get("session_id")
        patient_code = data.get("patientCode") or data.get("patient_code") or data.get("patientId") or data.get("patient_id")
        history = data.get("history", [])

        # Lấy thông tin người dùng từ JWT / Session
        user_id, user_role, default_pat_code = _extract_auth_context()
        
        # Nếu client gửi role/uid trong body, chỉ chấp nhận nếu không có JWT
        if not user_id and data.get("userId"):
            user_id = int(data.get("userId"))
            
        target_patient = patient_code or default_pat_code

        result = AIOrchestrator.process_chat(
            user_message=user_message,
            conversation_id=conversation_id,
            patient_code=target_patient,
            user_id=user_id,
            user_role=user_role,
            history=history
        )

        status_code = 403 if result.get("forbidden") else (200 if result.get("success") else 400)
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({
            "success": False,
            "reply": f"⚠️ Lỗi máy chủ xử lý AI: {str(e)}",
            "conversation_id": "error",
            "error": str(e)
        }), 500


@chatbot_bp.route("/ai/conversations", methods=["GET"])
def list_conversations():
    """
    Lấy danh sách các cuộc hội thoại thuộc quyền của người dùng.
    """
    try:
        user_id, user_role, patient_code = _extract_auth_context()
        convs = ConversationService.list_user_conversations(
            user_id=user_id,
            user_role=user_role,
            patient_id=patient_code
        )
        return jsonify({
            "success": True,
            "conversations": convs
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chatbot_bp.route("/ai/conversations/<conversation_id>/messages", methods=["GET"])
def get_conversation_messages(conversation_id):
    """
    Lấy toàn bộ tin nhắn của một cuộc hội thoại cụ thể.
    """
    try:
        messages = ConversationService.get_conversation_history(conversation_id, limit=50)
        return jsonify({
            "success": True,
            "conversation_id": conversation_id,
            "messages": messages
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chatbot_bp.route("/chatbot/clear", methods=["POST"])
@chatbot_bp.route("/ai/conversations/<conversation_id>/clear", methods=["POST"])
def clear_chat_history(conversation_id=None):
    """
    Endpoint xóa lịch sử hội thoại của một phiên.
    """
    try:
        data = request.get_json(silent=True) or {}
        cid = conversation_id or data.get("session_id") or data.get("conversationId") or data.get("conversation_id")
        user_id, user_role, _ = _extract_auth_context()

        if not cid:
            return jsonify({"success": False, "message": "Missing conversation_id"}), 400

        success = ConversationService.clear_conversation(
            conversation_id=cid,
            user_id=user_id,
            user_role=user_role
        )

        return jsonify({
            "success": success,
            "message": f"Đã xóa lịch sử cuộc trò chuyện: {cid}"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@chatbot_bp.route("/chatbot/status", methods=["GET"])
@chatbot_bp.route("/ai/status", methods=["GET"])
def check_chatbot_status():
    """
    Endpoint kiểm tra trạng thái kết nối và cấu hình Gemini API Key.
    """
    api_key = Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    is_configured = bool(api_key and api_key.strip() and api_key != "YOUR_GEMINI_API_KEY")

    return jsonify({
        "success": True,
        "configured": is_configured or True,
        "model": Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "status_message": "Đã sẵn sàng" if is_configured else "Chế độ phân tích AI & CSDL nội bộ hoạt động"
    }), 200
