"""
Route Patient AI - Trợ Lý Y Tế Cá Nhân (ElderlyCare AI Medical Assistant)
Endpoints:
- POST /api/ai/patient-chat
- GET  /api/ai/patient/conversations
- GET  /api/ai/patient/history/<conversation_id>
- POST /api/ai/patient/clear
- GET  /api/ai/patient/status
"""

from flask import Blueprint, request, jsonify
from services.ai.patient_ai_service import PatientAIService
from services.rbac_service import RBACService
from models.conversation import Conversation, Message

ai_patient_bp = Blueprint("ai_patient_bp", __name__)


@ai_patient_bp.route("/ai/patient-chat", methods=["POST"])
@ai_patient_bp.route("/my/ai/chat", methods=["POST"])
@ai_patient_bp.route("/user/ai/chat", methods=["POST"])
def patient_chat():
    """
    Endpoint tiếp nhận tin nhắn chat từ Bệnh nhân / Thân nhân.
    Backend tự động xác thực và kiểm soát quyền truy cập patient_id.
    """
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    # Lấy thông tin xác thực từ Header hoặc Payload
    user_id = request.headers.get("X-User-Id", data.get("userId") or request.args.get("userId") or 2)
    user_role = request.headers.get("X-User-Role", data.get("userRole") or request.args.get("userRole") or "User")
    requested_patient_id = data.get("patientId") or data.get("patient_id") or request.args.get("patient_id")

    uid = int(user_id) if str(user_id).isdigit() else 2

    # Lấy patient_id hợp lệ cho tài khoản này
    allowed_ids = RBACService.get_authorized_patient_ids_for_user(uid, user_role)
    if requested_patient_id and requested_patient_id not in allowed_ids:
        # User cố tình truyền patient_id của người khác
        return jsonify({
            "success": False,
            "reply": f"🔒 403 Forbidden: Bạn không có quyền truy cập dữ liệu của bệnh nhân {requested_patient_id}.",
            "error": "Unauthorized patient access",
            "forbidden": True
        }), 403

    effective_pid = requested_patient_id if (requested_patient_id and requested_patient_id in allowed_ids) else (allowed_ids[0] if allowed_ids else "PAT10000")

    conversation_id = data.get("conversationId") or f"patient_conv_{effective_pid}"
    history = data.get("history", [])

    if not user_message:
        return jsonify({
            "success": False,
            "reply": "⚠️ Bạn chưa nhập nội dung câu hỏi y tế."
        }), 200

    result = PatientAIService.process_chat(
        user_message=user_message,
        conversation_id=conversation_id,
        patient_id=effective_pid,
        user_id=uid,
        user_role=user_role,
        history=history
    )

    status_code = 403 if result.get("forbidden") else 200
    return jsonify(result), status_code


@ai_patient_bp.route("/ai/patient/conversations", methods=["GET"])
@ai_patient_bp.route("/my/ai/conversations", methods=["GET"])
def patient_conversations():
    """Lấy danh sách các cuộc hội thoại của Bệnh nhân."""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    query = Conversation.query.filter_by(role_scope="PATIENT")
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if user_id and str(user_id).isdigit():
        query = query.filter_by(user_id=int(user_id))

    convs = query.order_by(Conversation.updated_at.desc()).limit(20).all()
    return jsonify({
        "success": True,
        "conversations": [c.to_dict() for c in convs]
    }), 200


@ai_patient_bp.route("/ai/patient/history/<conversation_id>", methods=["GET"])
@ai_patient_bp.route("/my/ai/history/<conversation_id>", methods=["GET"])
def patient_history(conversation_id):
    """Lấy lịch sử tin nhắn của cuộc hội thoại Bệnh nhân."""
    conv = Conversation.query.filter_by(conversation_id=conversation_id, role_scope="PATIENT").first()
    if not conv:
        return jsonify({"success": False, "messages": []}), 404

    msgs = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return jsonify({
        "success": True,
        "conversation": conv.to_dict(),
        "messages": [m.to_dict() for m in msgs]
    }), 200


@ai_patient_bp.route("/ai/patient/clear", methods=["POST"])
def patient_clear():
    """Xóa lịch sử cuộc trò chuyện của một phiên Bệnh nhân."""
    data = request.get_json(silent=True) or {}
    conv_id = data.get("conversationId") or data.get("session_id")
    if conv_id:
        try:
            conv = Conversation.query.filter_by(conversation_id=conv_id, role_scope="PATIENT").first()
            if conv:
                Message.query.filter_by(conversation_id=conv_id).delete()
                db.session.delete(conv)
                db.session.commit()
            return jsonify({"success": True, "message": "Đã làm sạch cuộc trò chuyện."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500
    return jsonify({"success": True}), 200


@ai_patient_bp.route("/ai/patient/status", methods=["GET"])
@ai_patient_bp.route("/my/ai/status", methods=["GET"])
def patient_status():
    """Kiểm tra trạng thái sẵn sàng của Trợ lý AI Bệnh nhân."""
    api_key = PatientAIService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key not in ["YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"])
    return jsonify({
        "success": True,
        "role": "PATIENT",
        "configured": is_configured,
        "model": PatientAIService.get_model_name(),
        "status_message": "Trợ lý Y Tế AI Chăm Sóc đã sẵn sàng" if is_configured else "Chế độ phân tích lâm sàng nội bộ"
    }), 200
