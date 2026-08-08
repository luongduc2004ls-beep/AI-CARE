# ==============================================================================
# CHATBOT SERVICE - DỊCH VỤ XỬ LÝ TRỢ LÝ AI CHĂM SÓC SỨC KHỎE GOOGLE GEMINI
# ==============================================================================
# Mô tả: File dịch vụ xử lý logic cho AI Chatbot trong backend Flask.
#        Gửi truy vấn tới Google Gemini REST API, quản lý lịch sử hội thoại,
#        hỗ trợ tra cứu trực tiếp dữ liệu Bệnh nhân, Thân nhân/Người nhà, Bác sĩ, Thuốc y tế
#        và tự động cung cấp phản hồi thông minh khi API bị giới hạn ngạch.
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
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-8b"
    ]

    @classmethod
    def get_api_key(cls) -> str:
        return Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def get_model_name(cls) -> str:
        return Config.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    @classmethod
    def load_patients_data(cls) -> list:
        """
        Tải dữ liệu từ patientsFromExcel.json để tra cứu nhanh.
        """
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
            print(f"[ChatbotService] Load patients data error: {e}")
        return []

    @classmethod
    def search_database_entities(cls, query: str) -> str:
        """
        Tra cứu thông tin Bệnh nhân, Thân nhân/Người nhà, Bác sĩ và Thuốc y tế
        từ cơ sở dữ liệu AI CARE dựa trên từ khóa tìm kiếm của người dùng.
        """
        query_lower = query.lower().strip()
        patients = cls.load_patients_data()

        matched_patients = []
        
        # 1. Tìm theo mã bệnh nhân PAT100xx hoặc mã thiết bị D10xx
        pat_ids = re.findall(r'pat\d{5}', query_lower)
        dev_ids = re.findall(r'd\d{4}', query_lower)

        if pat_ids:
            target_id = pat_ids[0].upper()
            matched_patients = [p for p in patients if p.get("patient_id") == target_id]
        elif dev_ids:
            target_dev = dev_ids[0].upper()
            matched_patients = [p for p in patients if p.get("device_id") == target_dev]
        else:
            # 2. Tìm theo tên bệnh nhân, tên người nhà, tên bác sĩ, số điện thoại
            for p in patients:
                p_name = str(p.get("full_name", "")).lower()
                cg_name = str(p.get("caregiver_name", "")).lower()
                doc_name = str(p.get("doctor_name", "")).lower()
                p_id = str(p.get("patient_id", "")).lower()

                # Tách từ khóa tìm kiếm
                search_words = [w for w in query_lower.split() if len(w) >= 2 and w not in [
                    "bệnh", "nhân", "thông", "tin", "người", "nhà", "bác", "sĩ", "thân", "xem", "cho", "tôi", "tìm", "kiểm", "tra", "mã", "sĐT"
                ]]

                if search_words:
                    if any(w in p_name for w in search_words) or any(w in cg_name for w in search_words) or any(w in doc_name for w in search_words) or (p_id in query_lower):
                        if p not in matched_patients:
                            matched_patients.append(p)

        # 3. Tra cứu thuốc y tế
        medicine_info = []
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

        # Trả về danh sách mặc định nếu hỏi chung chung về danh sách bệnh nhân / người nhà / bác sĩ
        if not matched_patients and not medicine_info:
            if any(kw in query_lower for kw in ["danh sách", "bệnh nhân", "người nhà", "bác sĩ", "tất cả"]):
                matched_patients = patients[:3]

        if not matched_patients and not medicine_info:
            return ""

        result = ["📋 **DỮ LIỆU TRA CỨU CƠ SỞ DỮ LIỆU AI CARE:**"]

        if medicine_info:
            result.append("\n💊 **Thông tin Thuốc & Dược phẩm:**")
            for m in medicine_info:
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
            "Bạn là Trợ lý AI Chăm sóc Sức khỏe & Y tế chuyên nghiệp của hệ thống AI CARE dành cho người cao tuổi. "
            "Nhiệm vụ chính của bạn:\n"
            "1. Tư vấn sức khỏe, dinh dưỡng, lối sống lành mạnh cho người cao tuổi bằng giọng văn lịch sự, ấm áp, thân thiện.\n"
            "2. Tra cứu và cung cấp thông tin chính xác về Bệnh nhân, Thân nhân/Người nhà, Bác sĩ phụ trách và các loại Thuốc y tế khi được yêu cầu.\n"
            "3. Hướng dẫn cách dùng thuốc, giải thích công dụng thuốc và nhắc nhở lịch uống thuốc theo đơn chỉ định.\n"
            "4. Luôn luôn khuyên người dùng hoặc người nhà tham khảo ý kiến bác sĩ chuyên khoa đối với các triệu chứng nguy hiểm.\n"
            "5. Trả lời bằng Tiếng Việt rõ ràng, ngắn gọn, trình bày sạch đẹp theo định dạng Markdown."
        )

    @classmethod
    def sanitize_contents(cls, raw_contents: list) -> list:
        """
        Chuẩn hóa danh sách contents gửi tới Google Gemini API:
        1. Bỏ các turn 'model' ở đầu (Gemini API bắt buộc turn đầu tiên phải có role là 'user').
        2. Đảm bảo các turn luân phiên nghiêm ngặt giữa 'user' và 'model', loại bỏ trùng lặp liên tiếp.
        """
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
        Sinh phản hồi tư vấn y tế thông minh tự động dựa trên câu hỏi người dùng
        khi Gemini API gặp sự cố giới hạn ngạch truy vấn (429 Rate Limit) hoặc kết nối mạng.
        """
        db_search_res = cls.search_database_entities(user_message)
        if db_search_res:
            return db_search_res + "\n\n💡 *Bác/bạn có thể hỏi thêm về lịch uống thuốc, người chăm sóc hoặc thông tin chi tiết khác của bệnh nhân ạ!*"

        msg_lower = user_message.lower().strip()

        if any(kw in msg_lower for kw in ["chào", "hi", "hello", "bắt đầu", "là ai"]):
            return (
                "👋 **Xin chào! Tôi là Trợ lý AI Chăm sóc Sức khỏe AI CARE.**\n\n"
                "Tôi luôn sẵn sàng hỗ trợ bác và gia đình về:\n"
                "- 📋 **Tra cứu dữ liệu**: Bệnh nhân, Thân nhân/Người nhà, Bác sĩ phụ trách.\n"
                "- 💊 **Thông tin các loại thuốc**: Liều lượng, công dụng, lịch uống thuốc.\n"
                "- 🩺 **Theo dõi chỉ số sinh hiệu**: Huyết áp, Nhịp tim, SpO2, Đường huyết.\n"
                "- 🚨 **Cảnh báo an toàn**: Phòng ngừa té ngã và xử lý sự cố khẩn cấp.\n\n"
                "Bác/bạn đang cần tìm thông tin bệnh nhân, người nhà, bác sĩ hay loại thuốc nào ạ?"
            )

        if any(kw in msg_lower for kw in ["thuốc", "uống thuốc", "paracetamol", "amlodipine", "metformin", "losartan", "panadol", "aspirin"]):
            return (
                "💊 **Danh mục & Tư vấn Sử dụng Thuốc an toàn:**\n\n"
                "- **Amlodipine 5mg:** Thuốc hạ huyết áp, uống 1 viên/ngày vào buổi sáng.\n"
                "- **Metformin 850mg:** Thuốc kiểm soát đường huyết (Tiểu đường Type 2), uống 1 viên/ngày sau ăn.\n"
                "- **Losartan 50mg:** Thuốc hạ huyết áp & bảo vệ thận, uống 1 viên/ngày.\n"
                "- **Paracetamol / Panadol Extra:** Giảm đau, hạ sốt, uống 1 viên khi cần (>6h/lần).\n"
                "- **Aspirin 81mg:** Chống huyết khối tim mạch, uống 1 viên/ngày.\n\n"
                "⚠️ *Lưu ý: Luôn tuân thủ chỉ định của bác sĩ điều trị.*"
            )

        if any(kw in msg_lower for kw in ["huyết áp", "tim", "nhịp tim", "tăng huyết áp"]):
            return (
                "🩺 **Tư vấn Chỉ số Huyết áp & Tim mạch:**\n\n"
                "- **Mức huyết áp mục tiêu người cao tuổi:** **120/80 - 130/85 mmHg**.\n"
                "- **Khi huyết áp tăng cao (≥ 140/90 mmHg):** Nghỉ ngơi nơi yên tĩnh, thả lỏng cơ thể, dùng thuốc huyết áp theo chỉ định.\n"
                "- **Nhịp tim nghỉ ngơi bình thường:** **60 - 90 nhịp/phút**.\n\n"
                "🚨 **Dấu hiệu cần đi khám ngay:** Đau tức ngực, vã mồ hôi hột, chóng mặt dữ dội."
            )

        if any(kw in msg_lower for kw in ["tiểu đường", "đường huyết"]):
            return (
                "🩸 **Tư vấn Kiểm soát Đường huyết & Dinh dưỡng:**\n\n"
                "- **Đường huyết lúc đói chuẩn:** **70 - 130 mg/dL** (3.9 - 7.2 mmol/L).\n"
                "- **Chế độ ăn:** Hạn chế tinh bột chế biến sẵn; bổ sung nhiều chất xơ từ rau xanh, rau củ.\n"
                "- **Vận động:** Đi bộ nhẹ nhàng 20 - 30 phút sau bữa ăn."
            )

        return (
            "🩺 **Trợ lý AI Care Chăm sóc Sức khỏe:**\n\n"
            f"Cảm ơn câu hỏi của bác/bạn về: *'{user_message}'*.\n\n"
            "Tôi có thể hỗ trợ bác tra cứu:\n"
            "1. Tìm thông tin bệnh nhân theo tên hoặc mã (`PAT10000`, `PAT10001`...)\n"
            "2. Tra cứu thông tin người nhà, thân nhân, bác sĩ phụ trách\n"
            "3. Giải thích công dụng và hướng dẫn các loại thuốc y tế\n\n"
            "Bác/bạn hãy nhập tên bệnh nhân, tên thuốc hoặc mã hồ sơ để tôi tìm kiếm giúp bác nhé!"
        )

    @classmethod
    def process_chat(cls, user_message: str, session_id: str = "default_session", history: list = None) -> dict:
        """
        Xử lý tin nhắn chat từ Frontend gửi lên và gọi Gemini API để lấy câu trả lời.
        Tự động tra cứu cơ sở dữ liệu Bệnh nhân/Người nhà/Bác sĩ/Thuốc và bổ sung vào ngữ cảnh.
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

        # 1. Tra cứu dữ liệu thực tế từ cơ sở dữ liệu
        db_context = cls.search_database_entities(user_message)

        # Kiểm tra xem khóa API đã được cấu hình hay chưa
        if not api_key or api_key in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"):
            fallback_text = cls.get_smart_medical_fallback(user_message)
            return {
                "success": True,
                "reply": fallback_text + "\n\n*(ℹ️ Chế độ tư vấn y tế & Tra cứu tự động AI Care)*",
                "session_id": session_id,
                "error": None
            }

        # Xây dựng ngữ cảnh hội thoại từ history hoặc session
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

        # Tạo tin nhắn kèm dữ liệu tra cứu cơ sở dữ liệu nếu có
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
                "maxOutputTokens": 1500,
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

            except urllib.error.HTTPError:
                fallback_text = cls.get_smart_medical_fallback(user_message)
                return {
                    "success": True,
                    "reply": fallback_text + "\n\n*(ℹ️ Chế độ tư vấn & Tra cứu dữ liệu AI Care - Đã tối ưu tính sẵn sàng)*",
                    "session_id": session_id,
                    "error": None
                }

            except Exception:
                fallback_text = cls.get_smart_medical_fallback(user_message)
                return {
                    "success": True,
                    "reply": fallback_text + "\n\n*(ℹ️ Chế độ tư vấn & Tra cứu dữ liệu AI Care)*",
                    "session_id": session_id,
                    "error": None
                }

        fallback_text = cls.get_smart_medical_fallback(user_message)
        return {
            "success": True,
            "reply": fallback_text + "\n\n*(ℹ️ Chế độ tư vấn & Tra cứu dữ liệu AI Care)*",
            "session_id": session_id,
            "error": None
        }

    @classmethod
    def clear_session(cls, session_id: str) -> bool:
        if session_id in cls._sessions:
            del cls._sessions[session_id]
        return True
