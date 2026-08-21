# ==============================================================================
# ROUTE USER AI - THÂN NHÂN GIA ĐÌNH (USER_AI_ROUTES.PY)
# ==============================================================================
from flask import Blueprint, request, jsonify
from services.ai.patient_ai_service import PatientAIService
from services.rbac_service import RBACService
from models.conversation import Conversation, Message
from middleware.auth_middleware import get_current_user

user_ai_bp = Blueprint("user_ai_bp", __name__)


@user_ai_bp.route("/my/ai/chat", methods=["POST"])
@user_ai_bp.route("/user/ai/chat", methods=["POST"])
def user_ai_chat():
    """
    Endpoint tiếp nhận tin nhắn chat từ Thân nhân Gia đình & Bệnh nhân (Patient/User AI Chat).
    """
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    user_id = user.user_id if user else (request.headers.get("X-User-Id") or data.get("userId") or 1)
    user_role = user.role if user else (request.headers.get("X-User-Role") or data.get("userRole") or "Patient")
    patient_id = data.get("patient_code") or data.get("patientId") or data.get("patient_id") or (user.patient_code if user else "PAT10000")

    uid = int(user_id) if str(user_id).isdigit() else 1

    # Validate quyền truy cập dữ liệu bệnh nhân
    if not RBACService.validate_patient_access(uid, user_role, patient_id):
        return jsonify({
            "success": False,
            "reply": f"🔒 403 Forbidden: Bạn không có quyền truy cập dữ liệu của hồ sơ '{patient_id}'.",
            "error": "Unauthorized patient access",
            "forbidden": True
        }), 403

    conversation_id = data.get("conversationId") or f"user_session_{patient_id}"
    history = data.get("history", [])

    if not user_message:
        return jsonify({
            "success": False,
            "reply": "⚠️ Bạn chưa nhập nội dung câu hỏi chăm sóc."
        }), 200

    result = PatientAIService.process_chat(
        user_message=user_message,
        conversation_id=conversation_id,
        patient_id=patient_id,
        user_id=uid,
        user_role=user_role,
        history=history
    )
    return jsonify(result), 200


@user_ai_bp.route("/my/ai/conversations", methods=["GET"])
def user_ai_conversations():
    """
    Lấy danh sách các cuộc hội thoại của thân nhân theo người thân cụ thể.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    query = Conversation.query.filter_by(role_scope="USER")
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if user_id and str(user_id).isdigit():
        query = query.filter_by(user_id=int(user_id))

    convs = query.order_by(Conversation.updated_at.desc()).limit(20).all()
    return jsonify({
        "success": True,
        "conversations": [c.to_dict() for c in convs]
    }), 200


@user_ai_bp.route("/my/ai/history/<conversation_id>", methods=["GET"])
def user_ai_history(conversation_id):
    """
    Lấy chi tiết tin nhắn của một cuộc hội thoại User.
    """
    conv = Conversation.query.filter_by(conversation_id=conversation_id, role_scope="USER").first()
    if not conv:
        return jsonify({"success": False, "messages": []}), 404

    msgs = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return jsonify({
        "success": True,
        "conversation": conv.to_dict(),
        "messages": [m.to_dict() for m in msgs]
    }), 200


@user_ai_bp.route("/my/ai/search/patients", methods=["GET"])
def user_ai_search_patients():
    """
    Endpoint tìm kiếm bệnh nhân trong phạm vi quyền được cấp của User.
    """
    from services.auth_permission_service import AuthPermissionService
    from services.ai_tools.patient_tools import get_patient_profile
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    results = []
    for pid in allowed_ids:
        prof = get_patient_profile(pid)
        if prof.get("found"):
            results.append(prof)

    return jsonify({
        "success": True,
        "total": len(results),
        "data": results
    }), 200



@user_ai_bp.route("/my/ai/status", methods=["GET"])
def user_ai_status():
    """
    Kiểm tra trạng thái cấu hình Gemini AI User.
    """
    api_key = PatientAIService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key != "YOUR_GEMINI_API_KEY")
    return jsonify({
        "success": True,
        "role": "USER",
        "configured": is_configured,
        "model": PatientAIService.get_model_name(),
        "status_message": "Trợ lý Chăm Sóc đã sẵn sàng" if is_configured else "Chế độ chăm sóc nội bộ"
    }), 200
