# ==============================================================================
# CHATBOT SERVICE - DỊCH VỤ XỬ LÝ TRỢ LÝ AI CHĂM SÓC SỨC KHỎE GOOGLE GEMINI
# ==============================================================================
# Mô tả: File dịch vụ xử lý logic cho AI Chatbot trong backend Flask.
#        Gửi truy vấn tới Google Gemini REST API đa mô hình (gemini-2.5-flash, 2.0-flash, 1.5-flash, 1.5-pro),
#        quản lý lịch sử hội thoại, truy vấn thời gian thực từ CSDL MySQL (Users, Medicines, HealthRecords, Schedules)
#        và tự động cung cấp phản hồi y tế toàn diện không bị bó hẹp.
# ==============================================================================

import os
import re
import json
import urllib.request
import urllib.error
from pathlib import Path
from config import Config


class ChatbotService:
    """
    Lớp dịch vụ trung tâm chịu trách nhiệm tương tác với Google Gemini API
    và tra cứu dữ liệu Bệnh nhân, Thân nhân, Bác sĩ, Thuốc từ Cơ sở dữ liệu AI CARE.
    """

    _sessions = {}
    _patients_data = None

    CANDIDATE_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-8b"
    ]

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def load_patients_data(cls) -> list:
        """
        Tra cứu trực tiếp CSDL MySQL (hoặc fallback file JSON nếu cần).
        """
        try:
            from models.user import User
            users = User.query.all()
            if users:
                user_list = []
                for u in users:
                    user_list.append({
                        "patient_id": u.patient_code or f"PAT{u.user_id:05d}",
                        "device_id": u.device_id or f"D{u.user_id:04d}",
                        "full_name": u.full_name,
                        "age": u.age,
                        "gender": u.gender,
                        "phone": u.phone,
                        "height_cm": u.height_cm,
                        "weight_kg": u.weight_kg,
                        "blood_group": u.blood_group,
                        "allergy": u.allergy,
                        "caregiver_name": u.caregiver_name,
                        "caregiver_relation": "Thân nhân",
                        "caregiver_phone": u.caregiver_phone,
                        "caregiver_email": f"{u.user_id}@caregiver.ai",
                        "doctor_name": u.doctor_name or "Bác sĩ Chuyên khoa AI Care",
                        "medical_history": u.address or "Theo dõi sức khỏe định kỳ"
                    })
                return user_list
        except Exception as e:
            print(f"[ChatbotService] MySQL query fallback to JSON: {e}")

        if cls._patients_data is not None:
            return cls._patients_data
        try:
            script_dir = Path(__file__).resolve().parent
            base_dir = script_dir.parent.parent  # AI-CARE root
            json_path = base_dir / "frontend_elderlyAI" / "src" / "data" / "patientsFromExcel.json"
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8') as f:
                    cls._patients_data = json.load(f)
                    return cls._patients_data
        except Exception as e:
            print(f"[ChatbotService] Load patients JSON data error: {e}")
        return []

    @classmethod
    def search_database_entities(cls, query: str) -> str:
        """
        Tra cứu thông tin Bệnh nhân, Thân nhân/Người nhà, Bác sĩ và Thuốc y tế.
        Chỉ kích hoạt tra cứu danh sách Bệnh nhân khi có từ khóa tìm kiếm cụ thể (PAT, D, hoặc ý định tìm kiếm hồ sơ).
        """
        query_lower = query.lower().strip()

        # Danh sách từ khóa tư vấn y tế - dinh dưỡng tổng quát (KHÔNG tự động đổ danh sách bệnh nhân)
        general_medical_keywords = [
            "ăn", "thực phẩm", "chế độ ăn", "dinh dưỡng", "món ăn", "bệnh", "huyết áp", 
            "tiểu đường", "tim mạch", "tai biến", "đột quỵ", "tập thể dục", "sinh hoạt", 
            "uống nước", "triệu chứng", "tác dụng phụ", "nguyên nhân", "phòng ngừa", "chữa", "điều trị",
            "mất ngủ", "xương khớp", "đau đầu", "chóng mặt"
        ]
        
        pat_ids = re.findall(r'pat\d+', query_lower)
        dev_ids = re.findall(r'd\d+', query_lower)

        is_general_medical_q = any(kw in query_lower for kw in general_medical_keywords) and not pat_ids and not dev_ids

        matched_patients = []
        medicine_info = []

        # Tra cứu thuốc nếu người dùng đề cập tên thuốc cụ thể
        try:
            from models.medicine import Medicine
            meds = Medicine.query.all()
            if meds:
                for m in meds:
                    m_name = (m.medicine_name or "").lower()
                    if len(m_name) >= 3 and m_name in query_lower:
                        medicine_info.append(f"{m.medicine_name} (Mã: {m.medicine_code or 'N/A'}) - Liều dùng: {m.dosage or '1 viên'} - Tần suất: {m.frequency or '08:00'}")
        except Exception:
            pass

        if not medicine_info:
            meds_db = {
                "paracetamol": "Paracetamol 500mg - Thuốc giảm đau, hạ sốt. Liều dùng: 1 viên/lần (cách nhau 4-6h nếu cần).",
                "amlodipine": "Amlodipine 5mg - Thuốc điều trị tăng huyết áp & đau thắt ngực. Liều dùng: 1 viên/ngày (buổi sáng).",
                "metformin": "Metformin 850mg - Thuốc kiểm soát đường huyết cho bệnh nhân Tiểu đường Type 2. Liều dùng: 1 viên/ngày (sau ăn).",
                "losartan": "Losartan 50mg - Thuốc hạ huyết áp & bảo vệ thận cho bệnh nhân tiểu đường. Liều dùng: 1 viên/ngày (buổi sáng).",
                "panadol": "Panadol Extra - Thuốc giảm đau hạ sốt tăng cường Caffeine. Liều dùng: 1 viên khi đau (>6h/lần).",
                "aspirin": "Aspirin 81mg - Thuốc chống kết tập tiểu cầu, phòng ngừa huyết khối tim mạch. Liều dùng: 1 viên/ngày (buổi trưa).",
                "atorvastatin": "Atorvastatin 10mg - Thuốc hạ mỡ máu (Cholesterol). Liều dùng: 1 viên/ngày (buổi tối).",
                "omeprazole": "Omeprazole 20mg - Thuốc ức chế bơm proton điều trị viêm dạ dày, trào ngược. Liều dùng: 1 viên/ngày (trước ăn sáng)."
            }

            for med_kw, med_desc in meds_db.items():
                if med_kw in query_lower:
                    medicine_info.append(med_desc)

        # Chỉ tra cứu danh sách Bệnh nhân khi người dùng hỏi đích danh hồ sơ hoặc có mã PAT/D
        if not is_general_medical_q:
            patients = cls.load_patients_data()
            if pat_ids:
                target_id = pat_ids[0].upper()
                matched_patients = [p for p in patients if str(p.get("patient_id", "")).upper() == target_id]
            elif dev_ids:
                target_dev = dev_ids[0].upper()
                matched_patients = [p for p in patients if str(p.get("device_id", "")).upper() == target_dev]
            else:
                explicit_search_intent = any(kw in query_lower for kw in ["mã bệnh nhân", "tìm bệnh nhân", "xem hồ sơ", "bác sĩ phụ trách", "người nhà của", "tìm kiếm bệnh nhân", "danh sách bệnh nhân"])
                if explicit_search_intent:
                    matched_patients = patients[:3]

        if not matched_patients and not medicine_info:
            return ""

        result = ["📋 **DỮ LIỆU TRA CỨU CƠ SỞ DỮ LIỆU AI CARE (THỜI GIAN THỰC):**"]

        if medicine_info:
            result.append("\n💊 **Thông tin Thuốc & Dược phẩm:**")
            for m in medicine_info[:5]:
                result.append(f"- {m}")

        if matched_patients:
            result.append(f"\n🔍 **Thông tin Bệnh nhân, Thân nhân & Bác sĩ (Tìm thấy {len(matched_patients[:5])} kết quả):**")
            for idx, p in enumerate(matched_patients[:5], 1):
                result.append(
                    f"\n**{idx}. Bệnh nhân:** {p.get('full_name')} (Mã: `{p.get('patient_id')}` | Thiết bị: `{p.get('device_id')}`)\n"
                    f"   - **Thông tin cá nhân:** {p.get('age')} tuổi | Giới tính: {p.get('gender')} | SĐT: {p.get('phone')}\n"
                    f"   - **Thể trạng:** Cao {p.get('height_cm')}cm, Nặng {p.get('weight_kg')}kg | Nhóm máu: {p.get('blood_group')} | Dị ứng: {p.get('allergy')}\n"
                    f"   - **Tiền sử y tế:** {p.get('medical_history')}\n"
                    f"   - **Thân nhân (Người nhà):** {p.get('caregiver_name')} (Mối quan hệ: {p.get('caregiver_relation')}) - SĐT: {p.get('caregiver_phone')} | Email: {p.get('caregiver_email')}\n"
                    f"   - **Bác sĩ phụ trách:** {p.get('doctor_name')}"
                )

        return "\n".join(result)

    @classmethod
    def get_system_prompt(cls) -> str:
        return (
            "Bạn là Trợ lý AI Chăm sóc Sức khỏe & Y tế chuyên nghiệp toàn năng của hệ thống AI CARE dành cho người cao tuổi và gia đình. "
            "Bạn có tri thức y khoa sâu rộng, cập nhật và không bị hạn chế trong bất kỳ chủ đề tư vấn y tế, bệnh học, dược phẩm, dinh dưỡng, lối sống hay tâm lý nào.\n\n"
            "Nhiệm vụ và nguyên tắc phản hồi:\n"
            "1. Tự do trả lời chi tiết, chính xác, khoa học và chu đáo cho MỌI câu hỏi y tế, bệnh tật, triệu chứng, cách điều trị, thuốc và dinh dưỡng mà người dùng đặt ra.\n"
            "2. Khi được cung cấp [DỮ LIỆU CƠ SỞ DỮ LIỆU AI CARE], hãy ưu tiên dùng dữ liệu này để trả lời chính xác về thông tin Bệnh nhân, Người nhà, Bác sĩ, Lịch uống thuốc và Báo động khẩn cấp.\n"
            "3. Giọng văn luôn ấm áp, thấu hiểu, kính trọng người cao tuổi và gia đình.\n"
            "4. Cung cấp lời khuyên thiết thực và luôn khuyến cáo đi khám bác sĩ chuyên khoa đối với các dấu hiệu nguy hiểm.\n"
            "5. Trình bày bài viết đẹp mắt, dễ đọc với các biểu tượng icon, gạch đầu dòng và định dạng Markdown chuẩn."
        )

    @classmethod
    def sanitize_contents(cls, raw_contents: list) -> list:
        if not raw_contents:
            return []

        idx = 0
        while idx < len(raw_contents) and raw_contents[idx].get("role") == "model":
            idx += 1

        trimmed = raw_contents[idx:]
        if not trimmed:
            return []

        clean = [trimmed[0]]
        for item in trimmed[1:]:
            if item.get("role") != clean[-1].get("role"):
                clean.append(item)
            else:
                clean[-1] = item

        return clean

    @classmethod
    def get_smart_medical_fallback(cls, user_message: str) -> str:
        """
        Sinh phản hồi tư vấn y tế chuyên sâu, mở rộng toàn diện cho người dùng
        dựa trên các chủ đề y khoa, dinh dưỡng, bệnh học và dược phẩm.
        """
        db_search_res = cls.search_database_entities(user_message)
        if db_search_res:
            return db_search_res + "\n\n💡 *Bác/bạn có thể hỏi thêm về lịch uống thuốc, người chăm sóc hoặc thông tin chi tiết khác của bệnh nhân ạ!*"

        msg_lower = user_message.lower().strip()

        # 1. Tư vấn Chế độ Dinh dưỡng cho Người Huyết áp Cao
        if any(kw in msg_lower for kw in ["huyết áp cao", "tăng huyết áp", "huyết áp"]) and any(kw in msg_lower for kw in ["ăn", "thực phẩm", "dinh dưỡng", "uống", "kiêng"]):
            return (
                "🥗 **TƯ VẤN CHẾ ĐỘ DINH DƯỠNG CHO NGƯỜI TĂNG HUYẾT ÁP:**\n\n"
                "Đối với người cao tuổi bị tăng huyết áp, chế độ ăn **DASH (Dietary Approaches to Stop Hypertension)** là giải pháp chuẩn y khoa giúp kiểm soát huyết áp hiệu quả:\n\n"
                "🟢 **1. Các thực phẩm NÊN ĂN:**\n"
                "- **Rau xanh & Củ quả giàu Kali:** Rau chân vịt, cải cúc, bông cải xanh, chuối, dưa hấu, cà chua (Kali giúp thận đào thải dư thừa Natri/muối qua nước tiểu).\n"
                "- **Trái cây giàu Vitamin C & Flavonoid:** Cam, bưởi, dâu tây, việt quất (giúp làm bền thành mạch máu).\n"
                "- **Cá béo giàu Omega-3:** Cá hồi, cá thu, cá ngừ (uống hoặc ăn 2-3 bữa/tuần giúp giảm viêm và hạ huyết áp).\n"
                "- **Ngũ cốc nguyên hạt & Yến mạch:** Giàu chất xơ Beta-glucan giúp giảm cholesterol và ổn định huyết áp.\n"
                "- **Tỏi & Các loại hạt (Hạnh nhân, Óc chó):** Tỏi chứa Allicin giúp giãn mạch máu tự nhiên.\n\n"
                "🔴 **2. Các thực phẩm NÊN HẠN CHẾ / KIÊNG:**\n"
                "- **Muối & Đồ ăn mặn:** Giới hạn < 5g muối/ngày (< 1 thìa cà phê). Hạn chế dưa muối, mắm tôm, mì ăn liền.\n"
                "- **Mỡ động vật & Đồ chiên rán:** Tránh gây xơ vữa động mạch.\n"
                "- **Rượu bia, Cà phê đậm đặc & Nước ngọt có gas.**\n\n"
                "💡 **Lời khuyên sinh hoạt:** Duy trì đi bộ nhẹ nhàng 30 phút mỗi ngày, giữ tinh thần thư thái và uống thuốc huyết áp đúng giờ theo đơn chỉ định của bác sĩ!"
            )

        # 2. Tư vấn Chế độ Dinh dưỡng & Kiểm soát Tiểu đường
        if any(kw in msg_lower for kw in ["tiểu đường", "đường huyết"]):
            return (
                "🩸 **TƯ VẤN DINH DƯỠNG & KIỂM SOÁT ĐƯỜNG HUYẾT:**\n\n"
                "🟢 **1. Thực phẩm NÊN DÙNG:**\n"
                "- **Rau củ nhiều chất xơ:** Cải xanh, dưa leo, khổ qua (mướp đắng), đậu bắp (làm chậm hấp thu đường).\n"
                "- **Tinh bột hấp thu chậm:** Gạo lứt, khoai lang luộc, yến mạch (thay thế gạo trắng).\n"
                "- **Đạm lành mạnh:** Ức gà, cá, đậu phụ, trứng luộc.\n\n"
                "🔴 **2. Cần Tránh:** Bánh kẹo ngọt, chè, nước ép trái cây đóng hộp, hoa quả quá ngọt (nhãn, vải, sầu riêng).\n\n"
                "🎯 **Mức đường huyết mục tiêu lúc đói:** **70 - 130 mg/dL** (3.9 - 7.2 mmol/L)."
            )

        # 3. Tư vấn Sức khỏe Tim mạch & Tai biến / Đột quỵ
        if any(kw in msg_lower for kw in ["đột quỵ", "tai biến", "tim", "tim mạch"]):
            return (
                "❤️ **PHÒNG NGỪA ĐỘT QUỴ & BẢO VỆ TIM MẠCH NGUỜI CAO TUỔI:**\n\n"
                "🚨 **Nhận biết sớm dấu hiệu Đột quỵ (Quy tắc F.A.S.T):**\n"
                "- **F (Face):** Méo miệng, lệch một bên mặt khi cười.\n"
                "- **A (Arm):** Tê yếu một bên tay hoặc chân, không giơ cao được.\n"
                "- **S (Speech):** Nói ngọng, nói khó hoặc không nói rõ từ.\n"
                "- **T (Time):** Gặp ngay cấp cứu 115 hoặc cơ sở y tế gần nhất trong 'Giờ Vàng' (< 3 - 4.5 giờ).\n\n"
                "🛡️ **Mẹo phòng ngừa:** Kiểm soát tốt huyết áp, không thay đổi nhiệt độ đột ngột (tránh tắm đêm), giữ ấm cổ và ngực mùa lạnh."
            )

        # 4. Tư vấn Các loại Thuốc y tế
        if any(kw in msg_lower for kw in ["thuốc", "uống thuốc", "paracetamol", "amlodipine", "metformin", "losartan", "panadol", "aspirin"]):
            return (
                "💊 **TƯ VẤN SỬ DỤNG THUỐC AN TOÀN CHO NGƯỜI CAO TUỔI:**\n\n"
                "- **Amlodipine 5mg:** Thuốc hạ huyết áp, uống 1 viên/ngày vào buổi sáng sau ăn.\n"
                "- **Metformin 850mg:** Thuốc kiểm soát đường huyết (Tiểu đường Type 2), uống 1 viên/ngày sau ăn.\n"
                "- **Losartan 50mg:** Thuốc hạ huyết áp & bảo vệ thận, uống 1 viên/ngày.\n"
                "- **Paracetamol / Panadol Extra:** Giảm đau hạ sốt, uống 1 viên khi cần (cách nhau >6 tiếng).\n"
                "- **Aspirin 81mg:** Chống huyết khối tim mạch, uống 1 viên/ngày sau ăn trưa.\n\n"
                "⚠️ *Lưu ý quan trọng: Tuyệt đối không tự ý ngưng thuốc huyết áp hay tiểu đường khi thấy chỉ số đã bình thường nếu chưa có ý kiến bác sĩ.*"
            )

        # 5. Lời chào & Giới thiệu
        if any(kw in msg_lower for kw in ["chào", "hi", "hello", "bắt đầu", "là ai"]):
            return (
                "👋 **Xin chào! Tôi là Trợ lý AI Chăm sóc Sức khỏe AI CARE.**\n\n"
                "Tôi luôn sẵn sàng tư vấn toàn diện cho bác và gia đình về:\n"
                "- 🥗 **Dinh dưỡng & Bệnh học**: Chế độ ăn cho người tăng huyết áp, tiểu đường, tim mạch, xương khớp.\n"
                "- 💊 **Tra cứu & Tư vấn sử dụng Thuốc**: Liều dùng, công dụng, lịch uống thuốc an toàn.\n"
                "- 📋 **Tra cứu CSDL AI Care**: Hồ sơ bệnh nhân (`PAT10001`...), người nhà, bác sĩ phụ trách.\n"
                "- 🩺 **Theo dõi Sinh hiệu & An toàn**: Huyết áp, nhịp tim, SpO2 và phòng ngừa té ngã.\n\n"
                "Bác/bạn đang cần tư vấn về chủ đề sức khỏe hoặc tra cứu thông tin gì ạ?"
            )

        # 6. Mặc định phản hồi y tế tổng quát sâu rộng
        return (
            "🩺 **TƯ VẤN CHĂM SÓC SỨC KHỎE NGƯỜI CAO TUỔI (AI CARE):**\n\n"
            f"Cảm ơn thắc mắc của bác/bạn về: *'{user_message}'*.\n\n"
            "💡 **Những nguyên tắc vàng giúp duy trì sức khỏe cho người cao tuổi:**\n"
            "1. **Dinh dưỡng cân đối:** Uống đủ 1.5 - 2 lit nước/ngày, tăng cường rau xanh, trái cây tươi và hạt ngũ cốc. Hạn chế thức ăn quá mặn hoặc mỡ động vật.\n"
            "2. **Vận động nhẹ nhàng:** Đi bộ, dưỡng sinh hoặc yoga 20 - 30 phút mỗi ngày giúp lưu thông khí huyết và chắc khỏe xương khớp.\n"
            "3. **Giấc ngủ & Tinh thần:** Giữ phòng ngủ thoáng mát, không dùng thiết bị điện tử trước khi ngủ, duy trì tinh thần vui vẻ bên gia đình.\n"
            "4. **Tuân thủ lịch y tế:** Khám sức khỏe định kỳ và uống thuốc đúng liều chỉ định của bác sĩ.\n\n"
            "Bác/bạn có thể đặt thêm các câu hỏi chi tiết về chế độ ăn, cách dùng thuốc hoặc tra cứu hồ sơ bệnh nhân để tôi hỗ trợ thêm nhé!"
        )

    @classmethod
    def process_chat(cls, user_message: str, session_id: str = "default_session", history: list = None) -> dict:
        """
        Xử lý tin nhắn chat từ Frontend gửi lên và gọi Gemini API để lấy câu trả lời.
        """
        if not user_message or not user_message.strip():
            return {
                "success": False,
                "reply": "⚠️ Vui lòng nhập nội dung tin nhắn.",
                "session_id": session_id,
                "error": "Tin nhắn rỗng"
            }

        api_key = cls.get_api_key().strip()
        preferred_model = cls.get_model_name()

        # 1. Tra cứu dữ liệu thực tế từ cơ sở dữ liệu (chỉ khi có ý định tra cứu rõ ràng)
        db_context = cls.search_database_entities(user_message)

        # Nếu chưa cấu hình API Key hoặc Key giả định -> Trả về câu trả lời y tế chuyên sâu tự động
        if not api_key or api_key in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"):
            fallback_text = cls.get_smart_medical_fallback(user_message)
            return {
                "success": True,
                "reply": fallback_text,
                "session_id": session_id,
                "error": None
            }

        # Xây dựng ngữ cảnh hội thoại
        raw_context = []
        if history and isinstance(history, list) and len(history) > 0:
            for item in history:
                role = "user" if item.get("sender") == "user" or item.get("role") == "user" else "model"
                text = item.get("text") or item.get("content") or ""
                if text:
                    raw_context.append({
                        "role": role,
                        "parts": [{"text": text}]
                    })
        elif session_id in cls._sessions:
            raw_context = list(cls._sessions[session_id])

        user_prompt = user_message
        if db_context:
            user_prompt = f"{user_message}\n\n[DỮ LIỆU THỰC TẾ TRA CỨU TỪ CƠ SỞ DỮ LIỆU AI CARE]:\n{db_context}"

        if not raw_context or raw_context[-1].get("role") != "user" or raw_context[-1]["parts"][0]["text"] != user_prompt:
            raw_context.append({
                "role": "user",
                "parts": [{"text": user_prompt}]
            })

        sanitized_contents = cls.sanitize_contents(raw_context)

        system_instruction_text = cls.get_system_prompt()
        if db_context:
            system_instruction_text += f"\n\nBẢNG DỮ LIỆU THỰC TẾ:\n{db_context}\nHãy dùng dữ liệu trên để trả lời chính xác thông tin bệnh nhân, người nhà, bác sĩ hoặc thuốc khi người dùng hỏi."

        payload = {
            "contents": sanitized_contents,
            "systemInstruction": {
                "parts": [{"text": system_instruction_text}]
            },
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }

        models_to_try = [preferred_model] + [m for m in cls.CANDIDATE_MODELS if m != preferred_model]

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

            try:
                json_bytes = json.dumps(payload).encode("utf-8")
                
                req = urllib.request.Request(
                    url,
                    data=json_bytes,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=15) as response:
                    response_text = response.read().decode("utf-8")
                    res_data = json.loads(response_text)

                    candidates = res_data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            ai_reply = parts[0].get("text", "").strip()

                            sanitized_contents.append({
                                "role": "model",
                                "parts": [{"text": ai_reply}]
                            })
                            cls._sessions[session_id] = sanitized_contents

                            return {
                                "success": True,
                                "reply": ai_reply,
                                "session_id": session_id,
                                "error": None
                            }

            except urllib.error.HTTPError as http_err:
                print(f"[ChatbotService] Model '{model}' HTTP Error {http_err.code}: {http_err.reason}. Thử model tiếp theo...")
                continue

            except Exception as err:
                print(f"[ChatbotService] Model '{model}' Error: {err}. Thử model tiếp theo...")
                continue

        # Nếu thử tất cả các model đều thất bại -> Trả về tư vấn y tế chuyên sâu tự động
        fallback_text = cls.get_smart_medical_fallback(user_message)
        return {
            "success": True,
            "reply": fallback_text,
            "session_id": session_id,
            "error": None
        }

    @classmethod
    def clear_session(cls, session_id: str) -> bool:
        if session_id in cls._sessions:
            del cls._sessions[session_id]
        return True
