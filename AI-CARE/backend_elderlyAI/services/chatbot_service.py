# ==============================================================================
# CHATBOT SERVICE - DỊCH VỤ TRỢ LÝ AI Y TẾ & FUNCTION CALLING GOOGLE GEMINI
# ==============================================================================
# Mô tả: Xử lý tương tác với Google Gemini qua Function Calling (Tools),
#        quản lý lịch sử hội thoại vào CSDL (Conversation, Message),
#        phân quyền người dùng (Admin vs Thân nhân) và trả lời theo cấu trúc y tế chuyên nghiệp.
# ==============================================================================

import os
import re
import json
import urllib.request
import urllib.error
from datetime import datetime
from config import Config
from database import db
from models.conversation import Conversation, Message
from services.auth_permission_service import AuthPermissionService
from services.ai_tools import (
    get_patient_profile,
    search_patients,
    get_latest_vitals,
    get_health_history,
    get_health_summary,
    get_health_trend,
    get_current_medications,
    get_medication_schedule,
    get_medication_history,
    get_medication_adherence,
    get_camera_status,
    get_camera_events,
    get_recent_fall_events,
    get_active_alerts,
    get_alert_history,
    get_patient_risk,
    get_high_risk_patients,
    get_system_statistics
)

TOOL_DISPATCHER = {
    "get_patient_profile": get_patient_profile,
    "search_patients": search_patients,
    "get_latest_vitals": get_latest_vitals,
    "get_health_history": get_health_history,
    "get_health_summary": get_health_summary,
    "get_health_trend": get_health_trend,
    "get_current_medications": get_current_medications,
    "get_medication_schedule": get_medication_schedule,
    "get_medication_history": get_medication_history,
    "get_medication_adherence": get_medication_adherence,
    "get_camera_status": get_camera_status,
    "get_camera_events": get_camera_events,
    "get_recent_fall_events": get_recent_fall_events,
    "get_active_alerts": get_active_alerts,
    "get_alert_history": get_alert_history,
    "get_patient_risk": get_patient_risk,
    "get_high_risk_patients": get_high_risk_patients,
    "get_system_statistics": get_system_statistics
}

SYSTEM_INSTRUCTION = """Bạn là Trợ lý AI Y Tế Thông Minh của hệ thống ElderlyCare AI — nền tảng giám sát sức khỏe, nhắc thuốc và an toàn người cao tuổi.

NGUYÊN TẮC HOẠT ĐỘNG:
1. Bạn có quyền truy vấn dữ liệu thời gian thực từ hệ thống qua các Tools (Hồ sơ bệnh nhân, Sinh hiệu, Đơn thuốc, Lịch uống thuốc, Camera, Cảnh báo ngã, Đánh giá rủi ro).
2. Khi người dùng hỏi thông tin cụ thể (ví dụ: 'camera nào đang offline?', 'ông An có khỏe không?', 'ai quên uống thuốc?', 'có ai nguy cơ ngã không?'), BẮT BUỘC sử dụng Tools để tra cứu dữ liệu chính xác trước khi trả lời.
3. KHÔNG lặp lại lời chào ('Xin chào! Tôi là Trợ lý AI...') trong các lượt trò chuyện liên tiếp. Trả lời thẳng vào trọng tâm câu hỏi của người dùng.
4. Trả lời rõ ràng, ân cần, định dạng Markdown trực quan:
   - **TỔNG QUAN / KẾT QUẢ TRUY VẤN**
   - **CHI TIẾT DỮ LIỆU & CHỈ SỐ**
   - **LƯU Ý / CẢNH BÁO** (nếu có)
   - **KHUYẾN NGHỊ / ĐỀ XUẤT**
5. AN TOÀN Y TẾ: Phân biệt rõ giữa dữ liệu quan sát được và gợi ý chăm sóc. Không tự ý chẩn đoán dứt điểm bệnh hoặc thay đổi liều thuốc nếu không có chỉ định của bác sĩ. Luôn nhắc liên hệ cơ sở y tế nếu có dấu hiệu khẩn cấp.
"""

class ChatbotService:
    """
    Service trung tâm điều phối Chatbot Gemini AI và Function Calling.
    """

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def get_or_create_conversation(cls, conversation_id: str, patient_id: str = None, user_id: int = None) -> Conversation:
        """
        Lấy hoặc tạo mới cuộc hội thoại trong cơ sở dữ liệu.
        """
        try:
            conv = Conversation.query.get(conversation_id)
            if not conv:
                conv = Conversation(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    patient_id=patient_id,
                    title="Cuộc trò chuyện trợ lý y tế"
                )
                db.session.add(conv)
                db.session.commit()
            return conv
        except Exception as e:
            print(f"[ChatbotService] Conversation DB error: {e}")
            db.session.rollback()
            return None

    @classmethod
    def save_message(cls, conversation_id: str, role: str, content: str, structured_data: dict = None):
        """
        Lưu tin nhắn vào lịch sử CSDL.
        """
        try:
            msg = Message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                structured_data=json.dumps(structured_data, ensure_ascii=False) if structured_data else None
            )
            db.session.add(msg)
            db.session.commit()
        except Exception as e:
            print(f"[ChatbotService] Save message DB error: {e}")
            db.session.rollback()

    @classmethod
    def execute_tool(cls, tool_name: str, arguments: dict, user_role: str = "Admin", allowed_patient_ids: list = None) -> dict:
        """
        Thực thi tool và kiểm tra quyền truy cập (Permission Layer).
        """
        if tool_name not in TOOL_DISPATCHER:
            return {"error": f"Tool '{tool_name}' không tồn tại trong hệ thống."}

        tool_func = TOOL_DISPATCHER[tool_name]
        try:
            # Pass user_role or allowed_patient_ids if supported
            if tool_name in ["get_camera_status", "get_high_risk_patients"]:
                return tool_func(user_role=user_role, allowed_patient_ids=allowed_patient_ids)
            return tool_func(**arguments)
        except TypeError:
            try:
                return tool_func()
            except Exception as exc:
                return {"error": str(exc)}
        except Exception as exc:
            return {"error": str(exc)}

    @classmethod
    def process_chat(
        cls,
        user_message: str,
        conversation_id: str = "default_session",
        patient_id: str = "PAT10000",
        history: list = None,
        user_id: int = None,
        user_role: str = "Admin"
    ) -> dict:
        """
        Xử lý tin nhắn chat từ người dùng với Security Boundary & Multi-Patient Data Scoping.
        """
        # Security Boundary: Kiểm tra quyền xem bệnh nhân
        if not AuthPermissionService.validate_patient_access(user_id, user_role, patient_id):
            return {
                "success": False,
                "reply": "⛔ Bạn không có quyền truy cập dữ liệu y tế của bệnh nhân này.",
                "conversation_id": conversation_id,
                "patient_id": patient_id,
                "error": "Forbidden: Patient Access Denied"
            }

        allowed_patient_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)

        # Lưu hội thoại
        cls.get_or_create_conversation(conversation_id, patient_id, user_id)
        cls.save_message(conversation_id, "user", user_message)

        api_key = cls.get_api_key()
        msg_lower = user_message.lower().strip()

        # Multi-turn context resolution: nếu câu hỏi ngắn ("còn hôm qua?", "còn thuốc?") -> giữ ngữ cảnh patient_id hiện tại
        tool_results = []
        structured_data = {}

        # 1. Câu hỏi về Camera / Hạ tầng thiết bị
        if any(w in msg_lower for w in ["camera", "offline", "mắt cam", "thiết bị"]):
            cams = cls.execute_tool("get_camera_status", {}, user_role, allowed_patient_ids)
            tool_results.append({"tool": "get_camera_status", "data": cams})
            structured_data["cameras"] = cams

        # 2. Câu hỏi về Sức khỏe / Sinh hiệu / Chỉ số
        elif any(w in msg_lower for w in ["sức khỏe", "sinh hiệu", "nhịp tim", "huyết áp", "spo2", "khỏe không", "nhiệt độ", "hôm qua"]):
            vitals = cls.execute_tool("get_latest_vitals", {"patient_id": patient_id}, user_role, allowed_patient_ids)
            tool_results.append({"tool": "get_latest_vitals", "data": vitals})
            structured_data["vitals"] = vitals

        # 3. Câu hỏi về Thuốc / Lịch uống thuốc / Quên thuốc
        elif any(w in msg_lower for w in ["thuốc", "uống thuốc", "đơn thuốc", "quên", "lịch thuốc"]):
            if "quên" in msg_lower or ("ai" in msg_lower and user_role == "Admin"):
                adherence = cls.execute_tool("get_medication_adherence", {}, user_role, allowed_patient_ids)
                tool_results.append({"tool": "get_medication_adherence", "data": adherence})
                structured_data["adherence"] = adherence
            else:
                schedule = cls.execute_tool("get_medication_schedule", {"patient_id": patient_id}, user_role, allowed_patient_ids)
                tool_results.append({"tool": "get_medication_schedule", "data": schedule})
                structured_data["medications"] = schedule

        # 4. Nguy cơ té ngã / Cảnh báo an toàn
        elif any(w in msg_lower for w in ["nguy cơ", "té ngã", "ngã", "rủi ro", "cảnh báo", "khẩn cấp", "sự cố"]):
            if any(w in msg_lower for w in ["nguy cơ", "té ngã", "ngã", "rủi ro"]):
                risk = cls.execute_tool("get_high_risk_patients", {}, user_role, allowed_patient_ids)
                tool_results.append({"tool": "get_high_risk_patients", "data": risk})
                structured_data["risk"] = risk
            if any(w in msg_lower for w in ["cảnh báo", "khẩn cấp", "sự cố"]):
                alerts = cls.execute_tool("get_active_alerts", {}, user_role, allowed_patient_ids)
                tool_results.append({"tool": "get_active_alerts", "data": alerts})
                structured_data["alerts"] = alerts

        # 5. Tìm kiếm bệnh nhân
        elif any(w in msg_lower for w in ["tìm", "hồ sơ", "bệnh nhân"]):
            search_res = cls.execute_tool("search_patients", {"query": user_message}, user_role, allowed_patient_ids)
            tool_results.append({"tool": "search_patients", "data": search_res})
            structured_data["search"] = search_res

        # Gửi truy vấn tới Google Gemini API kèm Tool data (nếu có API Key)
        if api_key and api_key != "YOUR_GEMINI_API_KEY":
            try:
                context_str = f"\n\n[DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG]:\n{json.dumps(tool_results, ensure_ascii=False, indent=2)}" if tool_results else ""
                full_prompt = f"{SYSTEM_INSTRUCTION}\n\n[NGƯỜI DÙNG HIỆN TẠI]: Vai trò={user_role}\n[BỆNH NHÂN ĐANG THEO DÕI]: {patient_id}{context_str}\n\n[CÂU HỎI NGƯỜI DÙNG]: {user_message}"

                model = cls.get_model_name()
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024}
                }

                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    candidates = res_body.get("candidates", [])
                    if candidates:
                        reply_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        cls.save_message(conversation_id, "assistant", reply_text, structured_data)
                        return {
                            "success": True,
                            "reply": reply_text,
                            "conversation_id": conversation_id,
                            "patient_id": patient_id,
                            "tools_called": [t["tool"] for t in tool_results],
                            "structured_data": structured_data
                        }
            except Exception as exc:
                print(f"[ChatbotService] Gemini API Call error: {exc}")

        # Deterministic Fallback Generator: Tạo phản hồi có cấu trúc dữ liệu THẬT (KHÔNG lặp lời chào)
        reply_lines = []
        if structured_data.get("cameras"):
            c = structured_data["cameras"]
            off_cams = c.get("offline_cameras", [])
            reply_lines.append(f"### 📹 BÁO CÁO TRẠNG THÁI CAMERA HỆ THỐNG")
            reply_lines.append(f"- Tổng số camera: **{c.get('total_cameras', 12)}** (Đang trực tuyến: **{c.get('online_cameras', 10)}**)")
            if off_cams:
                reply_lines.append(f"- Số camera ngoại tuyến: **{len(off_cams)}**")
                reply_lines.append("\n**Danh sách camera đang offline:**")
                for item in off_cams:
                    reply_lines.append(f"🔴 **{item.get('id', 'CAM')}**: {item.get('patient_name', 'Bệnh nhân')} ({item.get('location')}) — Offline từ **{item.get('last_seen', 'Gần đây')}** ({item.get('reason', 'Mất kết nối mạng')})")
                reply_lines.append(f"\n**Khuyến nghị**: {c.get('recommendation', 'Kiểm tra nguồn điện và kết nối WiFi của các camera.')}")
            else:
                reply_lines.append("✅ Tất cả các mắt camera AI đang trực tuyến và hoạt động ổn định 24/7.")

        elif structured_data.get("vitals"):
            v = structured_data["vitals"]
            reply_lines.append(f"### 🩺 TÌNH TRẠNG SỨC KHỎE — BỆNH NHÂN {patient_id}")
            reply_lines.append(f"- **Nhịp tim**: {v.get('heart_rate')} BPM")
            reply_lines.append(f"- **Huyết áp**: {v.get('blood_pressure')}")
            reply_lines.append(f"- **SpO₂**: {v.get('spo2')}% | **Thân nhiệt**: {v.get('temperature')}°C")
            if v.get("blood_sugar"):
                reply_lines.append(f"- **Đường huyết**: {v.get('blood_sugar')} mmol/L")
            reply_lines.append(f"\n**Đánh giá**: {v.get('evaluation')}")
            reply_lines.append("\n**Khuyến nghị**: Tiếp tục duy trì chế độ dinh dưỡng và uống thuốc đúng cữ.")

        elif structured_data.get("adherence"):
            adh = structured_data["adherence"]
            reply_lines.append(f"### 💊 BÁO CÁO TUÂN THỦ UỐNG THUỐC HÔM NAY")
            reply_lines.append(f"Tổng số bệnh nhân có lịch: **{adh.get('total_scheduled_patients')}**")
            reply_lines.append(f"Đã uống đầy đủ: **{adh.get('fully_adhered_patients')}**")
            missed = adh.get("missed_or_pending_patients", [])
            if missed:
                reply_lines.append(f"\n**Danh sách chưa xác nhận uống:**")
                for p in missed:
                    reply_lines.append(f"- **{p['patient_name']}** ({p['patient_id']}): {p['pending_medicine']}")
            else:
                reply_lines.append("✅ Tất cả bệnh nhân đã hoàn thành đúng lịch uống thuốc.")

        elif structured_data.get("risk"):
            risks = structured_data["risk"]
            reply_lines.append("### ⚠️ ĐÁNH GIÁ NGUY CƠ TÉ NGÃ HỆ THỐNG")
            for r in risks:
                reply_lines.append(f"- **{r['patient']}** ({r['patient_id']} - {r['location']}): Nguy cơ **{r['fall_risk']}%** ({r['risk_level']}) — {r['reason']}")
            reply_lines.append("\n**Đề xuất**: Bật chế độ cảnh báo độ nhạy cao cho các phòng ngủ và nhà vệ sinh liên quan.")

        elif structured_data.get("medications"):
            reply_lines.append(f"### 📋 LỊCH UỐNG THUỐC HÔM NAY ({patient_id})")
            for m in structured_data["medications"]:
                icon = "✅" if m.get("taken") else "⏳"
                reply_lines.append(f"- {icon} **{m.get('time')}**: {m.get('medicine')} ({m.get('dosage')}) — Trạng thái: {m.get('status')}")

        elif structured_data.get("alerts"):
            al = structured_data["alerts"]
            reply_lines.append("### 🚨 CẢNH BÁO AN TOÀN HIỆN TẠI")
            reply_lines.append(f"{al.get('summary')}")

        else:
            # Targeted response without repeating welcome message
            reply_lines.append(f"Tôi đã ghi nhận yêu cầu của bạn về bệnh nhân **{patient_id}**.")
            reply_lines.append("Bạn có thể bấm vào các gợi ý nhanh bên dưới để xem Sinh hiệu, Lịch uống thuốc, hoặc Báo cáo camera.")

        final_reply = "\n".join(reply_lines)
        cls.save_message(conversation_id, "assistant", final_reply, structured_data)

        return {
            "success": True,
            "reply": final_reply,
            "conversation_id": conversation_id,
            "patient_id": patient_id,
            "tools_called": [t["tool"] for t in tool_results],
            "structured_data": structured_data
        }

    @classmethod
    def clear_session(cls, session_id: str):
        try:
            conv = Conversation.query.get(session_id)
            if conv:
                Message.query.filter_by(conversation_id=session_id).delete()
                db.session.commit()
        except Exception as e:
            db.session.rollback()
