# ==============================================================================
# ROUTE ADMIN AI - QUẢN TRỊ VIỆN (ADMIN_AI_ROUTES.PY)
# ==============================================================================
from flask import Blueprint, request, jsonify
from services.ai.admin_gemini_service import AdminGeminiService
from models.conversation import Conversation, Message

admin_ai_bp = Blueprint("admin_ai_bp", __name__)


@admin_ai_bp.route("/admin/ai/chat", methods=["POST"])
def admin_ai_chat():
    """
    Endpoint tiếp nhận tin nhắn chat từ Quản trị viên (Admin AI Chat).
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({
            "success": False,
            "reply": "🔒 403 Forbidden: Chỉ tài khoản Quản trị viên mới có quyền truy cập Admin AI.",
            "error": "Unauthorized role"
        }), 403

    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    conversation_id = data.get("conversationId") or "admin_session_default"
    user_id = request.headers.get("X-User-Id", data.get("userId") or 1)
    history = data.get("history", [])

    if not user_message:
        return jsonify({
            "success": False,
            "reply": "⚠️ Bạn chưa nhập nội dung câu hỏi quản trị."
        }), 200

    result = AdminGeminiService.process_chat(
        user_message=user_message,
        conversation_id=conversation_id,
        user_id=int(user_id) if str(user_id).isdigit() else 1,
        history=history
    )
    return jsonify(result), 200


@admin_ai_bp.route("/admin/ai/conversations", methods=["GET"])
def admin_ai_conversations():
    """
    Lấy danh sách các cuộc hội thoại thuộc phạm vi Admin.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if (user_role or "").upper() != "ADMIN":
        return jsonify({"success": False, "message": "403 Forbidden"}), 403

    convs = Conversation.query.filter_by(role_scope="ADMIN").order_by(Conversation.updated_at.desc()).limit(20).all()
    return jsonify({
        "success": True,
        "conversations": [c.to_dict() for c in convs]
    }), 200


@admin_ai_bp.route("/admin/ai/history/<conversation_id>", methods=["GET"])
def admin_ai_history(conversation_id):
    """
    Lấy chi tiết tin nhắn của một cuộc hội thoại Admin.
    """
    conv = Conversation.query.filter_by(conversation_id=conversation_id, role_scope="ADMIN").first()
    if not conv:
        return jsonify({"success": False, "messages": []}), 404

    msgs = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return jsonify({
        "success": True,
        "conversation": conv.to_dict(),
        "messages": [m.to_dict() for m in msgs]
    }), 200


@admin_ai_bp.route("/admin/ai/search/patients", methods=["GET"])
def admin_ai_search_patients():
    """
    Endpoint tìm kiếm bệnh nhân tham số hóa và phân trang chuẩn cho Admin AI.
    """
    from services.ai_tools.patient_tools import search_patients_advanced
    q = request.args.get("q") or request.args.get("query")
    allergy = request.args.get("allergy")
    disease = request.args.get("disease")
    medicine = request.args.get("medicine") or request.args.get("medicine_name")
    medication_status = request.args.get("medication_status") or request.args.get("status")
    spo2_max = request.args.get("spo2_max", type=int)
    age_min = request.args.get("age_min", type=int)
    age_max = request.args.get("age_max", type=int)
    gender = request.args.get("gender")
    risk_level = request.args.get("risk_level")
    phone = request.args.get("phone")

    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("pageSize", type=int) or request.args.get("page_size", type=int) or request.args.get("limit", default=20, type=int)
    sort_by = request.args.get("sortBy") or request.args.get("sort_by") or "user_id"
    sort_order = request.args.get("sortOrder") or request.args.get("sort_order") or "asc"

    search_res = search_patients_advanced(
        query=q,
        allergy=allergy,
        disease=disease,
        medicine_name=medicine,
        medication_status=medication_status,
        spo2_max=spo2_max,
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        risk_level=risk_level,
        phone=phone,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return jsonify(search_res), 200



@admin_ai_bp.route("/admin/ai/status", methods=["GET"])
def admin_ai_status():
    """
    Kiểm tra trạng thái cấu hình Gemini AI Admin.
    """
    api_key = AdminGeminiService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key != "YOUR_GEMINI_API_KEY")
    return jsonify({
        "success": True,
        "role": "ADMIN",
        "configured": is_configured,
        "model": AdminGeminiService.get_model_name(),
        "status_message": "Admin AI đã sẵn sàng" if is_configured else "Chế độ phân tích quản trị nội bộ"
    }), 200
