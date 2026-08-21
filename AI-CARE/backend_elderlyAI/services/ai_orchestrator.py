# ==============================================================================
# AI ORCHESTRATOR (AI_ORCHESTRATOR.PY)
# Trung Tâm Điều Phối AI Y Tế & Database Hybrid Assistant
# ==============================================================================

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from services.rbac_service import RBACService
from services.auth_permission_service import AuthPermissionService
from services.ai.ai_intent_router import AIIntentRouter
from services.ai.admin_ai_service import AdminAIService
from services.ai.patient_ai_service import PatientAIService
from services.conversation_service import ConversationService

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """
    Trung tâm điều phối duy nhất cho mọi yêu cầu Chatbot AI của ElderlyCare AI.
    Đảm bảo:
    1. Xác thực & Phân quyền RBAC nghiêm ngặt
    2. Phân lập dữ liệu bệnh nhân tuyệt đối (Patient Isolation)
    3. Nhận diện Intent & Routing Tool chuẩn xác
    4. Xử lý câu hỏi kết hợp (Mixed Query: Database + Medical Knowledge)
    5. Lưu vết và quản lý bộ nhớ hội thoại (Conversation Memory)
    """

    @classmethod
    def process_chat(
        cls,
        user_message: str,
        conversation_id: Optional[str] = None,
        patient_code: Optional[str] = None,
        user_id: Optional[int] = None,
        user_role: str = "User",
        history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        msg = (user_message or "").strip()
        if not msg:
            return {
                "success": False,
                "reply": "⚠️ Bạn chưa nhập nội dung câu hỏi.",
                "conversation_id": conversation_id,
                "error": "EMPTY_MESSAGE"
            }

        # 1. Chuẩn hóa Role & User ID từ Token/Server Authentication
        is_admin = RBACService.is_admin_role(user_role)
        effective_role = "Admin" if is_admin else "Patient"
        uid = int(user_id) if user_id and str(user_id).isdigit() else (1001 if is_admin else 1)

        # 2. Phân tích Intent sơ bộ
        intent_info = AIIntentRouter.detect_intent(msg)
        intent_type = intent_info.get("intent", "GENERAL_CONVERSATION")
        extracted_pid = intent_info.get("patient_id")

        # 3. Xác định Patient Context & Kiểm tra Phân Lập Bệnh Nhân (Patient Isolation)
        target_pid = patient_code or extracted_pid

        if not is_admin:
            # Lấy danh sách mã bệnh nhân được cấp quyền cho tài khoản này
            authorized_pids = AuthPermissionService.get_authorized_patient_ids(uid, user_role)
            
            # Nếu người dùng hỏi về một mã bệnh nhân cụ thể khác quyền
            if extracted_pid and extracted_pid not in authorized_pids:
                denied_reply = "⛔ **Từ chối truy cập**: Tài khoản của bạn không có quyền xem thông tin hoặc hồ sơ y tế của bệnh nhân khác."
                # Lưu log vào hội thoại
                conv = ConversationService.get_or_create_conversation(
                    conversation_id=conversation_id,
                    user_id=uid,
                    user_role=user_role,
                    patient_id=authorized_pids[0] if authorized_pids else "PAT10000"
                )
                actual_cid = conv.conversation_id
                ConversationService.save_message(actual_cid, "user", msg)
                ConversationService.save_message(actual_cid, "assistant", denied_reply)

                return {
                    "success": False,
                    "forbidden": True,
                    "conversation_id": actual_cid,
                    "reply": denied_reply,
                    "message": {
                        "role": "assistant",
                        "content": denied_reply,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    "metadata": {
                        "intent": "PATIENT_DATA",
                        "data_source": "access_control_denied",
                        "patient_code": extracted_pid
                    }
                }

            # Nếu không có target_pid được chỉ định, mặc định lấy bệnh nhân đầu tiên được cấp quyền
            if not target_pid or target_pid not in authorized_pids:
                target_pid = authorized_pids[0] if authorized_pids else "PAT10000"
        else:
            # Với Admin, nếu có trích xuất mã bệnh nhân thì ưu tiên dùng
            if not target_pid and extracted_pid:
                target_pid = extracted_pid
            if not target_pid:
                target_pid = "PAT10000"

        # 4. Lấy hoặc tạo phiên hội thoại (Conversation Memory)
        conv = ConversationService.get_or_create_conversation(
            conversation_id=conversation_id,
            user_id=uid,
            user_role=user_role,
            patient_id=target_pid
        )
        actual_cid = conv.conversation_id

        # Lưu tin nhắn người dùng
        ConversationService.save_message(actual_cid, "user", msg)

        # 5. Lấy lịch sử hội thoại nếu client không truyền
        if not history:
            db_history = ConversationService.get_conversation_history(actual_cid, limit=10)
            history = [{"role": m["role"], "text": m["content"]} for m in db_history if m["role"] in ("user", "model", "assistant")]

        # 6. Điều hướng xử lý theo Role (Admin Scope vs Patient Scope)
        try:
            if is_admin:
                result = AdminAIService.process_chat(
                    user_message=msg,
                    conversation_id=actual_cid,
                    user_id=uid,
                    user_role="Admin",
                    history=history
                )
            else:
                result = PatientAIService.process_chat(
                    user_message=msg,
                    conversation_id=actual_cid,
                    patient_id=target_pid,
                    user_id=uid,
                    user_role=user_role,
                    history=history
                )

            reply_text = result.get("reply") or result.get("answer") or "🤖 Đã nhận phản hồi từ AI."
            structured_data = result.get("structured_data") or result.get("metadata")

            # Lưu tin nhắn phản hồi của Assistant vào DB
            ConversationService.save_message(
                conversation_id=actual_cid,
                role="assistant",
                content=reply_text,
                structured_data=structured_data
            )

            # Xác định nguồn dữ liệu (Data Source Transparency)
            data_source = "database + medical_knowledge"
            if intent_type == "GENERAL_MEDICAL":
                data_source = "medical_knowledge"
            elif intent_type in ("PATIENT_DATA", "MEDICATION", "HEALTH_RECORD", "VITAL_SIGNS", "ALERT", "CAMERA"):
                data_source = "database"
            elif intent_type == "SYSTEM_STATISTICS":
                data_source = "system_data"
            elif intent_type == "GENERAL_CONVERSATION":
                data_source = "general_conversation"

            return {
                "success": True,
                "conversation_id": actual_cid,
                "reply": reply_text,
                "message": {
                    "role": "assistant",
                    "content": reply_text,
                    "timestamp": datetime.utcnow().isoformat()
                },
                "metadata": {
                    "intent": intent_type,
                    "data_source": data_source,
                    "patient_code": target_pid,
                    "role": effective_role,
                    "tools_called": result.get("tools_called", [])
                }
            }

        except Exception as e:
            logger.exception(f"Lỗi trong AIOrchestrator: {e}")
            error_reply = f"⚠️ Trợ lý AI hiện đang gặp sự cố kết nối: {str(e)}"
            ConversationService.save_message(actual_cid, "assistant", error_reply)
            return {
                "success": False,
                "conversation_id": actual_cid,
                "reply": error_reply,
                "error": str(e),
                "message": {
                    "role": "assistant",
                    "content": error_reply,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
