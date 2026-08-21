"""
Route Admin AI - Trợ Lý Y Tế & Quản Trị Hệ Thống Toàn Viện
Endpoints:
- POST /api/ai/admin-chat
- GET  /api/ai/admin/conversations
- GET  /api/ai/admin/history/<conversation_id>
- POST /api/ai/admin/clear
- GET  /api/ai/admin/status
- GET  /api/ai/admin/audit-logs
"""

from flask import Blueprint, request, jsonify
from services.ai.admin_ai_service import AdminAIService
from services.rbac_service import RBACService
from models.conversation import Conversation, Message
from models.patient_memory import AIAuditLog

ai_admin_bp = Blueprint("ai_admin_bp", __name__)


@ai_admin_bp.route("/ai/admin-chat", methods=["POST"])
@ai_admin_bp.route("/admin/ai/chat", methods=["POST"])
def admin_chat():
    """
    Endpoint tiếp nhận tin nhắn chat từ Quản trị viên & Bác sĩ.
    Kiểm tra RBAC nghiêm ngặt.
    """
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if not RBACService.is_admin_role(user_role):
        return jsonify({
            "success": False,
            "reply": "🔒 403 Forbidden: Chỉ tài khoản Quản trị viên mới có quyền truy cập Admin AI.",
            "error": "Unauthorized role",
            "forbidden": True
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

    result = AdminAIService.process_chat(
        user_message=user_message,
        conversation_id=conversation_id,
        user_id=int(user_id) if str(user_id).isdigit() else 1,
        user_role=user_role,
        history=history
    )
    return jsonify(result), 200


@ai_admin_bp.route("/ai/admin/conversations", methods=["GET"])
@ai_admin_bp.route("/admin/ai/conversations", methods=["GET"])
def admin_conversations():
    """Lấy danh sách các cuộc hội thoại của Quản trị viên."""
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if not RBACService.is_admin_role(user_role):
        return jsonify({"success": False, "message": "403 Forbidden"}), 403

    convs = Conversation.query.filter_by(role_scope="ADMIN").order_by(Conversation.updated_at.desc()).limit(20).all()
    return jsonify({
        "success": True,
        "conversations": [c.to_dict() for c in convs]
    }), 200


@ai_admin_bp.route("/ai/admin/history/<conversation_id>", methods=["GET"])
@ai_admin_bp.route("/admin/ai/history/<conversation_id>", methods=["GET"])
def admin_history(conversation_id):
    """Lấy lịch sử tin nhắn của cuộc hội thoại Quản trị viên."""
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if not RBACService.is_admin_role(user_role):
        return jsonify({"success": False, "message": "403 Forbidden"}), 403

    conv = Conversation.query.filter_by(conversation_id=conversation_id, role_scope="ADMIN").first()
    if not conv:
        return jsonify({"success": False, "messages": []}), 404

    msgs = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return jsonify({
        "success": True,
        "conversation": conv.to_dict(),
        "messages": [m.to_dict() for m in msgs]
    }), 200


@ai_admin_bp.route("/ai/admin/clear", methods=["POST"])
def admin_clear():
    """Xóa lịch sử cuộc trò chuyện Quản trị viên."""
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if not RBACService.is_admin_role(user_role):
        return jsonify({"success": False, "message": "403 Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    conv_id = data.get("conversationId") or data.get("session_id")
    if conv_id:
        try:
            conv = Conversation.query.filter_by(conversation_id=conv_id, role_scope="ADMIN").first()
            if conv:
                Message.query.filter_by(conversation_id=conv_id).delete()
                db.session.delete(conv)
                db.session.commit()
            return jsonify({"success": True, "message": "Đã làm sạch phiên quản trị."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500
    return jsonify({"success": True}), 200


@ai_admin_bp.route("/ai/admin/status", methods=["GET"])
@ai_admin_bp.route("/admin/ai/status", methods=["GET"])
def admin_status():
    """Kiểm tra trạng thái sẵn sàng của Admin AI."""
    api_key = AdminAIService.get_api_key()
    is_configured = bool(api_key and api_key.strip() and api_key not in ["YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"])
    return jsonify({
        "success": True,
        "role": "ADMIN",
        "configured": is_configured,
        "model": AdminAIService.get_model_name(),
        "status_message": "Admin AI đã sẵn sàng" if is_configured else "Chế độ phân tích quản trị nội bộ"
    }), 200


@ai_admin_bp.route("/ai/admin/audit-logs", methods=["GET"])
def admin_audit_logs():
    """Lấy danh sách nhật ký kiểm toán (Audit Trail) cho Admin."""
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "Admin"))
    if not RBACService.is_admin_role(user_role):
        return jsonify({"success": False, "message": "403 Forbidden"}), 403

    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=30, type=int)

    query = AIAuditLog.query.order_by(AIAuditLog.created_at.desc())
    total = query.count()
    logs = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "logs": [l.to_dict() for l in logs]
    }), 200
