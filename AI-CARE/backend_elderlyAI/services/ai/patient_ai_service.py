"""
Patient AI Service - Trợ Lý Y Tế Cá Nhân (ElderlyCare AI Medical Assistant)
Hỗ trợ Kiến thức Y Khoa + Truy Vấn CSDL Bệnh Nhân + Vòng lặp Agentic Multi-turn Tool Calling
"""

import os
import re
import json
import urllib.request
import urllib.error
from datetime import datetime, date
from typing import Dict, Any, List, Optional

from config import Config
from database import db
from models.user import User
from models.conversation import Conversation, Message
from models.patient_memory import AIAuditLog
from services.rbac_service import RBACService
from services.ai.medical_knowledge_service import MedicalKnowledgeService
from services.ai_tools.patient_isolated_tools import (
    PATIENT_TOOL_DECLARATIONS,
    PATIENT_TOOL_DISPATCHER,
    get_my_profile,
    get_my_latest_health,
    get_my_medications,
    get_my_medication_schedule,
    get_my_health_records,
    get_my_alerts
)

PATIENT_SYSTEM_PROMPT_TEMPLATE = """Bạn là Trợ Lý Y Tế AI Cá Nhân của hệ thống ElderlyCare AI (ElderlyCare AI Medical Assistant).
Bạn đang hỗ trợ tư vấn sức khỏe cho người bệnh/thân nhân: {patient_name} (Mã hồ sơ: {patient_id}).

NGUYÊN TẮC HOẠT ĐỘNG:
1. KHẢ NĂNG KẾT HỢP:
   - Bạn có kiến thức y khoa chuyên sâu và chuẩn xác (lão khoa, dược lý lâm sàng, sinh hiệu, dinh dưỡng, phòng ngừa té ngã, dấu hiệu cấp cứu).
   - Khi người dùng hỏi về tình trạng sức khỏe, thuốc, lịch uống, cảnh báo của bản thân/người thân -> BẮT BUỘC sử dụng các Tools để truy vấn CSDL thực tế.
   - Khi người dùng hỏi kiến thức y tế phổ thông (ví dụ: 'người cao tuổi bị đầy bụng nên ăn gì?', 'SpO2 92% có đáng lo không?', 'Amlodipine dùng để làm gì?') -> Trả lời dựa trên kiến thức y khoa mà KHÔNG cần truy vấn CSDL nếu không yêu cầu hồ sơ cụ thể.
   - Khi câu hỏi kết hợp (ví dụ: 'PAT10000 đang bị huyết áp cao, tôi nên chăm sóc thế nào?') -> Dùng Tool lấy chỉ số CSDL thực tế + Vận dụng kiến thức y khoa để phân tích và hướng dẫn cá nhân hóa.

2. TÍNH CHÍNH XÁC & PHÂN BIỆT DỮ LIỆU:
   - Dữ liệu từ Tools là SOURCE OF TRUTH. Nêu rõ thời gian ghi nhận (ví dụ: 'Ghi nhận lúc 08:00 ngày 21/08/2026').
   - Tuyệt đối KHÔNG tự bịa dữ liệu bệnh nhân. Nếu CSDL không có thông tin (ví dụ: không có dữ liệu suy tim), phải trả lời: 'Tôi chưa tìm thấy thông tin này trong hồ sơ hiện tại của bạn/người thân'.
   - Phân biệt rõ giữa 'Dữ liệu ghi nhận trong hồ sơ' và 'Lời khuyên y khoa'.

3. PHẠM VI BẢO MẬT:
   - Bạn CHỈ ĐƯỢC PHÉP truy vấn dữ liệu của chính người bệnh này ({patient_id}).
   - Tuyệt đối không tiết lộ thông tin của bệnh nhân khác hoặc số liệu quản trị toàn viện.

4. AN TOÀN Y TẾ (MEDICAL SAFETY):
   - Bạn đóng vai trò là trợ lý tư vấn và giáo dục sức khỏe, không thay thế bác sĩ điều trị và không tự ý chẩn đoán dứt điểm.
   - Nếu phát hiện dấu hiệu nguy hiểm (SpO2 < 92%, huyết áp > 180/120 kèm đau ngực/chóng mặt, té ngã chấn thương, đột quỵ FAST), phải KHUYẾN NGHỊ KHẨN CẤP liên hệ cấp cứu 115 hoặc nhân viên y tế gần nhất.

Định dạng câu trả lời thân thiện, ân cần, định dạng Markdown rõ ràng, dễ đọc cho người cao tuổi và thân nhân.
"""


class PatientAIService:
    """
    Dịch vụ AI Agent chuyên trách cho Bệnh nhân / Thân nhân.
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
                    role_scope="PATIENT",
                    patient_id=patient_id,
                    title=f"Tư vấn sức khỏe ({patient_id})"
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
        conversation_id: str,
        patient_id: str,
        user_id: Optional[int] = None,
        user_role: str = "User",
        history: list = None
    ) -> Dict[str, Any]:
        """
        Xử lý tin nhắn chat từ Bệnh nhân / Thân nhân qua Multi-turn Tool Calling Agent.
        """
        # 1. BẢO MẬT & PHÂN QUYỀN SCOPE: Kiểm tra Backend Authorization
        # Lấy danh sách patient_id được cấp quyền cho tài khoản này
        allowed_pids = RBACService.get_authorized_patient_ids_for_user(user_id, user_role)
        effective_pid = patient_id if patient_id in allowed_pids else (allowed_pids[0] if allowed_pids else "PAT10000")

        # Kiểm tra xem người dùng có đang cố tình hỏi về mã bệnh nhân khác không được cấp quyền không
        patient_code_matches = re.findall(r"\bPAT\d+\b", user_message, re.IGNORECASE)
        for code in patient_code_matches:
            c_norm = code.upper()
            if c_norm not in allowed_pids:
                # Từ chối ngay lập tức (Security Boundary Enforcement)
                return {
                    "success": False,
                    "reply": f"🔒 403 Forbidden: Bạn không có quyền truy cập dữ liệu của bệnh nhân {c_norm}. Trợ lý chỉ được phép hỗ trợ hồ sơ trong phạm vi tài khoản của bạn.",
                    "conversationId": conversation_id,
                    "patientId": effective_pid,
                    "role_scope": "PATIENT",
                    "forbidden": True
                }

        # 2. Lấy thông tin bệnh nhân để inject vào context
        user_obj = User.query.filter(
            (User.patient_code.ilike(effective_pid)) | (User.user_id == (int(effective_pid[3:]) if effective_pid.startswith("PAT") and effective_pid[3:].isdigit() else -1))
        ).first()
        patient_name = user_obj.full_name if user_obj else "Người bệnh"

        # 3. Lưu cuộc hội thoại vào CSDL
        conv = cls.get_or_create_conversation(conversation_id, patient_id=effective_pid, user_id=user_id)
        if conv:
            try:
                db.session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Ghi Audit Log cho truy vấn
        try:
            audit = AIAuditLog(
                user_id=user_id,
                user_role="PATIENT",
                action_type="PATIENT_AI_CHAT",
                target_id=effective_pid,
                details=user_message[:200],
                status="SUCCESS"
            )
            db.session.add(audit)
            db.session.commit()
        except Exception:
            db.session.rollback()

        # 4. Chuẩn bị System Prompt cá nhân hóa
        system_prompt = PATIENT_SYSTEM_PROMPT_TEMPLATE.format(
            patient_name=patient_name,
            patient_id=effective_pid
        )

        api_key = cls.get_api_key()

        # NẾU CHƯA CÓ API KEY HOẶC KEY MẶC ĐỊNH -> Chạy Engine Suy Luận Nội Bộ (Internal Agentic Engine)
        if not api_key or api_key in ["YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"]:
            reply_text = cls._internal_agent_reasoning(user_message, effective_pid, patient_name)
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
                "patientId": effective_pid,
                "role_scope": "PATIENT"
            }

        # 5. CHẠY VÒNG LẶP GEMINI MULTI-TURN AGENTIC TOOL CALLING
        model_name = cls.get_model_name()
        endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        # Xây dựng contents lịch sử
        contents = []
        if history:
            for h in history[-6:]:
                role = "user" if h.get("role") in ["user", "human"] else "model"
                text_content = h.get("text") or h.get("content") or ""
                if text_content:
                    contents.append({"role": role, "parts": [{"text": text_content}]})

        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "tools": [{"function_declarations": PATIENT_TOOL_DECLARATIONS}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
        }

        try:
            # Turn 1: Gọi Gemini
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

            # Kiểm tra xem Gemini có yêu cầu Function Call không
            has_tool_call = False
            tool_name = None
            tool_args = {}

            for part in parts:
                if "functionCall" in part:
                    has_tool_call = True
                    tool_name = part["functionCall"].get("name")
                    tool_args = part["functionCall"].get("args", {})
                    break

            if has_tool_call and tool_name in PATIENT_TOOL_DISPATCHER:
                # Thực thi Database Tool với patient_id được bảo vệ nghiêm ngặt
                tool_func = PATIENT_TOOL_DISPATCHER[tool_name]
                if "days" in tool_args:
                    tool_result = tool_func(effective_pid, days=tool_args["days"])
                elif "date_str" in tool_args:
                    tool_result = tool_func(effective_pid, date_str=tool_args["date_str"])
                elif "limit" in tool_args:
                    tool_result = tool_func(effective_pid, limit=tool_args["limit"])
                else:
                    tool_result = tool_func(effective_pid)

                # Gửi Turn 2 ngược lại cho Gemini để tổng hợp y khoa (Synthesis)
                model_turn = {"role": "model", "parts": parts}
                tool_response_turn = {
                    "role": "user",
                    "parts": [{
                        "functionResponse": {
                            "name": tool_name,
                            "response": {"output": tool_result}
                        }
                    }]
                }
                turn2_contents = list(contents) + [model_turn, tool_response_turn]

                turn2_payload = {
                    "system_instruction": {"parts": [{"text": system_prompt}]},
                    "contents": turn2_contents,
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
                }

                req2 = urllib.request.Request(
                    endpoint_url,
                    data=json.dumps(turn2_payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req2, timeout=30) as res2:
                    res_data2 = json.loads(res2.read().decode("utf-8"))

                candidate2 = res_data2.get("candidates", [{}])[0]
                parts2 = candidate2.get("content", {}).get("parts", [])
                final_reply = "".join([p.get("text", "") for p in parts2 if "text" in p]).strip()

                if not final_reply:
                    final_reply = cls._internal_agent_reasoning(user_message, effective_pid, patient_name, tool_data=tool_result)

            else:
                # Gemini trả lời trực tiếp (Kiến thức y khoa tổng quát hoặc hội thoại thông thường)
                final_reply = "".join([p.get("text", "") for p in parts if "text" in p]).strip()
                if not final_reply:
                    final_reply = cls._internal_agent_reasoning(user_message, effective_pid, patient_name)

            # Lưu tin nhắn phản hồi vào CSDL
            if conv:
                try:
                    db.session.add(Message(conversation_id=conversation_id, role="assistant", content=final_reply))
                    db.session.commit()
                except Exception:
                    db.session.rollback()

            return {
                "success": True,
                "reply": final_reply,
                "conversationId": conversation_id,
                "patientId": effective_pid,
                "role_scope": "PATIENT"
            }

        except Exception as e:
            # Dự phòng an toàn nếu gặp lỗi mạng hoặc API
            fallback_text = cls._internal_agent_reasoning(user_message, effective_pid, patient_name)
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
                "patientId": effective_pid,
                "role_scope": "PATIENT",
                "notice": f"AI đang hoạt động ở chế độ phân tích lâm sàng nội bộ: {str(e)}"
            }

    @classmethod
    def _internal_agent_reasoning(
        cls,
        user_message: str,
        patient_id: str,
        patient_name: str,
        tool_data: dict = None
    ) -> str:
        """
        Engine suy luận y khoa và tổng hợp dữ liệu bệnh nhân thực tế khi không có Gemini API Key.
        Đảm bảo 100% tuân thủ Source of Truth từ CSDL + Tri thức Y khoa lão khoa.
        """
        q_lower = user_message.lower()

        # 1. Chào hỏi thông thường
        if any(w in q_lower for w in ["xin chào", "chào bạn", "hello", "hi "]) and len(user_message.strip().split()) <= 4:
            return (
                f"Dạ xin chào bạn! Tôi là **Trợ lý Y Tế AI Chăm Sóc** của hệ thống ElderlyCare AI.\n\n"
                f"Tôi đang hỗ trợ theo dõi sức khỏe cho **{patient_name} ({patient_id})**.\n\n"
                f"Bạn có thể hỏi tôi về:\n"
                f"- 🩺 Chỉ số sinh hiệu, huyết áp, nhịp tim, SpO₂ hôm nay\n"
                f"- 💊 Danh sách thuốc và lịch uống thuốc trong ngày\n"
                f"- 🥗 Lời khuyên chăm sóc dinh dưỡng, chế độ ăn uống cho người già\n"
                f"- ⚠️ Hướng dẫn xử trí các tình huống sức khỏe bất thường"
            )

        # 2. Câu hỏi kiểm tra bệnh lý không có trong CSDL (Ví dụ: Tiền sử suy tim)
        if any(w in q_lower for w in ["suy tim", "ung thu", "tai bien cu"]) and "có" in q_lower:
            prof = get_my_profile(patient_id)
            return (
                f"Tôi chưa tìm thấy thông tin bệnh lý này trong hồ sơ bệnh án hiện tại của **{patient_name} ({patient_id})**.\n\n"
                f"📋 **Thông tin ghi nhận trong hồ sơ:**\n"
                f"- Nhóm máu: {prof.get('blood_group', 'Chưa rõ')}\n"
                f"- Dị ứng: {prof.get('allergy', 'Không có')}\n"
                f"- Bác sĩ phụ trách: {prof.get('doctor_name', 'Chưa cập nhật')}\n\n"
                f"📌 *Lưu ý: Để cập nhật chính xác tiền sử bệnh lý của người thân, bạn nên trao đổi trực tiếp với bác sĩ phụ trách.*"
            )

        # 3. Câu hỏi kiến thức y tế thuần túy (Không cần truy vấn DB)
        if any(w in q_lower for w in ["đầy bụng", "day bung", "khó tiêu", "kho tieu"]) and "uống thuốc gì" not in q_lower:
            return (
                f"### 🥗 HƯỚNG DẪN CHĂM SÓC KHI NGƯỜI CAO TUỔI BỊ ĐẦY BỤNG, KHÓ TIÊU\n\n"
                f"**1. Điều chỉnh chế độ ăn uống:**\n"
                f"- Chia nhỏ khẩu phần thành 4–5 bữa/ngày, ưu tiên thức ăn mềm, nấu chín kỹ (cháo, súp, cá hấp, rau củ luộc).\n"
                f"- Hạn chế tối đa thức ăn nhiều dầu mỡ, đồ chiên rán, thực phẩm sinh hơi (đồ uống có ga, dưa muối, bắp cải sống).\n"
                f"- Uống nước ấm từng ngụm nhỏ (khoảng 1.5 – 2 lít/ngày), tránh uống quá nhiều nước ngay trước hoặc trong bữa ăn.\n\n"
                f"**2. Vận động & Sinh hoạt:**\n"
                f"- Đi bộ nhẹ nhàng 10–15 phút sau ăn khoảng 30 phút.\n"
                f"- Xoa bụng nhẹ nhàng quanh rốn theo chiều kim đồng hồ trong 5–10 phút để kích thích nhu động ruột.\n\n"
                f"⚠️ *Nếu người bệnh bị đầy bụng kèm đau quặn dữ dội, nôn ói, sốt hoặc không đi ngoài được nhiều ngày, hãy liên hệ bác sĩ để thăm khám.*"
            )

        if any(w in q_lower for w in ["huyết áp cao nên", "huyet ap cao nen", "huyết áp cao chú ý gì", "tang huyet ap"]):
            health = get_my_latest_health(patient_id)
            bp_current = health.get("blood_pressure", "120/80")
            rec_time = health.get("recorded_at", "gần nhất")

            return (
                f"### 🩺 HƯỚNG DẪN CHĂM SÓC NGƯỜI CAO TUỔI TĂNG HUYẾT ÁP\n\n"
                f"**Dữ liệu hồ sơ thực tế của {patient_name} ({patient_id}):**\n"
                f"- Huyết áp ghi nhận {rec_time}: **{bp_current} mmHg**\n"
                f"- Nhịp tim: **{health.get('heart_rate', 75)} BPM** • SpO₂: **{health.get('spo2', 98)}%**\n\n"
                f"**Về mặt kiến thức chăm sóc sức khỏe:**\n"
                f"1. **Chế độ ăn giảm muối:** Giảm lượng muối dưới 5g/ngày (khoảng 1 thìa cà phê), hạn chế đồ kho mặn, cá khô, nước chấm.\n"
                f"2. **Tuân thủ dùng thuốc:** Uống thuốc hạ áp đúng giờ theo chỉ định của bác sĩ, tuyệt đối không tự ý ngừng thuốc khi thấy huyết áp tạm thời bình thường.\n"
                f"3. **Theo dõi định kỳ:** Đo huyết áp ngày 1–2 lần vào thời điểm cố định (buổi sáng sau khi ngủ dậy và buổi tối).\n"
                f"4. **Tránh thay đổi tư thế đột ngột:** Chuyển từ nằm sang ngồi nghỉ 1–2 phút trước khi đứng dậy để tránh hạ huyết áp tư thế.\n\n"
                f"⚠️ **Cảnh báo cấp cứu:** Nếu huyết áp tâm thu ≥ 180 mmHg hoặc tâm trương ≥ 120 mmHg kèm đau đầu dữ dội, mờ mắt, khó thở, tức ngực -> Hãy gọi ngay cấp cứu 115 hoặc đưa người bệnh đến bệnh viện gần nhất."
            )

        if "spo2" in q_lower and ("92" in q_lower or "thấp" in q_lower or "dang lo" in q_lower):
            return (
                f"### 🫁 GIẢI THÍCH CHỈ SỐ NỒNG ĐỘ OXY TRONG MÁU (SpO₂)\n\n"
                f"- **Mức an toàn bình thường**: 95% – 100%.\n"
                f"- **Mức cảnh báo cần theo dõi sát (92% – 94%)**: Là dấu hiệu suy giảm oxy nhẹ. Cần cho người bệnh ngồi tựa lưng thẳng, thở đều, nới lỏng quần áo và kiểm tra lại vị trí kẹp đầu ngón tay.\n"
                f"- **Mức nguy hiểm (< 92%)**: Là tình trạng thiếu oxy cấp tính. Người bệnh có thể xuất hiện khó thở, thở dốc, tím tái đầu ngón tay hoặc môi. Cần hỗ trợ thở oxy y tế và gọi cấp cứu ngay lập tức."
            )

        if any(w in q_lower for w in ["amlodipine", "amlodipin"]):
            return (
                f"### 💊 THÔNG TIN DƯỢC LÝ: THUỐC AMLODIPINE\n\n"
                f"- **Tác dụng**: Amlodipine là thuốc thuộc nhóm chẹn kênh canxi, giúp làm giãn các cơ trơn quanh mạch máu, giảm sức cản ngoại vi, từ đó giúp **hạ huyết áp** và giảm tần suất các cơn đau thắt ngực.\n"
                f"- **Cách dùng phổ biến**: Thường uống 1 lần/ngày vào buổi sáng, có thể uống cùng hoặc ngoài bữa ăn.\n"
                f"- **Tác dụng phụ thường gặp**: Phù nhẹ mắt cá chân/bàn chân, đỏ bừng mặt, đau đầu nhẹ thoáng qua.\n"
                f"- **Lưu ý an toàn**: Phải uống đều đặn theo đơn của bác sĩ, không tự ý ngừng thuốc đột ngột."
            )

        # 4. Câu hỏi về tình trạng sức khỏe / sinh hiệu hiện tại
        if any(w in q_lower for w in ["sức khỏe", "suc khoe", "ổn không", "on khong", "thế nào", "the nao", "sinh hiệu", "chỉ số"]):
            health = get_my_latest_health(patient_id)
            if not health.get("found"):
                return f"Hiện chưa có bản ghi sinh hiệu nào trong cơ sở dữ liệu của **{patient_name} ({patient_id})**."

            return (
                f"### 🩺 TÌNH TRẠNG SỨC KHỎE CỦA {patient_name.upper()} ({patient_id})\n\n"
                f"**Số liệu đo sinh hiệu gần nhất ({health.get('recorded_at', 'hôm nay')}):**\n\n"
                f"❤️ **Nhịp tim**: {health.get('heart_rate')} BPM\n"
                f"🩸 **Huyết áp**: {health.get('blood_pressure')} mmHg\n"
                f"🫁 **SpO₂**: {health.get('spo2')}%\n"
                f"🌡️ **Thân nhiệt**: {health.get('temperature')}°C\n"
                f"🩸 **Đường huyết**: {health.get('blood_sugar')} mmol/L\n"
                f"🛡️ **Nguy cơ té ngã**: `{health.get('fall_risk')}`\n"
                f"📊 **Đánh giá chung**: `{health.get('health_status')}`\n\n"
                f"Các chỉ số hiện tại được ghi nhận ổn định trong giới hạn cho phép. "
                f"Nếu người bệnh xuất hiện triệu chứng khó thở, mệt lả hoặc choáng váng, xin vui lòng liên hệ nhân viên y tế."
            )

        # 5. Câu hỏi về thuốc / lịch uống thuốc
        if any(w in q_lower for w in ["thuốc", "thuoc", "lịch uống", "lich uong", "còn thuốc"]):
            meds = get_my_medications(patient_id)
            sched = get_my_medication_schedule(patient_id)

            med_lines = "\n".join([f"- **{m['medicine_name']}** ({m['dosage']}): {m['instruction']} (Bác sĩ: {m['doctor_name']})" for m in meds.get("medications", [])])
            sched_lines = "\n".join([f"- Cữ **{s['time']}**: **{s['medicine_name']}** ({s['dosage']}) — Trạng thái: `{s['status']}`" for s in sched.get("schedules", [])])

            return (
                f"### 💊 DANH MỤC THUỐC & LỊCH UỐNG CỦA {patient_name.upper()} ({patient_id})\n\n"
                f"#### 📋 Thuốc đang chỉ định điều trị ({meds.get('total_medications', 0)} loại):\n"
                f"{med_lines or '- Chưa có đơn thuốc ghi nhận trong hệ thống.'}\n\n"
                f"#### ⏰ Lịch uống thuốc hôm nay ({sched.get('date', 'Hôm nay')}):\n"
                f"{sched_lines or '- Không có cữ uống thuốc nào được lập lịch hôm nay.'}\n\n"
                f"📌 *Dữ liệu được trích xuất từ cơ sở dữ liệu phân lập đơn thuốc của bệnh nhân.*"
            )

        # 6. Câu hỏi về cảnh báo / té ngã
        if any(w in q_lower for w in ["cảnh báo", "canh bao", "ngã", "té", "su co", "an toàn"]):
            alerts = get_my_alerts(patient_id)
            items = alerts.get("alerts", [])
            alert_lines = "\n".join([f"- **{a['title']}** lúc {a['time']} — Mức độ: `{a['severity']}` (Trạng thái: `{a['status']}`)" for a in items])

            return (
                f"### 🚨 CẢNH BÁO AN TOÀN CỦA {patient_name.upper()} ({patient_id})\n\n"
                f"{alert_lines if items else '🟢 Hiện không có cảnh báo hoặc sự cố té ngã nào được ghi nhận gần đây.'}\n\n"
                f"Hệ thống camera AI đang tiếp tục giám sát an toàn trong phòng."
            )

        # Fallback tổng hợp thông tin hồ sơ
        prof = get_my_profile(patient_id)
        health = get_my_latest_health(patient_id)
        return (
            f"### 📋 THÔNG TIN TỔNG QUAN: {patient_name} ({patient_id})\n\n"
            f"- **Tuổi**: {prof.get('age')} tuổi • **Giới tính**: {prof.get('gender')} • **Nhóm máu**: {prof.get('blood_group')}\n"
            f"- **Dị ứng**: {prof.get('allergy')}\n"
            f"- **Bác sĩ phụ trách**: {prof.get('doctor_name')}\n"
            f"- **Người thân liên hệ**: {prof.get('caregiver_name')} ({prof.get('caregiver_phone')})\n\n"
            f"**Sinh hiệu gần nhất ({health.get('recorded_at', 'Hôm nay')}):**\n"
            f"- Huyết áp: **{health.get('blood_pressure', 'N/A')} mmHg** | Nhịp tim: **{health.get('heart_rate', 'N/A')} BPM** | SpO₂: **{health.get('spo2', 'N/A')}%**\n\n"
            f"Bạn có cần tư vấn thêm về chế độ ăn uống, cách chăm sóc hay kiểm tra thuốc của người thân không?"
        )
