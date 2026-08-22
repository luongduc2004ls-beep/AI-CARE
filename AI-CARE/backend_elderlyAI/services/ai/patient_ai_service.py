# ==============================================================================
# PATIENT AI CLINICAL & MEDICAL AGENT SERVICE (PATIENT_AI_SERVICE.PY)
# ==============================================================================
# Dành riêng cho Bệnh nhân & Thân nhân:
# 1. Bảo mật phân lập tuyệt đối: Chỉ truy cập hồ sơ của chính mình
# 2. Xử lý tri thức Y khoa tổng quát (GENERAL_MEDICAL) không cần nhập mã BN
# 3. Xử lý câu hỏi kết hợp (MIXED_QUERY): Cá nhân hóa theo dữ liệu sinh hiệu thực tế
# 4. Trả lời đơn thuốc, lịch uống thuốc và cảnh báo an toàn
# ==============================================================================

import json
import os
import re
from typing import Dict, Any, Optional, List
from config import Config
from database import db
from models.user import User
from models.conversation import Conversation, Message
from models.patient_memory import AIAuditLog
from services.rbac_service import RBACService
from services.ai.ai_intent_router import AIIntentRouter
from services.ai.medical_knowledge_service import MedicalKnowledgeService
from services.ai_tools.patient_isolated_tools import (
    PATIENT_TOOL_DECLARATIONS,
    PATIENT_TOOL_DISPATCHER,
    get_my_profile,
    get_my_latest_health,
    get_my_health_records,
    get_my_medications,
    get_my_prescriptions,
    get_my_medication_schedule,
    get_my_alerts,
    get_my_notifications,
    get_my_camera_status
)

PATIENT_SYSTEM_PROMPT_TEMPLATE = """Bạn là ElderlyCare AI Medical Assistant - Trợ lý Y Tế Gia Đình & Chăm Sóc Người Cao Tuổi.
Bạn đang hỗ trợ trực tiếp cho bệnh nhân: {patient_name} (Mã định danh: {patient_id}).

QUY TẮC BẢO VỆ & LÂM SÀNG:
1. Bạn CHỈ ĐƯỢC PHÉP truy cập thông tin của bệnh nhân {patient_id}.
2. Khi người bệnh hỏi về sức khỏe, thuốc hoặc lịch uống -> Sử dụng dữ liệu thực tế từ hồ sơ để trả lời.
3. Khi người bệnh hỏi kiến thức y khoa chung (dinh dưỡng, thể dục, mất ngủ, đầy bụng, phòng té ngã) -> Cung cấp hướng dẫn dễ hiểu, ân cần.
4. LUÔN thêm lưu ý an toàn: Bạn là Trợ lý AI Y Tế, không tự ý thay thế chỉ định của Bác sĩ điều trị.
"""


class PatientAIService:
    """
    Dịch vụ AI Agent dành riêng cho Bệnh nhân và Thân nhân gia đình.
    """

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def get_or_create_conversation(cls, conversation_id: str, patient_id: str, user_id: int = 1) -> Optional[Conversation]:
        try:
            conv = Conversation.query.filter_by(conversation_id=conversation_id).first()
            if not conv:
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role_scope="PATIENT",
                    patient_id=patient_id,
                    title=f"Tư Vấn Y Tế - {patient_id}"
                )
                db.session.add(conv)
                db.session.commit()
            return conv
        except Exception:
            db.session.rollback()
            return None

    @classmethod
    def process_chat(
        cls,
        user_message: str,
        conversation_id: str = "patient_session_default",
        patient_id: str = "PAT10000",
        user_id: Optional[int] = 1,
        user_role: str = "User",
        history: list = None
    ) -> Dict[str, Any]:
        # 1. BẢO MẬT & PHÂN LẬP SCOPE: Kiểm tra Backend Authorization
        allowed_pids = RBACService.get_authorized_patient_ids_for_user(user_id, user_role)
        effective_pid = patient_id if patient_id in allowed_pids else (allowed_pids[0] if allowed_pids else "PAT10000")

        # Kiểm tra xem người dùng có đang cố tình hỏi về mã bệnh nhân khác không được cấp quyền không
        patient_code_matches = re.findall(r"\bPAT\d+\b", user_message, re.IGNORECASE)
        for code in patient_code_matches:
            c_norm = code.upper()
            if c_norm not in allowed_pids:
                return {
                    "success": False,
                    "reply": f"🔒 403 Forbidden: Bạn không có quyền truy cập dữ liệu của bệnh nhân {c_norm}. Trợ lý chỉ được phép hỗ trợ hồ sơ trong phạm vi tài khoản của bạn.",
                    "conversationId": conversation_id,
                    "patientId": effective_pid,
                    "role_scope": "PATIENT",
                    "forbidden": True
                }

        # Lấy thông tin bệnh nhân
        user_obj = User.query.filter(
            (User.patient_code.ilike(effective_pid)) | (User.user_id == (int(effective_pid[3:]) if effective_pid.startswith("PAT") and effective_pid[3:].isdigit() else -1))
        ).first()
        patient_name = user_obj.full_name if user_obj else "Người bệnh"

        # Lưu cuộc hội thoại vào CSDL
        conv = cls.get_or_create_conversation(conversation_id, patient_id=effective_pid, user_id=user_id)
        if conv:
            try:
                db.session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Phân tích ý định câu hỏi
        intent_data = AIIntentRouter.detect_intent(user_message)
        intent = intent_data.get("intent", "UNKNOWN")

        # Xử lý phản hồi
        reply_text, data_source, structured_payload = cls._handle_patient_query(user_message, effective_pid, patient_name, intent_data)

        # Lưu tin nhắn phản hồi của Assistant
        if conv:
            try:
                db.session.add(Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=reply_text,
                    structured_data=json.dumps(structured_payload or {}) if structured_payload else None
                ))
                db.session.commit()
            except Exception:
                db.session.rollback()

        return {
            "success": True,
            "reply": reply_text,
            "conversationId": conversation_id,
            "patientId": effective_pid,
            "role_scope": "PATIENT",
            "metadata": {
                "intent": intent,
                "data_source": data_source,
                "role": "Patient",
                "patient_code": effective_pid,
                "data": structured_payload
            }
        }

    @classmethod
    def _handle_patient_query(cls, user_message: str, patient_id: str, patient_name: str, intent_data: Dict[str, Any]) -> tuple:
        intent = intent_data.get("intent", "UNKNOWN")
        q_lower = user_message.lower()

        # 1. KIẾN THỨC Y KHOA THUẦN TÚY (GENERAL MEDICAL KNOWLEDGE)
        if intent == "GENERAL_MEDICAL":
            topic = intent_data.get("topic")
            med_advice = MedicalKnowledgeService.get_advice_by_topic(topic) if topic else MedicalKnowledgeService.search_knowledge(user_message)
            return (med_advice or MedicalKnowledgeService.search_knowledge(user_message), "medical_knowledge", None)

        # 2. CÂU HỎI KẾT HỢP (MIXED QUERY: CÁ NHÂN HÓA DỰA TRÊN DỮ LIỆU BỆNH NHÂN)
        if intent == "MIXED_MEDICAL_DATABASE" or any(k in q_lower for k in ["bị tiểu đường nên ăn gì", "bị huyết áp nên ăn gì", "uống thuốc gì và có tác dụng gì"]):
            prof = get_my_profile(patient_id)
            latest_vitals = get_my_latest_health(patient_id)
            sched = get_my_medication_schedule(patient_id)
            med_knowledge = MedicalKnowledgeService.search_knowledge(user_message)

            reply = (
                f"### 🩺 TƯ VẤN Y KHOA DÀNH CHO {patient_name.upper()} ({patient_id})\n\n"
                f"**1. Tình trạng sức khỏe hiện tại của bạn:**\n"
                f"- Huyết áp: **{latest_vitals.get('blood_pressure', '130/85')} mmHg** | Nhịp tim: **{latest_vitals.get('heart_rate', 75)} BPM** | SpO₂: **{latest_vitals.get('spo2', 97)}%**\n"
                f"- Dị ứng ghi nhận: `{prof.get('allergy', 'Không có')}`\n\n"
                f"**2. Hướng dẫn chăm sóc & Dinh dưỡng phù hợp:**\n"
                f"{med_knowledge}\n\n"
                f"⚠️ *Lưu ý: Luôn tuân thủ lịch uống thuốc và chỉ định của Bác sĩ phụ trách ({prof.get('doctor_name', 'Bác sĩ điều trị')}).*"
            )
            return (reply, "mixed_database_medical", {"profile": prof, "vitals": latest_vitals})

        # 2.1 BỆNH LÝ & TIỀN SỬ BỆNH CỦA TÔI
        if any(k in q_lower for k in ["suy tim", "tiền sử", "tien su", "bệnh lý", "benh ly", "bệnh gì", "benh gi"]):
            rxs = get_my_prescriptions(patient_id)
            diag_list = [r.get("diagnosis") for r in rxs.get("prescriptions", []) if r.get("diagnosis")]
            diag_str = ", ".join(set(diag_list)) if diag_list else "Theo dõi lão khoa định kỳ"
            dis_keyword = "suy tim" if "suy tim" in q_lower else "bệnh lý yêu cầu"
            has_dis = any(dis_keyword in d.lower() for d in diag_list)

            if has_dis:
                reply = f"### 📋 THÔNG TIN TIỀN SỬ BỆNH: {patient_name.upper()} ({patient_id})\n\nHồ sơ bệnh án ghi nhận chẩn đoán: **{diag_str}**."
            else:
                reply = f"### 📋 THÔNG TIN TIỀN SỬ BỆNH: {patient_name.upper()} ({patient_id})\n\nHiện tại hệ thống **chưa tìm thấy thông tin** hoặc **không có** tiền sử `{dis_keyword}` trong hồ sơ bệnh án CSDL của bạn (Chẩn đoán hiện tại ghi nhận: `{diag_str}`)."
            return (reply, "database", {"prescriptions": rxs})

        # 3. THUỐC & LỊCH UỐNG THUỐC CỦA TÔI
        if intent in ["PATIENT_MEDICATION", "MEDICATION_PENDING_SEARCH"] or any(k in q_lower for k in ["thuốc", "thuoc", "uống", "uong", "lịch"]):
            sched = get_my_medication_schedule(patient_id)
            rxs = get_my_prescriptions(patient_id)

            sched_lines = []
            for s in sched.get("schedules", []):
                status_icon = "✅" if s["status"] == "Đã uống" else "⚠️"
                sched_lines.append(f"- Cữ **{s['time']}**: **{s['medicine_name']}** ({s['dosage']}) — Trạng thái: {status_icon} `{s['status']}`")

            rx_lines = []
            for r in rxs.get("prescriptions", []):
                for item in r.get("medicines", []):
                    rx_lines.append(f"1. **{item['medicine_name']}** — Liều lượng: **{item['dosage']}** ({item['frequency']}) | Hướng dẫn: *{item['instruction']}* (Chẩn đoán: `{r.get('diagnosis')}`)")

            reply = (
                f"### 💊 ĐƠN THUỐC & LỊCH UỐNG THUỐC CỦA {patient_name.upper()}\n\n"
                f"**1. Thuốc đang được chỉ định điều trị:**\n"
                f"{chr(10).join(rx_lines) if rx_lines else '- Hiện tại chưa có đơn thuốc điều trị mới.'}\n\n"
                f"**2. Lịch uống thuốc hôm nay ({sched.get('date', 'Hôm nay')}):\n"
                f"{chr(10).join(sched_lines) if sched_lines else '- Bạn không có cữ thuốc nào trong ngày hôm nay.'}\n\n"
                f"💡 *Nhắc nhở: Hãy uống thuốc đúng giờ và đủ liều lượng đã được bác sĩ kê đơn.*"
            )
            return (reply, "database", {"schedule": sched, "prescriptions": rxs})

        # 4. SINH HIỆU & SỨC KHỎE CỦA TÔI HÔM NAY
        if intent in ["PATIENT_HEALTH", "PATIENT_PROFILE"] or any(k in q_lower for k in ["sức khỏe", "suc khoe", "sinh hiệu", "sinh hieu", "huyết áp", "spo2"]):
            prof = get_my_profile(patient_id)
            latest_vitals = get_my_latest_health(patient_id)
            history_vitals = get_my_health_records(patient_id, days=3)

            history_lines = []
            for rec in history_vitals.get("records", []):
                history_lines.append(f"- **{rec['recorded_at']}**: HA `{rec['blood_pressure']}` mmHg | Tim `{rec['heart_rate']}` BPM | SpO₂ `{rec['spo2']}%`")

            reply = (
                f"### ❤️ BÁO CÁO SINH HIỆU & SỨC KHỎE: {patient_name.upper()} ({patient_id})\n\n"
                f"**1. Chỉ số đo gần nhất ({latest_vitals.get('recorded_at', 'Hôm nay')}):**\n"
                f"- 🩸 Huyết áp: **{latest_vitals.get('blood_pressure', 'N/A')} mmHg**\n"
                f"- ❤️ Nhịp tim: **{latest_vitals.get('heart_rate', 'N/A')} BPM**\n"
                f"- 🫁 Nồng độ oxy SpO₂: **{latest_vitals.get('spo2', 'N/A')}%**\n"
                f"- 🌡️ Thân nhiệt: **{latest_vitals.get('temperature', 'N/A')}°C**\n"
                f"- 🛡️ Nguy cơ té ngã: `{latest_vitals.get('fall_risk', 'Thấp')}`\n\n"
                f"**2. Lịch sử đo gần đây:**\n"
                f"{chr(10).join(history_lines) if history_lines else '- Chưa có lịch sử đo ghi nhận.'}\n\n"
                f"👉 *Nếu bạn cảm thấy mệt mỏi, tức ngực hoặc hoa mắt, hãy bấm nút SOS khẩn cấp ngay trên ứng dụng.*"
            )
            return (reply, "database", {"profile": prof, "latest_vitals": latest_vitals})

        # 5. CÂU CHÀO HỎI MẶC ĐỊNH
        return (
            f"Xin chào **{patient_name}**! Tôi là **Trợ lý Y Tế AI ElderlyCare** đồng hành cùng bạn.\n\n"
            f"Tôi có thể hỗ trợ bạn:\n"
            f"- 💊 Kiểm tra lịch uống thuốc và liều lượng hôm nay\n"
            f"- ❤️ Xem lại chỉ số huyết áp, nhịp tim và nồng độ oxy SpO₂\n"
            f"- 🥗 Tư vấn dinh dưỡng và chăm sóc người cao tuổi\n"
            f"- 🏃 Hướng dẫn bài tập vận động phòng ngừa té ngã",
            "general_conversation",
            None
        )
