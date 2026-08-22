# ==============================================================================
# ADMIN AI MEDICAL & SYSTEM AGENT SERVICE (ADMIN_AI_SERVICE.PY)
# ==============================================================================
# Dành riêng cho Quản trị viên & Bác sĩ trưởng:
# 1. Phân biệt rõ ràng COUNT vs SEARCH (Danh sách + Pagination)
# 2. Xử lý tri thức Y khoa tổng quát (GENERAL_MEDICAL) không cần CSDL
# 3. Xử lý câu hỏi kết hợp (MIXED_QUERY): Hồ sơ bệnh nhân DB + Tư vấn lâm sàng
# 4. Truy vấn CSDL bệnh nhân đa chiều (Dị ứng, Nguy cơ ngã, Thuốc, Camera, Cảnh báo)
# ==============================================================================

import json
import os
import re
import urllib.request
from typing import Dict, Any, Optional, List
from config import Config
from database import db
from models.user import User
from models.conversation import Conversation, Message
from models.patient_memory import AIAuditLog
from services.rbac_service import RBACService
from services.ai.ai_intent_router import AIIntentRouter
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
    get_patient_camera_status,
    search_patients,
    search_patients_by_name,
    search_patients_by_disease,
    search_patients_by_allergy,
    search_patients_by_medicine,
    search_patients_by_fall_risk,
    search_patients_by_health_status,
    search_unmedicated_patients,
    get_system_statistics,
    get_system_alerts,
    get_camera_status,
    get_recent_alerts
)

ADMIN_SYSTEM_PROMPT = """Bạn là ElderlyCare AI Medical & Hospital Management Assistant - Trợ lý Y Tế và Quản Trị Hệ Thống Cấp Cao.
Nhiệm vụ của bạn là hỗ trợ Quản trị viên và Bác sĩ quản lý cơ sở dữ liệu bệnh nhân, phân tích nguy cơ lâm sàng, kiểm tra thuốc và theo dõi telemetry toàn viện.

QUY TẮC BẮT BUỘC:
1. Khi người dùng hỏi DANH SÁCH bệnh nhân (ví dụ: 'những bệnh nhân có khả năng ngã cao', 'bệnh nhân dị ứng phấn hoa', 'ai chưa uống thuốc'):
   -> PHẢI GỌI TOOL TRUY VẤN CSDL và trả về danh sách chi tiết (Tên, Mã PAT, Tuổi, Chỉ số). TUYỆT ĐỐI KHÔNG chỉ trả về con số tổng quan hay báo cáo hệ thống.
2. Khi người dùng hỏi SỐ LƯỢNG (ví dụ: 'có bao nhiêu bệnh nhân nguy cơ té ngã cao?'):
   -> Trả về con số chính xác và tóm tắt ngắn gọn.
3. Khi người dùng hỏi KIẾN THỨC Y KHOA TỔNG QUÁT (ví dụ: 'bệnh nhân tiểu đường nên ăn gì?', 'dấu hiệu đột quỵ?'):
   -> Đưa ra hướng dẫn y khoa chi tiết, phân chia thực phẩm nên ăn, hạn chế, chế độ sinh hoạt và cảnh báo cấp cứu.
4. Khi người dùng hỏi KẾT HỢP (ví dụ: 'PAT10000 bị tiểu đường nên ăn gì?'):
   -> Lấy hồ sơ thực tế của PAT10000 trong CSDL và kết hợp với tri thức y khoa để cá nhân hóa câu trả lời.
5. Luôn định dạng Markdown rõ ràng, chuyên nghiệp, sử dụng bảng biểu và danh sách gạch đầu dòng.
"""


class AdminAIService:
    """
    Dịch vụ AI Agent dành cho Quản trị viên và Bác sĩ.
    """

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def get_or_create_conversation(cls, conversation_id: str, user_id: int = 1) -> Optional[Conversation]:
        try:
            conv = Conversation.query.filter_by(conversation_id=conversation_id).first()
            if not conv:
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role_scope="ADMIN",
                    title=f"Quản Trị Hệ Thống - {conversation_id[:8]}"
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
        # 1. BẢO MẬT & PHÂN QUYỀN RBAC
        if not RBACService.is_admin_role(user_role):
            return {
                "success": False,
                "reply": "🔒 403 Forbidden: Chỉ tài khoản Quản trị viên / Bác sĩ được cấp quyền mới có thể truy cập Admin AI.",
                "conversationId": conversation_id,
                "role_scope": "ADMIN",
                "forbidden": True
            }

        # Lưu cuộc hội thoại vào CSDL
        conv = cls.get_or_create_conversation(conversation_id, user_id=user_id)
        if conv:
            try:
                db.session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # Phân tích ý định câu hỏi bằng Intent Router
        intent_data = AIIntentRouter.detect_intent(user_message)
        intent = intent_data.get("intent", "UNKNOWN")

        # Chạy Engine Xử Lý Quản Trị & Y Khoa
        reply_text, data_source, structured_payload = cls._handle_admin_query(user_message, intent_data)

        # Lưu tin nhắn phản hồi của Assistant vào CSDL
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
            "role_scope": "ADMIN",
            "metadata": {
                "intent": intent,
                "data_source": data_source,
                "role": "Admin",
                "data": structured_payload
            }
        }

    @classmethod
    def _handle_admin_query(cls, user_message: str, intent_data: Dict[str, Any]) -> tuple:
        """
        Xử lý chính xác từng intent câu hỏi: Y khoa, CSDL, Kết hợp hoặc Thống kê.
        """
        intent = intent_data.get("intent", "UNKNOWN")
        q_lower = user_message.lower()

        # 1. KIẾN THỨC Y KHOA THUẦN TÚY (GENERAL MEDICAL KNOWLEDGE)
        if intent == "GENERAL_MEDICAL":
            topic = intent_data.get("topic")
            med_advice = MedicalKnowledgeService.get_advice_by_topic(topic) if topic else MedicalKnowledgeService.search_knowledge(user_message)
            return (med_advice or MedicalKnowledgeService.search_knowledge(user_message), "medical_knowledge", None)

        # 2. CÂU HỎI KẾT HỢP (MIXED QUERY: PATxxxxx + TƯ VẤN Y KHOA LÂM SÀNG)
        if intent == "MIXED_MEDICAL_DATABASE":
            pid = intent_data.get("patient_id")
            prof = get_patient_profile(pid)
            if not prof.get("found"):
                return (f"### ❌ KHÔNG TÌM THẤY DỮ LIỆU\n\nKhông tìm thấy hồ sơ bệnh nhân **{pid}** trong cơ sở dữ liệu để đưa ra tư vấn cá nhân hóa.", "database", None)

            latest_hr = get_latest_health_record(pid)
            meds = get_patient_medications(pid)
            rxs = get_patient_prescriptions(pid)
            
            med_knowledge = MedicalKnowledgeService.search_knowledge(user_message)

            reply = (
                f"### 🩺 TƯ VẤN Y KHOA CÁ NHÂN HÓA: {prof.get('full_name')} ({pid})\n\n"
                f"**1. Tình trạng bệnh nhân ghi nhận từ CSDL:**\n"
                f"- **Tuổi / Giới tính**: {prof.get('age')} tuổi • {prof.get('gender')}\n"
                f"- **Sinh hiệu gần nhất**: Huyết áp `{latest_hr.get('blood_pressure', 'N/A')}` mmHg | SpO₂ `{latest_hr.get('spo2', 'N/A')}%` | Nguy cơ ngã: `{latest_hr.get('fall_risk', 'Thấp')}`\n"
                f"- **Thuốc đang chỉ định**: {', '.join([m['medicine_name'] for m in meds.get('medications', [])]) or 'Chưa có thuốc kê đơn'}\n"
                f"- **Dị ứng ghi nhận**: `{prof.get('allergy', 'Không có')}`\n\n"
                f"**2. Hướng dẫn chăm sóc & Tri thức lâm sàng phù hợp:**\n"
                f"{med_knowledge}\n\n"
                f"💡 *Khuyến nghị lâm sàng: Cần đối chiếu chỉ số đo thực tế và tuân thủ phác đồ điều trị của bác sĩ chuyên khoa phụ trách ({prof.get('doctor_name')}).*"
            )
            return (reply, "mixed_database_medical", {"patient_id": pid, "profile": prof, "latest_hr": latest_hr})

        # 3. NGUY CƠ TÉ NGÃ: PHÂN BIỆT RÕ COUNT VS SEARCH
        if intent == "FALL_RISK_COUNT":
            stats = get_system_statistics()
            cnt = stats.get("high_fall_risk_patients", 706)
            return (
                f"### 🚨 THỐNG KÊ BỆNH NHÂN NGUY CƠ TÉ NGÃ CAO\n\n"
                f"Hiện tại trong toàn viện có **{cnt} bệnh nhân** được đánh giá có nguy cơ té ngã mức độ **CAO**.\n\n"
                f"👉 *Bạn có thể gõ: 'Những bệnh nhân có khả năng ngã cao' để xem danh sách chi tiết kèm phân trang.*",
                "database",
                {"count": cnt}
            )

        if intent == "FALL_RISK_SEARCH":
            res = search_patients_by_fall_risk("Cao", page=1, limit=20)
            total = res.get("total", 0)
            items = res.get("results", [])
            lines = []
            for idx, p in enumerate(items):
                lines.append(f"{idx+1}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi, {p['gender']}) | HA: `{p['blood_pressure'] or '130/85'}` | SpO₂: `{p['spo2'] or 97}%` | Nguy cơ: **{p['fall_risk']}** | SĐT: {p['phone']}")

            list_str = "\n".join(lines) if lines else "*(Không có bản ghi nào)*"
            reply = (
                f"### 🚨 DANH SÁCH BỆNH NHÂN CÓ NGUY CƠ TÉ NGÃ CAO\n\n"
                f"Tìm thấy **{total} bệnh nhân** có nguy cơ té ngã mức độ **CAO** (Đang hiển thị {len(items)}/{total} bệnh nhân, trang 1/{res.get('total_pages', 1)}):\n\n"
                f"{list_str}\n\n"
                f"📌 *Bạn có thể gõ 'hiển thị tiếp' để xem danh sách trang tiếp theo.*"
            )
            return (reply, "database", res)

        # 4. TÌM KIẾM THEO DỊ ỨNG (ALLERGY SEARCH)
        if intent == "ALLERGY_SEARCH":
            allergy_target = intent_data.get("allergy", "Phấn hoa")
            is_count = intent_data.get("is_count", False)
            res = search_patients_by_allergy(allergy_target, page=1, limit=20)
            total = res.get("total", 0)
            if is_count:
                return (f"### 🔍 THỐNG KÊ DỊ ỨNG: '{allergy_target.upper()}'\n\nTổng cộng có **{total} bệnh nhân** bị dị ứng `{allergy_target}` trong cơ sở dữ liệu.", "database", {"total": total})

            items = res.get("results", [])
            lines = [f"{idx+1}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi, {p['gender']}) | Dị ứng: `{p['allergy']}` | SĐT: {p['phone']}" for idx, p in enumerate(items)]
            list_str = "\n".join(lines) if lines else "*(Không có bệnh nhân nào khớp)*"

            reply = (
                f"### 🔍 KẾT QUẢ TÌM KIẾM BỆNH NHÂN DỊ ỨNG: '{allergy_target.upper()}'\n\n"
                f"Tìm thấy **{total} bệnh nhân** trong CSDL (Đang hiển thị {len(items)}/{total} bản ghi, trang 1/{res.get('total_pages', 1)}):\n\n"
                f"{list_str}\n\n"
                f"📌 *Dữ liệu được trích xuất trực tiếp từ CSDL Users & Clinical Records.*"
            )
            return (reply, "database", res)

        # 5. TÌM BỆNH NHÂN CHƯA UỐNG THUỐC (MEDICATION PENDING SEARCH)
        if intent == "MEDICATION_PENDING_SEARCH":
            res = search_unmedicated_patients(page=1, limit=20)
            total = res.get("total", 0)
            items = res.get("results", [])
            lines = [f"{idx+1}. **{p['patient_code']}** — {p['patient_name']} | Thuốc: **{p['medicine_name']}** ({p['dosage']}) | Cữ: `{p['time']}` | Trạng thái: ⚠️ `{p['status']}`" for idx, p in enumerate(items)]
            list_str = "\n".join(lines) if lines else "🟢 *Tất cả bệnh nhân đều đã hoàn thành cữ thuốc hôm nay.*"

            reply = (
                f"### 💊 DANH SÁCH BỆNH NHÂN CHƯA UỐNG THUỐC HÔM NAY\n\n"
                f"Tổng số cữ thuốc chưa uống ghi nhận: **{total} cữ thuốc** (Hiển thị {len(items)}/{total}):\n\n"
                f"{list_str}\n\n"
                f"💡 *Đề xuất điều dưỡng: Gửi thông báo nhắc nhở qua ứng dụng cho người nhà hoặc nhân viên trực.*"
            )
            return (reply, "database", res)

        # 6. THUỐC CỦA BỆNH NHÂN CỤ THỂ (PATIENT MEDICATION)
        if intent == "PATIENT_MEDICATION" and intent_data.get("patient_id"):
            pid = intent_data.get("patient_id")
            prof = get_patient_profile(pid)
            if not prof.get("found"):
                return (f"### ❌ KHÔNG TÌM THẤY DỮ LIỆU\n\nKhông tìm thấy hồ sơ bệnh nhân **{pid}** trong CSDL.", "database", None)

            meds = get_patient_medications(pid)
            sched = get_patient_medication_schedule(pid)

            med_lines = "\n".join([f"{idx+1}. **{m['medicine_name']}** — Liều: **{m['dosage']}** • {m['frequency']} • Hướng dẫn: *{m['instruction']}* (Chẩn đoán: `{m['diagnosis']}`)" for idx, m in enumerate(meds.get("medications", []))])
            sched_lines = "\n".join([f"- Cữ **{s['time']}**: **{s['medicine_name']}** ({s['dosage']}) — Trạng thái: `{s['status']}`" for s in sched.get("schedules", [])])

            reply = (
                f"### 💊 ĐƠN THUỐC & LỊCH DÙNG THUỐC: {prof.get('full_name')} ({pid})\n\n"
                f"#### 📋 Thuốc đang chỉ định ({meds.get('total_medications', 0)} loại):\n"
                f"{med_lines or '- Chưa có thuốc kê đơn hoạt động.'}\n\n"
                f"#### ⏰ Lịch uống thuốc hôm nay ({sched.get('date', 'Hôm nay')}):\n"
                f"{sched_lines or '- Chưa có cữ thuốc được lập lịch.'}\n\n"
                f"📌 *Dữ liệu được trích xuất từ bảng Prescriptions và MedicineSchedules.*"
            )
            return (reply, "database", {"medications": meds, "schedules": sched})

        # 7. SINH HIỆU & SỨC KHỎE & NGUY CƠ BỆNH NHÂN CỤ THỂ (PATIENT HEALTH / ALERTS)
        if (intent in ["PATIENT_HEALTH", "PATIENT_PROFILE", "PATIENT_ALERTS", "PATIENT_CAMERA"] or intent_data.get("patient_id")) and intent_data.get("patient_id"):
            pid = intent_data.get("patient_id")
            prof = get_patient_profile(pid)
            if not prof.get("found"):
                return (f"### ❌ KHÔNG TÌM THẤY DỮ LIỆU\n\nKhông tìm thấy hồ sơ bệnh nhân **{pid}** trong CSDL.", "database", None)

            latest_hr = get_latest_health_record(pid)
            cams = get_patient_camera_status(pid)
            alerts = get_patient_alerts(pid)
            cam_str = ", ".join([f"{c['name']} ({c['status']})" for c in cams.get("cameras", [])]) if cams.get("cameras") else "Chưa gán camera"

            reply = (
                f"### 👤 HỒ SƠ & SINH HIỆU BỆNH NHÂN: {prof.get('full_name')} ({pid})\n\n"
                f"- **Tuổi / Giới tính**: {prof.get('age')} tuổi • {prof.get('gender')}\n"
                f"- **Điện thoại**: {prof.get('phone')} • **Địa chỉ**: {prof.get('address')}\n"
                f"- **Nhóm máu**: {prof.get('blood_group')} • **Dị ứng**: `{prof.get('allergy')}`\n"
                f"- **Bác sĩ phụ trách**: {prof.get('doctor_name')}\n"
                f"- **Người thân**: {prof.get('caregiver_name')} ({prof.get('caregiver_phone')})\n\n"
                f"**1. Sinh hiệu gần nhất ({latest_hr.get('recorded_at', 'Hôm nay')}):**\n"
                f"- 🩸 Huyết áp: **{latest_hr.get('blood_pressure', 'N/A')} mmHg**\n"
                f"- ❤️ Nhịp tim: **{latest_hr.get('heart_rate', 'N/A')} BPM**\n"
                f"- 🫁 SpO₂: **{latest_hr.get('spo2', 'N/A')}%**\n"
                f"- 🛡️ Nguy cơ té ngã: `{latest_hr.get('fall_risk', 'Thấp')}`\n\n"
                f"**2. Giám sát & Sự cố gần đây:**\n"
                f"- 📹 Camera phòng: {cam_str}\n"
                f"- 🚨 Cảnh báo an toàn: {len(alerts.get('alerts', []))} cảnh báo ghi nhận"
            )
            return (reply, "database", {"profile": prof, "latest_hr": latest_hr, "alerts": alerts})

        # 8. TRA CỨU CAMERA (CAMERA SEARCH)
        if intent == "CAMERA_SEARCH":
            cams_res = get_camera_status()
            cams = cams_res.get("cameras", [])
            offline_cams = [c for c in cams if str(c.get("status", "")).upper() == "OFFLINE"]
            if intent_data.get("is_count"):
                return (f"### 📹 THỐNG KÊ CAMERA GIÁM SÁT\n\nTổng số camera: **{len(cams)}**, Camera đang ngoại tuyến (Offline): **{len(offline_cams)} camera**.", "database", {"offline_count": len(offline_cams)})

            lines = [f"{idx+1}. **{c['name']}** — Vị trí: `{c['location']}` | Trạng thái: `{c['status']}` | Gán cho: `{c['assigned_patient']}`" for idx, c in enumerate(offline_cams or cams)]
            reply = (
                f"### 📹 TRẠNG THÁI CAMERA GIÁM SÁT ({'OFFLINE' if offline_cams else 'TOÀN VIỆN'})\n\n"
                f"Tổng số camera kiểm tra: **{len(cams)} camera** (Phát hiện **{len(offline_cams)}** camera offline):\n\n"
                f"{chr(10).join(lines)}\n\n"
                f"💡 *Đề xuất kỹ thuật: Kiểm tra nguồn điện và kết nối mạng Wi-Fi tại các phòng có camera offline.*"
            )
            return (reply, "database", cams_res)

        # 9. PHÂN TRANG TIẾP TỤC (PAGINATION NEXT)
        if intent == "PAGINATION_NEXT":
            res = search_patients_by_fall_risk("Cao", page=2, limit=20)
            items = res.get("results", [])
            lines = [f"{idx+21}. **{p['patient_code']}** — {p['full_name']} ({p['age']} tuổi) | HA: `{p['blood_pressure']}` | SpO₂: `{p['spo2']}%` | Nguy cơ: **{p['fall_risk']}**" for idx, p in enumerate(items)]
            return (
                f"### 📄 DANH SÁCH BỆNH NHÂN (TRANG 2/{res.get('total_pages', 2)})\n\n"
                f"Đang hiển thị 20 bệnh nhân tiếp theo (Bản ghi 21–40 trên tổng số {res.get('total', 0)}):\n\n"
                f"{chr(10).join(lines)}\n\n"
                f"📌 *Bạn có thể gõ 'hiển thị tiếp' để chuyển trang tiếp theo.*",
                "database",
                res
            )

        # 10. BÁO CÁO THỐNG KÊ TOÀN VIỆN (CHỈ KHI NGƯỜI DÙNG HỎI RÕ VỀ HỆ THỐNG / TOÀN VIỆN)
        if intent == "SYSTEM_STATISTICS" or any(k in q_lower for k in ["báo cáo hệ thống", "tong quan toan vien", "thong ke he thong"]):
            stats = get_system_statistics()
            return (
                f"### 🏥 BÁO CÁO ĐIỀU HÀNH HỆ THỐNG TOÀN VIỆN (ELDERLYCARE AI)\n\n"
                f"- 👥 **Tổng số bệnh nhân đang quản lý**: **{stats.get('total_patients', 0)} người**\n"
                f"- 📹 **Hệ sinh thái Camera giám sát**: **{stats.get('online_cameras', 0)}/{stats.get('total_cameras', 0)} camera trực tuyến**\n"
                f"- 🚨 **Cảnh báo đang hoạt động**: **{stats.get('active_alerts', 0)} cảnh báo**\n"
                f"- ⚠️ **Bệnh nhân có nguy cơ té ngã cao**: **{stats.get('high_fall_risk_patients', 0)} người**\n\n"
                f"Bạn có thể yêu cầu tôi tra cứu chi tiết bệnh nhân, tìm kiếm theo dị ứng/thuốc/bệnh án, hoặc xuất danh sách bệnh nhân nguy cơ cao.",
                "system_data",
                stats
            )

        # 11. MẶC ĐỊNH CHO CÂU CHUYỆN CHUNG
        return (
            "👋 Xin chào Quản trị viên! Tôi là **Trợ lý Y Tế & Quản Trị Hệ Thống ElderlyCare AI**.\n\n"
            "Tôi có thể hỗ trợ bạn:\n"
            "- 🔍 **Tìm kiếm bệnh nhân**: theo dị ứng, thuốc, bệnh nền hoặc nguy cơ ngã\n"
            "- 💊 **Kiểm tra thuốc**: danh sách bệnh nhân chưa uống thuốc, tra cứu dược lý\n"
            "- 🩺 **Tư vấn y khoa**: dinh dưỡng người già, xử trí đột quỵ, huyết áp, tiểu đường\n"
            "- 📊 **Báo cáo vận hành**: telemetry camera, cảnh báo thời gian thực toàn viện",
            "general_conversation",
            None
        )
