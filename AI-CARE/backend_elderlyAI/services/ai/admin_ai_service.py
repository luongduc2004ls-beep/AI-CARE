"""
Admin AI Service - Trợ Lý Y Tế & Quản Trị Hệ Thống Toàn Viện
ElderlyCare AI Medical & Management Assistant (Admin Scope)
Hỗ trợ Kiến thức Y Khoa + Tìm Kiếm & Phân Tích CSDL Toàn Viện + Vòng lặp Agentic Multi-turn Tool Calling
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
from services.ai_tools.admin_system_tools import (
    ADMIN_TOOL_DECLARATIONS,
    ADMIN_TOOL_DISPATCHER,
    get_patient_profile,
    get_latest_health_record,
    get_patient_health_records,
    get_patient_medications,
    get_patient_prescriptions,
    get_patient_medication_schedule,
    get_patient_alerts,
    get_patient_notifications,
    get_patient_caregiver,
    get_patient_doctor,
    get_patient_camera_status,
    search_patients,
    search_patients_by_name,
    search_patients_by_disease,
    search_patients_by_allergy,
    search_patients_by_medicine,
    search_patients_by_risk_level,
    search_patients_by_fall_risk,
    search_patients_by_health_status,
    get_system_statistics,
    get_system_alerts,
    get_camera_status,
    get_recent_alerts
)

ADMIN_SYSTEM_PROMPT = """Bạn là Trợ Lý Y Tế & Quản Trị Hệ Thống Toàn Viện (ElderlyCare AI Medical & Management Assistant).
Bạn đang hỗ trợ Ban Giám Đốc, Bác Sĩ Trưởng và Điều Dưỡng Quản Lý trong việc giám sát, phân tích lâm sàng và điều hành hệ thống chăm sóc người cao tuổi.

NGUYÊN TẮC HOẠT ĐỘNG:
1. TRUY VẤN CƠ SỞ DỮ LIỆU THỰC TẾ (SOURCE OF TRUTH):
   - Mọi dữ liệu về bệnh nhân (hồ sơ, sinh hiệu, đơn thuốc, lịch uống, cảnh báo, dị ứng, camera, thống kê viện) BẮT BUỘC phải trích xuất từ Database Tools.
   - Khi tìm kiếm bệnh nhân (theo dị ứng, bệnh nền, thuốc, rủi ro té ngã), BẮT BUỘC báo cáo tổng số bản ghi thực tế trong CSDL (total) và danh sách chi tiết (Tên, Mã, Tuổi, Dị ứng/Bệnh án/Sinh hiệu).
   - Tuyệt đối KHÔNG tự bịa dữ liệu hoặc đoán mò. Nếu không có dữ liệu (total = 0), hãy thông báo: 'Không tìm thấy dữ liệu phù hợp trong CSDL'.

2. VẬN DỤNG KIẾN THỨC Y KHOA:
   - Bạn có kiến thức y khoa chuyên sâu (lão khoa, dược lý lâm sàng, hồi sức, xử trí cấp cứu, tương tác thuốc).
   - Khi người dùng hỏi về tác dụng của một loại thuốc (ví dụ: 'PAT10000 đang dùng Amlodipine, thuốc này có tác dụng gì?') -> Lấy thông tin đơn thuốc của bệnh nhân từ CSDL + Giải thích dược lý lâm sàng chuẩn xác.
   - Luôn phân biệt rõ ràng: 'Dữ liệu thực tế ghi nhận trong CSDL' và 'Kiến thức y khoa/Khuyến nghị lâm sàng'.

3. CHUYỂN ĐỔI NGỮ CẢNH LINH HOẠT (CONTEXT SWITCHING):
   - Bạn có thể chuyển đổi mượt mà giữa Ngữ cảnh một bệnh nhân cụ thể (Patient Context) và Ngữ cảnh điều hành toàn viện (System Context).
   - Khi nhắc đến bệnh nhân dạng PATxxxxx hoặc tên người bệnh, hãy tự động tra cứu đúng bệnh nhân đó.

4. XÁC NHẬN AN TOÀN KHI THAY ĐỔI DỮ LIỆU:
   - Với các yêu cầu xóa dữ liệu hoặc thao tác nhạy cảm, đưa ra cảnh báo phạm vi ảnh hưởng và yêu cầu xác nhận.

Định dạng câu trả lời chuyên nghiệp, cấu trúc rõ ràng, sử dụng Markdown trực quan (tiêu đề, danh sách, bảng biểu khi cần).
"""


class AdminAIService:
    """
    Dịch vụ AI Agent chuyên trách cho Quản trị viên & Bác sĩ.
    """

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def get_or_create_conversation(cls, conversation_id: str, user_id: int = None) -> Conversation:
        try:
            conv = db.session.get(Conversation, conversation_id)
            if not conv:
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role_scope="ADMIN",
                    title="Phiên Quản Trị Hệ Thống"
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
        conversation_id: str = "admin_session_default",
        user_id: Optional[int] = 1,
        user_role: str = "Admin",
        history: list = None
    ) -> Dict[str, Any]:
        """
        Xử lý tin nhắn chat từ Quản trị viên qua Multi-turn Tool Calling Agent.
        """
        # 1. BẢO MẬT & PHÂN QUYỀN RBAC
        if not RBACService.is_admin_role(user_role):
            return {
                "success": False,
                "reply": "🔒 403 Forbidden: Chỉ tài khoản Quản trị viên / Y tế được cấp quyền mới có thể truy cập Admin AI.",
                "conversationId": conversation_id,
                "role_scope": "ADMIN",
                "forbidden": True
            }

        # 2. Lưu cuộc hội thoại vào CSDL
        conv = cls.get_or_create_conversation(conversation_id, user_id=user_id)
        if conv:
            try:
                db.session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Ghi Audit Log cho truy vấn Admin
        try:
            audit = AIAuditLog(
                user_id=user_id,
                user_role=RBACService.normalize_role(user_role),
                action_type="ADMIN_AI_CHAT",
                target_id="SYSTEM",
                details=user_message[:200],
                status="SUCCESS"
            )
            db.session.add(audit)
            db.session.commit()
        except Exception:
            db.session.rollback()

        # 3. Kiểm tra yêu cầu Xóa / Thao tác nhạy cảm
        q_lower = user_message.lower()
        if ("xóa" in q_lower or "delete" in q_lower) and any(k in q_lower for k in ["bệnh nhân", "benh nhan", "patient", "pat"]):
            match = re.search(r"pat\d+", q_lower, re.IGNORECASE)
            pat_code = match.group(0).upper() if match else "PAT10000"
            confirmation_text = (
                f"### ⚠️ YÊU CẦU XÁC NHẬN THAO TÁC HỆ THỐNG\n\n"
                f"Bạn đang yêu cầu **XÓA BỆNH NHÂN {pat_code}** khỏi cơ sở dữ liệu.\n\n"
                f"**Phạm vi ảnh hưởng:**\n"
                f"- Toàn bộ hồ sơ bệnh án và lịch sử sinh hiệu.\n"
                f"- Hủy liên kết camera giám sát trong phòng.\n"
                f"- Xóa toàn bộ đơn thuốc và lịch nhắc uống thuốc liên quan.\n\n"
                f"📌 *Hệ thống ElderlyCare AI yêu cầu xác nhận của Quản trị viên trước khi thực hiện thao tác xóa dữ liệu.*"
            )
            if conv:
                try:
                    db.session.add(Message(conversation_id=conversation_id, role="assistant", content=confirmation_text))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            return {
                "success": True,
                "reply": confirmation_text,
                "conversationId": conversation_id,
                "role_scope": "ADMIN",
                "require_confirmation": True,
                "action_target": pat_code
            }

        api_key = cls.get_api_key()

        # NẾU CHƯA CÓ API KEY -> Chạy Engine Suy Luận Quản Trị Nội Bộ (Internal Admin Reasoning Engine)
        if not api_key or api_key in ["YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"]:
            reply_text = cls._internal_admin_reasoning(user_message)
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
                "role_scope": "ADMIN"
            }

        # 4. CHẠY VÒNG LẶP GEMINI MULTI-TURN AGENTIC TOOL CALLING
        model_name = cls.get_model_name()
        endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        contents = []
        if history:
            for h in history[-8:]:
                role = "user" if h.get("role") in ["user", "human"] else "model"
                text_content = h.get("text") or h.get("content") or ""
                if text_content:
                    contents.append({"role": role, "parts": [{"text": text_content}]})

        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {"parts": [{"text": ADMIN_SYSTEM_PROMPT}]},
            "contents": contents,
            "tools": [{"function_declarations": ADMIN_TOOL_DECLARATIONS}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
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

            has_tool_call = False
            tool_name = None
            tool_args = {}

            for part in parts:
                if "functionCall" in part:
                    has_tool_call = True
                    tool_name = part["functionCall"].get("name")
                    tool_args = part["functionCall"].get("args", {})
                    break

            if has_tool_call and tool_name in ADMIN_TOOL_DISPATCHER:
                tool_func = ADMIN_TOOL_DISPATCHER[tool_name]
                tool_result = tool_func(**tool_args)

                # Gửi Turn 2 ngược lại cho Gemini để tổng hợp y khoa và quản trị (Synthesis)
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
                    "system_instruction": {"parts": [{"text": ADMIN_SYSTEM_PROMPT}]},
                    "contents": turn2_contents,
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
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
                    final_reply = cls._internal_admin_reasoning(user_message, tool_data=tool_result)
            else:
                final_reply = "".join([p.get("text", "") for p in parts if "text" in p]).strip()
                if not final_reply:
                    final_reply = cls._internal_admin_reasoning(user_message)

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
                "role_scope": "ADMIN"
            }

        except Exception as e:
            fallback_text = cls._internal_admin_reasoning(user_message)
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
                "role_scope": "ADMIN",
                "notice": f"AI đang hoạt động ở chế độ phân tích quản trị nội bộ: {str(e)}"
            }

    @classmethod
    def _internal_admin_reasoning(cls, user_message: str, tool_data: dict = None) -> str:
        """
        Engine tổng hợp và phân tích CSDL quản trị toàn diện khi không có Gemini API Key.
        """
        q_lower = user_message.lower()

        # 1. Tìm bệnh nhân dị ứng (Ví dụ: Penicillin, Phấn hoa, Hải sản)
        if any(k in q_lower for k in ["dị ứng", "di ung", "allergy"]):
            allergy_target = "Penicillin"
            if "phấn hoa" in q_lower or "phan hoa" in q_lower:
                allergy_target = "Phấn hoa"
            elif "hải sản" in q_lower or "hai san" in q_lower:
                allergy_target = "Hải sản"
            elif "kháng sinh" in q_lower or "khang sinh" in q_lower:
                allergy_target = "Kháng sinh"
            elif "penicillin" in q_lower:
                allergy_target = "Penicillin"

            res = search_patients_by_allergy(allergy_target, page=1, limit=20)
            total = res.get("total", 0)
            items = res.get("results", [])

            lines = []
            for idx, p in enumerate(items):
                lines.append(f"{idx+1}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi, {p['gender']}) | Dị ứng: `{p['allergy']}` | SĐT: {p['phone']}")

            list_str = "\n".join(lines) if lines else "*(Không có bản ghi)*"

            return (
                f"### 🔍 KẾT QUẢ TÌM KIẾM BỆNH NHÂN DỊ ỨNG: '{allergy_target.upper()}'\n\n"
                f"Tổng số bệnh nhân ghi nhận trong CSDL: **{total} bệnh nhân** (Đang hiển thị {len(items)} bản ghi đầu tiên):\n\n"
                f"{list_str}\n\n"
                f"📌 *Dữ liệu được trích xuất trực tiếp từ CSDL Users & Clinical Records.*"
            )

        # 2. Số lượng bệnh nhân có nguy cơ té ngã cao
        if any(k in q_lower for k in ["nguy cơ té ngã", "nguy co te nga", "nguy cơ ngã", "nguy co nga"]):
            res = search_patients_by_fall_risk("Cao", page=1, limit=20)
            total = res.get("total", 0)
            items = res.get("results", [])

            lines = []
            for idx, p in enumerate(items):
                lines.append(f"{idx+1}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi) | HA: `{p['blood_pressure']}` | SpO₂: `{p['spo2']}%` | Trạng thái: `{p['health_status']}`")

            list_str = "\n".join(lines) if lines else "*(Không có bản ghi)*"

            return (
                f"### 🚨 THỐNG KÊ BỆNH NHÂN NGUY CƠ TÉ NGÃ CAO\n\n"
                f"Tổng số bệnh nhân có nguy cơ té ngã mức độ **CAO**: **{total} bệnh nhân**.\n\n"
                f"**Danh sách bệnh nhân cần lưu ý giám sát:**\n"
                f"{list_str}\n\n"
                f"💡 **Khuyến nghị vận hành:** Kích hoạt cảm biến camera phòng và ưu tiên nhân viên trực theo dõi sát nhóm bệnh nhân này."
            )

        # 3. Bệnh nhân có dấu hiệu bất thường hôm nay
        if any(k in q_lower for k in ["bất thường", "bat thuong", "cần theo dõi", "can theo doi", "dấu hiệu lạ"]):
            res = search_patients_by_health_status("Bất thường", page=1, limit=20)
            if res.get("total", 0) == 0:
                res = search_patients_by_health_status("Theo dõi", page=1, limit=20)

            total = res.get("total", 0)
            items = res.get("results", [])
            lines = []
            for idx, p in enumerate(items):
                lines.append(f"{idx+1}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi) | HA: `{p['blood_pressure']}` | SpO₂: `{p['spo2']}%` | Nguy cơ ngã: `{p['fall_risk']}`")

            return (
                f"### 🩺 DANH SÁCH BỆNH NHÂN CÓ DẤU HIỆU BẤT THƯỜNG / CẦN THEO DÕI\n\n"
                f"Tổng số bản ghi phát hiện: **{total} bệnh nhân**.\n\n"
                f"{chr(10).join(lines) if lines else '🟢 Hiện không ghi nhận bệnh nhân nào có sinh hiệu bất thường nghiêm trọng.'}\n\n"
                f"📌 *Nguồn dữ liệu: Bảng HealthRecords đo đạc thời gian thực.*"
            )

        # 4. Tra cứu thông tin của một bệnh nhân cụ thể (PATxxxxx)
        pat_match = re.search(r"pat\d+", q_lower, re.IGNORECASE)
        if pat_match:
            pid = pat_match.group(0).upper()
            prof = get_patient_profile(pid)
            if not prof.get("found"):
                return f"### ❌ KHÔNG TÌM THẤY DỮ LIỆU\n\nKhông tìm thấy hồ sơ bệnh nhân **{pid}** trong cơ sở dữ liệu hệ thống."

            # Nếu hỏi về thuốc của bệnh nhân
            if any(k in q_lower for k in ["thuốc", "thuoc", "đơn thuốc", "don thuoc", "uống", "uong"]):
                meds = get_patient_medications(pid)
                rxs = get_patient_prescriptions(pid)
                sched = get_patient_medication_schedule(pid)

                med_lines = "\n".join([f"{idx+1}. **{m['medicine_name']}** — Liều: **{m['dosage']}** • {m['frequency']} • Hướng dẫn: *{m['instruction']}* (Chẩn đoán: `{m['diagnosis']}`)" for idx, m in enumerate(meds.get("medications", []))])
                sched_lines = "\n".join([f"- Cữ **{s['time']}**: **{s['medicine_name']}** ({s['dosage']}) — Trạng thái: `{s['status']}`" for s in sched.get("schedules", [])])

                # Nếu hỏi kết hợp kiến thức y khoa về tác dụng thuốc
                med_knowledge_addendum = ""
                if "amlodipine" in q_lower:
                    med_knowledge_addendum = (
                        f"\n\n#### 📖 Về kiến thức dược lý thuốc Amlodipine:\n"
                        f"- Amlodipine là thuốc hạ áp nhóm chẹn kênh canxi dihydropyridine, có tác dụng làm giãn động mạch ngoại vi, hạ huyết áp và giảm đau thắt ngực. "
                        f"Liều chuẩn 5-10mg/ngày. Cần theo dõi tác dụng phụ phù mắt cá chân ở người già."
                    )

                return (
                    f"### 💊 ĐƠN THUỐC & LỊCH DÙNG THUỐC: {prof.get('full_name')} ({pid})\n\n"
                    f"#### 📋 Thuốc đang chỉ định ({meds.get('total_medications', 0)} loại):\n"
                    f"{med_lines or '- Chưa có thuốc kê đơn hoạt động.'}\n\n"
                    f"#### ⏰ Lịch uống thuốc hôm nay ({sched.get('date', 'Hôm nay')}):\n"
                    f"{sched_lines or '- Chưa có cữ thuốc được lập lịch.'}"
                    f"{med_knowledge_addendum}\n\n"
                    f"📌 *Dữ liệu được trích xuất từ bảng Prescriptions và MedicineSchedules.*"
                )

            # Nếu hỏi về báo cáo sức khỏe / diễn tiến
            if any(k in q_lower for k in ["báo cáo", "bao cao", "7 ngày", "lịch sử", "lich su", "sức khỏe", "suc khoe"]):
                hr_history = get_patient_health_records(pid, days=7)
                latest_hr = get_latest_health_record(pid)

                rec_lines = "\n".join([f"- **{r['recorded_at']}**: HA `{r['blood_pressure']}` mmHg | Nhịp tim `{r['heart_rate']}` BPM | SpO₂ `{r['spo2']}%`" for r in hr_history.get("records", [])[:5]])

                return (
                    f"### 📊 BÁO CÁO SỨC KHỎE BỆNH NHÂN: {prof.get('full_name')} ({pid})\n\n"
                    f"**1. Sinh hiệu đo gần nhất ({latest_hr.get('recorded_at', 'Hôm nay')}):**\n"
                    f"- 🩸 Huyết áp: **{latest_hr.get('blood_pressure', 'N/A')} mmHg**\n"
                    f"- ❤️ Nhịp tim: **{latest_hr.get('heart_rate', 'N/A')} BPM**\n"
                    f"- 🫁 SpO₂: **{latest_hr.get('spo2', 'N/A')}%**\n"
                    f"- 🌡️ Thân nhiệt: **{latest_hr.get('temperature', 'N/A')}°C**\n"
                    f"- 🛡️ Nguy cơ ngã: `{latest_hr.get('fall_risk', 'Thấp')}`\n\n"
                    f"**2. Lịch sử theo dõi 7 ngày gần đây ({hr_history.get('total_records', 0)} lần đo):**\n"
                    f"{rec_lines or '- Chưa có lịch sử đo ghi nhận.'}\n\n"
                    f"📌 *Báo cáo tổng hợp tự động từ hệ thống lâm sàng ElderlyCare AI.*"
                )

            # Mặc định trả hồ sơ tổng quan của bệnh nhân
            latest_hr = get_latest_health_record(pid)
            cams = get_patient_camera_status(pid)
            cam_str = ", ".join([f"{c['name']} ({c['status']})" for c in cams.get("cameras", [])]) if cams.get("cameras") else "Chưa gán camera"

            return (
                f"### 👤 HỒ SƠ BỆNH NHÂN: {prof.get('full_name')} ({pid})\n\n"
                f"- **Tuổi**: {prof.get('age')} tuổi • **Giới tính**: {prof.get('gender')}\n"
                f"- **Điện thoại**: {prof.get('phone')} • **Địa chỉ**: {prof.get('address')}\n"
                f"- **Nhóm máu**: {prof.get('blood_group')} • **Dị ứng**: `{prof.get('allergy')}`\n"
                f"- **Bác sĩ phụ trách**: {prof.get('doctor_name')}\n"
                f"- **Người thân**: {prof.get('caregiver_name')} ({prof.get('caregiver_phone')})\n\n"
                f"**Sinh hiệu gần nhất ({latest_hr.get('recorded_at', 'Hôm nay')}):**\n"
                f"- Huyết áp: **{latest_hr.get('blood_pressure', 'N/A')} mmHg** | Nhịp tim: **{latest_hr.get('heart_rate', 'N/A')} BPM** | SpO₂: **{latest_hr.get('spo2', 'N/A')}%**\n"
                f"- Camera phòng: {cam_str}"
            )

        # 5. Tra cứu Dược lý Y khoa & Kiến thức Lâm sàng Tổng quát
        if any(k in q_lower for k in ["là thuốc gì", "la thuoc gi", "tác dụng của thuốc", "tac dung cua thuoc", "dược lý", "duoc ly", "amlodipine", "omeprazole", "atorvastatin", "metformin", "paracetamol"]):
            if "amlodipine" in q_lower:
                return (
                    f"### 💊 THÔNG TIN DƯỢC LÝ LÂM SÀNG: AMLODIPINE\n\n"
                    f"- **Phân loại**: Thuốc điều trị tăng huyết áp và đau thắt ngực nhóm chẹn kênh canxi dihydropyridine.\n"
                    f"- **Cơ chế tác dụng**: Làm giãn cơ trơn tiểu động mạch, giảm sức cản ngoại vi, từ đó giúp hạ huyết áp và giảm tải cho tim mạch.\n"
                    f"- **Liều dùng thông thường**: 5mg – 10mg uống 1 lần mỗi ngày (thường vào buổi sáng).\n"
                    f"- **Lưu ý lâm sàng cho người cao tuổi**: Theo dõi dấu hiệu phù mắt cá chân (phù ngoại biên), chóng mặt khi thay đổi tư thế đột ngột."
                )
            if "omeprazole" in q_lower:
                return (
                    f"### 💊 THÔNG TIN DƯỢC LÝ LÂM SÀNG: OMEPRAZOLE\n\n"
                    f"- **Phân loại**: Thuốc ức chế bơm proton (PPI).\n"
                    f"- **Cơ chế tác dụng**: Ức chế đặc hiệu enzyme H+/K+-ATPase ở tế bào thành dạ dày, làm giảm tiết acid dịch vị.\n"
                    f"- **Chỉ định**: Viêm loét dạ dày - tá tràng, trào ngược dạ dày thực quản (GERD), dự phòng loét dạ dày khi dùng thuốc NSAID kéo dài."
                )
            if "atorvastatin" in q_lower:
                return (
                    f"### 💊 THÔNG TIN DƯỢC LÝ LÂM SÀNG: ATORVASTATIN\n\n"
                    f"- **Phân loại**: Thuốc hạ lipid máu nhóm statin (ức chế HMG-CoA reductase).\n"
                    f"- **Chỉ định**: Tăng cholesterol máu nguyên phát, rối loạn lipid máu hỗn hợp, phòng ngừa biến cố tim mạch ở người lớn tuổi."
                )

        # 6. Thống kê toàn viện
        stats = get_system_statistics()
        alerts = get_system_alerts()
        cams = get_camera_status()

        return (
            f"### 🏥 BÁO CÁO ĐIỀU HÀNH HỆ THỐNG TOÀN VIỆN (ELDERLYCARE AI)\n\n"
            f"- 👥 **Tổng số bệnh nhân đang quản lý**: **{stats.get('total_patients', 0)} người**\n"
            f"- 📹 **Hệ sinh thái Camera giám sát**: **{stats.get('online_cameras', 0)}/{stats.get('total_cameras', 0)} camera trực tuyến**\n"
            f"- 🚨 **Cảnh báo đang hoạt động**: **{stats.get('active_alerts', 0)} cảnh báo**\n"
            f"- ⚠️ **Bệnh nhân có nguy cơ té ngã cao**: **{stats.get('high_fall_risk_patients', 0)} người**\n\n"
            f"Bạn có thể yêu cầu tôi tra cứu chi tiết bệnh nhân, tìm kiếm theo dị ứng/thuốc/bệnh án, hoặc xuất báo cáo lâm sàng."
        )
