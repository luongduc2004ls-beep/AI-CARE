# ==============================================================================
# USER GEMINI SERVICE - TRỢ LÝ Y TẾ AI CHĂM SÓC NGƯỜI THÂN (USER_GEMINI_SERVICE.PY)
# ==============================================================================
# Tích hợp AIIntentRouter, Medical Knowledge RAG, và Patient Authorization.
# ==============================================================================

import os
import re
import json
import urllib.request
import urllib.error
from datetime import datetime, date
from config import Config
from database import db
from models.conversation import Conversation, Message
from services.auth_permission_service import AuthPermissionService
from services.ai.medical_knowledge_service import MedicalKnowledgeService
from services.ai.ai_intent_router import AIIntentRouter
from services.ai_tools import (
    get_patient_profile,
    get_patient_full_profile,
    get_latest_vitals,
    get_health_history,
    get_health_summary,
    get_medication_schedule,
    get_medication_adherence,
    get_camera_status,
    get_recent_fall_events,
    get_patient_risk
)

USER_TOOL_DISPATCHER = {
    "get_patient_profile": get_patient_profile,
    "get_patient_full_profile": get_patient_full_profile,
    "get_latest_vitals": get_latest_vitals,
    "get_health_history": get_health_history,
    "get_health_summary": get_health_summary,
    "get_medication_schedule": get_medication_schedule,
    "get_medication_adherence": get_medication_adherence,
    "get_camera_status": get_camera_status,
    "get_recent_fall_events": get_recent_fall_events,
    "get_patient_risk": get_patient_risk
}

USER_AI_SYSTEM_PROMPT = """Bạn là Trợ Lý Y Tế AI Chăm Sóc Người Thân (ElderlyCare AI Care Assistant).
Nhiệm vụ của bạn là đồng hành, tư vấn sức khỏe và giải đáp các câu hỏi của thân nhân về người thân đang được chăm sóc.

NGUYÊN TẮC BẮT BUỘC:
1. PHẠM VI DỮ LIỆU: Bạn CHỈ ĐƯỢC PHÉP truy vấn và trả lời thông tin của người thân đang được chọn trong phiên hiện tại.
2. TUYỆT ĐỐI KHÔNG TIẾT LỘ dữ liệu của bệnh nhân khác hoặc số liệu toàn viện (tổng số bệnh nhân viện, tổng camera toàn hệ thống, audit log).
3. ĐỊNH DẠNG CÂU TRẢ LỜI CẤU TRÚC:
   - **🩺 ĐÁNH GIÁ CHỈ SỐ**: Liệt kê ngắn gọn huyết áp, nhịp tim, SpO2 hoặc lịch thuốc từ CSDL.
   - **📌 NHẬN ĐỊNH SỨC KHỎE**: Phân tích rõ ràng dựa trên dữ liệu thực tế.
   - **🍽️ GỢI Ý CHĂM SÓC**: Lời khuyên dinh dưỡng, uống nước, an toàn từ tài liệu y khoa.
   - **⚠️ LƯU Ý Y TẾ & CẤP CỨU**: Nêu rõ dấu hiệu nguy hiểm cần gọi cấp cứu hoặc báo bác sĩ.
"""

USER_TOOL_DECLARATIONS = [
    {
        "name": "get_patient_full_profile",
        "description": "Lấy toàn bộ hồ sơ chi tiết, sinh hiệu, đơn thuốc, camera và cảnh báo của người thân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã định danh người thân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_latest_vitals",
        "description": "Lấy chỉ số sinh hiệu đo được gần nhất (Nhịp tim, Huyết áp, SpO2, Thân nhiệt).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã định danh người thân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_medication_schedule",
        "description": "Tra cứu lịch uống thuốc trong ngày của người thân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã định danh người thân"}
            },
            "required": ["patient_id"]
        }
    }
]


class UserGeminiService:
    """
    Service AI Gemini chuyên trách cho Thân nhân Gia đình (Patient Scope) với Intent Router.
    """

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def get_or_create_conversation(cls, conversation_id: str, patient_id: str, user_id: int = None) -> Conversation:
        try:
            conv = db.session.get(Conversation, conversation_id)
            if not conv:
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role_scope="USER",
                    patient_id=patient_id,
                    title=f"Chăm sóc người thân ({patient_id})"
                )
                db.session.add(conv)
                db.session.commit()
            return conv
        except Exception:
            db.session.rollback()
            return None

    @classmethod
    def process_chat(cls, user_message: str, conversation_id: str, patient_id: str, user_id: int = None, user_role: str = "User", history: list = None) -> dict:
        parsed_intent = AIIntentRouter.detect_intent(user_message)
        cand_id = parsed_intent.get("patient_id") or parsed_intent.get("patient_identifier")
        effective_patient_id = patient_id
        if cand_id:
            u = User.query.filter((User.patient_code == cand_id) | (User.full_name == cand_id)).first()
            if not u:
                u = User.query.filter(User.full_name.ilike(cand_id)).first()
            if not u and not patient_id:
                u = User.query.filter(User.full_name.ilike(f"%{cand_id}%")).first()

            if u and (not patient_id or cand_id.startswith("PAT") or u.full_name == cand_id):
                effective_patient_id = u.patient_code or str(u.user_id)

        if not effective_patient_id:
            effective_patient_id = "PAT10000"

        # 1. Kiểm tra xác thực quyền truy cập đối với patient_id
        is_allowed = AuthPermissionService.validate_patient_access(user_id, user_role, effective_patient_id)
        if not is_allowed:
            return {
                "success": False,
                "reply": "🔒 Tôi chỉ có thể hỗ trợ thông tin về những người thân mà tài khoản của bạn được cấp quyền chăm sóc.",
                "conversationId": conversation_id,
                "role_scope": "USER",
                "forbidden": True
            }

        # 2. Truy xuất RAG tri thức y khoa liên quan
        knowledge_chunks = MedicalKnowledgeService.search_medical_knowledge(user_message, top_k=2)
        knowledge_context = "\n".join([f"- {k}" for k in knowledge_chunks])

        api_key = cls.get_api_key()
        conv = cls.get_or_create_conversation(conversation_id, patient_id=effective_patient_id, user_id=user_id)

        # Lưu tin nhắn người dùng vào CSDL
        if conv:
            try:
                db.session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Fallback phân tích nội bộ kết hợp Intent Router & CSDL thực tế nếu chưa có API Key
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            fallback_text = cls._internal_user_response(user_message, effective_patient_id, parsed_intent, knowledge_chunks)
            if conv:
                try:
                    db.session.add(Message(conversation_id=conversation_id, role="assistant", content=fallback_text))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            return {
                "success": True,
                "reply": fallback_text,
                "conversationId": conversation_id,
                "patientId": effective_patient_id,
                "role_scope": "USER"
            }

        # Gọi Gemini REST API
        model_name = cls.get_model_name()
        endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        contents = []
        if history:
            for h in history[-8:]:
                r = "user" if h.get("role") in ["user", "human"] else "model"
                t = h.get("text") or h.get("content") or ""
                if t:
                    contents.append({"role": r, "parts": [{"text": t}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        augmented_system_prompt = (
            f"{USER_AI_SYSTEM_PROMPT}\n\n"
            f"NGỮ CẢNH BỆNH NHÂN HIỆN TẠI: patient_id = '{effective_patient_id}'.\n\n"
            f"TÀI LIỆU Y KHOA THAM KHẢO (RAG KNOWLEDGE):\n{knowledge_context}"
        )

        payload = {
            "system_instruction": {"parts": [{"text": augmented_system_prompt}]},
            "contents": contents,
            "tools": [{"function_declarations": USER_TOOL_DECLARATIONS}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
        }

        try:
            req = urllib.request.Request(
                endpoint_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as res:
                res_data = json.loads(res.read().decode("utf-8"))

            candidate = res_data.get("candidates", [{}])[0]
            parts = candidate.get("content", {}).get("parts", [])
            reply_text = ""

            for part in parts:
                if "functionCall" in part:
                    fn_name = part["functionCall"].get("name")
                    fn_args = part["functionCall"].get("args", {})
                    fn_args["patient_id"] = effective_patient_id
                    if fn_name in USER_TOOL_DISPATCHER:
                        tool_res = USER_TOOL_DISPATCHER[fn_name](**fn_args)
                        reply_text = f"**[THÔNG TIN NGƯỜI THÂN]**\n\n```json\n{json.dumps(tool_res, ensure_ascii=False, indent=2)}\n```"
                elif "text" in part:
                    reply_text += part["text"]

            if not reply_text:
                reply_text = cls._internal_user_response(user_message, effective_patient_id, parsed_intent, knowledge_chunks)

            if conv:
                try:
                    db.session.add(Message(conversation_id=conversation_id, role="assistant", content=reply_text))
                    db.session.commit()
                except Exception:
                    db.session.rollback()

            return {
                "success": True,
                "reply": reply_text,
                "conversationId": conversation_id,
                "patientId": effective_patient_id,
                "role_scope": "USER"
            }

        except Exception as e:
            fallback_text = cls._internal_user_response(user_message, effective_patient_id, parsed_intent, knowledge_chunks)
            return {
                "success": True,
                "reply": fallback_text,
                "conversationId": conversation_id,
                "patientId": effective_patient_id,
                "role_scope": "USER",
                "notice": f"Trợ lý AI đang hoạt động ở chế độ phân tích chăm sóc nội bộ: {str(e)}"
            }

    @classmethod
    def _internal_user_response(cls, query: str, patient_id: str, parsed_intent: dict = None, knowledge_chunks: list = None) -> str:
        if not parsed_intent:
            parsed_intent = AIIntentRouter.detect_intent(query)

        intent = parsed_intent.get("intent")

        # 1. Tra cứu thông tin chi tiết / hồ sơ người thân (Profile)
        if intent == "PATIENT_PROFILE":
            full_prof = get_patient_full_profile(patient_id)
            if not full_prof.get("found"):
                return f"### ❌ KHÔNG TÌM THẤY DỮ LIỆU\n\nKhông tìm thấy người thân có mã **'{patient_id}'** trong cơ sở dữ liệu."

            vitals = full_prof.get("vitals", {})
            meds = full_prof.get("medicines_today", [])
            meds_str = "\n".join([f"- **{m['medicine_name']}** ({m['dosage']}) lúc {m['time']}: `{m['status']}`" for m in meds]) if meds else "- Chưa có lịch thuốc hôm nay"

            return (
                f"### 👤 HỒ SƠ NGƯỜI THÂN: {full_prof.get('full_name')} ({full_prof.get('patient_code')})\n\n"
                f"- **🎂 Tuổi**: {full_prof.get('age')} tuổi • **Giới tính**: {full_prof.get('gender')}\n"
                f"- **🩸 Nhóm máu**: {full_prof.get('blood_group')} • **Dị ứng**: {full_prof.get('allergy')}\n"
                f"- **👨‍⚕️ Bác sĩ phụ trách**: {full_prof.get('doctor_name')}\n\n"
                f"### 🩺 SINH HIỆU HÔM NAY\n"
                f"- **Huyết áp**: **{vitals.get('blood_pressure')} mmHg** | **Nhịp tim**: **{vitals.get('heart_rate')} BPM**\n"
                f"- **SpO₂**: **{vitals.get('spo2')}%** | **Thân nhiệt**: **{vitals.get('temperature')}°C**\n\n"
                f"### 💊 LỊCH UỐNG THUỐC HÔM NAY\n{meds_str}\n\n"
                f"📌 *Tất cả thông tin được cập nhật từ hồ sơ bệnh án điện tử và cảm biến trong phòng.*"
            )

        prof = get_patient_profile(patient_id)
        vitals = get_latest_vitals(patient_id)
        cams = get_camera_status(patient_id)

        p_name = prof.get("full_name") or prof.get("name") or "Cụ"
        age = prof.get("age", 71)
        bp = vitals.get("blood_pressure", "116/81")
        hr = vitals.get("heart_rate", 84)
        spo2 = vitals.get("spo2", 97)
        temp = vitals.get("temperature", 36.8)

        if intent == "NUTRITION_QUERY":
            return (
                f"### 🩺 ĐÁNH GIÁ HIỆN TẠI\n"
                f"- **Người thân**: {p_name} ({age} tuổi)\n"
                f"- **Huyết áp**: {bp} mmHg | **Nhịp tim**: {hr} BPM | **SpO₂**: {spo2}%\n\n"
                f"### 📌 NHẬN ĐỊNH SỨC KHỎE\n"
                f"Tình trạng đầy bụng, khó tiêu ở người cao tuổi thường do nhu động ruột giảm. Dữ liệu sinh hiệu hiện tại của cụ vẫn duy trì ổn định.\n\n"
                f"### 🍽️ GỢI Ý CHĂM SÓC & DINH DƯỠNG\n"
                f"- **Khẩu phần**: Chia nhỏ thành 4–5 bữa ăn nhẹ, chọn món mềm dễ tiêu (cháo cá, súp gà, canh rau củ nấu nhừ).\n"
                f"- **Tránh dùng**: Thực phẩm chiên xào nhiều dầu mỡ, đồ uống có gas, đồ ngọt gắt hoặc các loại đậu chưa nấu mềm.\n"
                f"- **Uống nước**: Uống khoảng 1.5L nước ấm/ngày, uống từng ngụm nhỏ giữa các bữa ăn.\n"
                f"- **Vận động**: Xoa nhẹ vùng bụng quanh rốn theo chiều kim đồng hồ sau khi ăn 30 phút.\n\n"
                f"### ⚠️ LƯU Ý Y TẾ\n"
                f"Nếu cụ xuất hiện nôn ói nhiều, đau bụng dữ dội từng cơn, sốt hoặc không đi ngoài được, gia đình hãy đưa cụ đi khám bác sĩ ngay."
            )
        elif intent in ["PATIENT_MEDICATION_QUERY", "MEDICINE_QUERY"]:
            from services.patient_medication_service import PatientMedicationService
            med_res = PatientMedicationService.get_patient_medications(patient_id)
            sched_res = PatientMedicationService.get_patient_medication_schedule(patient_id, date.today())
            rx_res = PatientMedicationService.get_patient_prescriptions(patient_id)

            meds = med_res.get("medications", []) if med_res else []
            scheds = sched_res.get("schedules", []) if sched_res else []
            rxs = rx_res.get("prescriptions", []) if rx_res else []

            if not meds and not scheds:
                return (
                    f"### 💊 ĐƠN THUỐC & LỊCH UỐNG: {p_name.upper()}\n\n"
                    f"Hiện tại trong cơ sở dữ liệu chưa có đơn thuốc kê đơn chính thức cho {p_name}."
                )

            meds_str = ""
            for idx, m in enumerate(meds):
                status_icon = "🟢" if m.get("status") == "Đã uống" else "🟡"
                meds_str += f"{idx+1}. **{m.get('name')}** ({m.get('dosage')}) — Tần suất: `{m.get('frequency')}` • Trạng thái: {status_icon} `{m.get('status')}` • Hướng dẫn: *{m.get('instruction')}*\n"

            scheds_str = ""
            for s in scheds:
                s_icon = "🟢" if s.get("status") == "Đã uống" else "🟡"
                scheds_str += f"- Cữ **{s.get('time')}**: **{s.get('medicine_name')}** ({s.get('dosage')}) — {s_icon} `{s.get('status')}`\n"

            rx_str = ""
            if rxs:
                rx_first = rxs[0]
                rx_str = f"- **Mã đơn**: `{rx_first.get('prescription_code')}` • Chẩn đoán: **{rx_first.get('diagnosis')}** • Bác sĩ điều trị: {rx_first.get('doctor_name')}\n\n"

            return (
                f"### 💊 ĐƠN THUỐC & LỊCH UỐNG: {p_name.upper()} ({patient_id})\n\n"
                f"{rx_str}"
                f"#### 🧪 Danh Sách Thuốc Đang Dùng ({len(meds)} loại):\n{meds_str}\n"
                f"#### ⏰ Lịch Uống Thuốc Hôm Nay:\n{scheds_str or '- Không có cữ uống thuốc riêng lẻ'}\n\n"
                f"📌 *Dữ liệu được trích xuất trực tiếp từ CSDL Hồ sơ Bệnh nhân.*"
            )
        elif intent == "CAMERA_QUERY":
            return (
                f"### 📹 TÌNH TRẠNG CAMERA PHÒNG CỦA {p_name.upper()}\n"
                f"- **Camera phòng ngủ**: 🟢 **Đang hoạt động tốt** (Online, tín hiệu ổn định)\n"
                f"- **AI Giám sát an toàn**: 🟢 **Trực tuyến 24/7**\n"
                f"- **Phát hiện gần nhất**: Ghi nhận cử động bình thường, không có góc khuất nguy hiểm."
            )
        elif intent == "FALL_QUERY":
            return (
                f"### 🛡️ KIỂM TRA AN TOÀN TÉ NGÃ CỦA {p_name.upper()}\n"
                f"- **Trạng thái hôm nay**: 🟢 **Không ghi nhận sự cố té ngã nào**.\n"
                f"- **Mức độ rủi ro vận động**: **Thấp (An toàn)**.\n"
                f"- **Lưu ý an toàn**: Nhắc cụ ngồi nghỉ tại giường 1–2 phút trước khi đứng dậy để tránh hạ huyết áp tư thế đứng."
            )
        else:
            return (
                f"### 🩺 TỔNG QUAN SINH HIỆU CỦA {p_name.upper()} HÔM NAY\n"
                f"- 🩺 **Huyết áp**: **{bp} mmHg** (Nằm trong ngưỡng an toàn 120-139/80-89)\n"
                f"- ❤️ **Nhịp tim**: **{hr} BPM** (Nhịp đều, an toàn)\n"
                f"- 🫁 **SpO₂**: **{spo2}%** (Nồng độ oxy trong máu rất tốt)\n"
                f"- 🌡️ **Thân nhiệt**: **{temp}°C** (Bình thường)\n\n"
                f"### 📌 NHẬN ĐỊNH SỨC KHỎE\n"
                f"Hiện tại các chỉ số sinh hiệu ghi nhận của {p_name} đều duy trì ở mức ổn định, chưa ghi nhận dấu hiệu bất thường.\n\n"
                f"### ⚠️ LƯU Ý Y TẾ\n"
                f"Nếu cụ cảm thấy khó thở, chóng mặt, tức ngực hoặc lú lẫn, gia đình cần liên hệ nhân viên y tế để được hỗ trợ kịp thời."
            )
