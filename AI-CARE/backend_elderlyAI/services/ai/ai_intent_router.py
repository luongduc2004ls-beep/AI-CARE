# ==============================================================================
# AI INTENT ROUTER - BỘ ĐIỀU HƯỚNG Ý ĐỊNH LÂM SÀNG & CSDL (AI_INTENT_ROUTER.PY)
# ==============================================================================
# Phân loại rõ ràng 5 nhóm câu hỏi:
# 1. GENERAL_MEDICAL: Kiến thức y khoa phổ quát (Dinh dưỡng, Huyết áp, Tiểu đường, Đột quỵ, Dược lý)
# 2. PATIENT_DATA: Dữ liệu hồ sơ bệnh nhân thực tế trong CSDL
# 3. MIXED_MEDICAL_DATABASE: Kết hợp dữ liệu bệnh nhân cụ thể + Tri thức y khoa
# 4. DATABASE_SEARCH vs DATABASE_COUNT: Phân biệt rõ Danh sách bệnh nhân (kèm phân trang) và Đếm số lượng
# 5. SYSTEM_STATISTICS: Báo cáo điều hành tổng thể toàn viện
# ==============================================================================

import re
import unicodedata
from typing import Dict, Any


def strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để so khớp từ khóa linh hoạt."""
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0300-\u036f]", "", text)
    return text.replace("đ", "d").replace("Đ", "D")


class AIIntentRouter:
    """
    Bộ phân tích và định tuyến câu hỏi tự nhiên thành Intent và Filter có cấu trúc.
    """

    @classmethod
    def detect_intent(cls, message: str) -> Dict[str, Any]:
        msg = (message or "").strip()
        q_norm = strip_accents(msg).lower()

        # 0. Kiểm tra yêu cầu phân trang (Pagination / Hiển thị tiếp)
        if any(k in q_norm for k in ["hien thi tiep", "xem tiep", "trang tiep", "tiep theo", "hien thi tat ca", "xem them"]):
            return {
                "intent": "PAGINATION_NEXT",
                "raw_query": msg
            }

        # 1. Trích xuất mã bệnh nhân dạng PATxxxxx hoặc số nguyên
        patient_code_match = re.search(r"\bPAT\d+\b", msg, re.IGNORECASE)
        extracted_code = patient_code_match.group(0).upper() if patient_code_match else None

        # 2. Xử lý câu hỏi có chứa Mã Bệnh Nhân Cụ Thể (PATxxxxx)
        if extracted_code:
            # 2.1 Câu hỏi kết hợp (Mixed Query: PATxxxxx + Tư vấn y khoa / Dinh dưỡng / Dược lý)
            is_mixed_med = any(k in q_norm for k in [
                "nen an gi", "kieng gi", "an uong the nao", "dinh duong", "che do an", "sinh hoat the nao",
                "co tac dung gi", "tac dung phu", "nguy hiem khong", "co sao khong", "co binh thuong khong",
                "y nghia gi", "dieu nay co y nghia gi", "nen cham soc the nao", "nen lam gi", "xu tri the nao"
            ])
            if is_mixed_med:
                return {
                    "intent": "MIXED_MEDICAL_DATABASE",
                    "patient_id": extracted_code,
                    "raw_query": msg
                }

            # 2.2 Thuốc & Lịch uống thuốc của bệnh nhân
            if any(k in q_norm for k in ["thuoc", "uong", "lieu", "don thuoc", "lich uong", "cung thuoc"]):
                return {"intent": "PATIENT_MEDICATION", "patient_id": extracted_code, "raw_query": msg}
            # 2.3 Sinh hiệu & Sức khỏe của bệnh nhân
            elif any(k in q_norm for k in ["suc khoe", "huyet ap", "sinh hieu", "nhip tim", "spo2", "than nhiet", "chi so"]):
                return {"intent": "PATIENT_HEALTH", "patient_id": extracted_code, "raw_query": msg}
            # 2.4 Camera của bệnh nhân
            elif any(k in q_norm for k in ["camera", "phong", "giam sat"]):
                return {"intent": "PATIENT_CAMERA", "patient_id": extracted_code, "raw_query": msg}
            # 2.5 Cảnh báo / Nguy cơ té ngã của bệnh nhân
            elif any(k in q_norm for k in ["nga", "te", "canh bao", "su co", "nguy co"]):
                return {"intent": "PATIENT_ALERTS", "patient_id": extracted_code, "raw_query": msg}
            else:
                return {"intent": "PATIENT_PROFILE", "patient_id": extracted_code, "raw_query": msg}

        # 3. Phân loại KIẾN THỨC Y KHOA TỔNG QUÁT (GENERAL MEDICAL KNOWLEDGE)
        # Các mẫu câu hỏi y học thuần túy (không gắn với mã bệnh nhân)
        general_medical_patterns = [
            "nen an gi", "kieng an gi", "han che gi", "thuc pham", "dinh duong",
            "sinh hoat the nao", "che do sinh hoat", "tap the duc bao lau", "bai tap",
            "mat ngu", "kho ngu", "uong bao nhieu nuoc", "luong nuoc", "co nen an man",
            "dau hieu canh bao dot quy", "dau hieu dot quy", "trieu chung dot quy", "quy tac fast",
            "day bung", "kho tieu", "la thuoc gi", "tac dung cua thuoc", "cong dung cua",
            "ha duong huyet", "tang duong huyet", "ha huyet ap", "tang huyet ap"
        ]
        is_asking_general_medical = any(k in q_norm for k in general_medical_patterns)
        
        # Nếu hỏi về bệnh lý tổng quát (ví dụ: "Bệnh nhân tiểu đường nên ăn gì?", "Người bị huyết áp cao...")
        if is_asking_general_medical or (
            any(d in q_norm for d in ["tieu duong", "huyet ap", "day bung", "mat ngu", "dot quy", "tim mach", "tai bien", "copd"]) and
            any(w in q_norm for w in ["nen", "an gi", "uong gi", "lam gi", "the nao", "bao lau", "nhu the nao", "cach", "huong dan", "la gi", "dau hieu"])
        ):
            # Xác định chủ đề y học
            topic = "GENERAL_ADVICE"
            if "tieu duong" in q_norm or "duong huyet" in q_norm:
                topic = "DIABETES_NUTRITION"
            elif "huyet ap" in q_norm or "tim mach" in q_norm or "an man" in q_norm:
                topic = "HYPERTENSION_LIFESTYLE"
            elif "day bung" in q_norm or "kho tieu" in q_norm or "tieu hoa" in q_norm:
                topic = "DIGESTION_NUTRITION"
            elif "dot quy" in q_norm or "tai bien" in q_norm or "fast" in q_norm:
                topic = "STROKE_EMERGENCY"
            elif "mat ngu" in q_norm or "giac ngu" in q_norm:
                topic = "SLEEP_CARE"
            elif "tap the duc" in q_norm or "van dong" in q_norm:
                topic = "EXERCISE_PHYSICAL"
            elif "nuoc" in q_norm or "uong nuoc" in q_norm:
                topic = "HYDRATION_GUIDE"
            elif any(m in q_norm for m in ["amlodipine", "omeprazole", "atorvastatin", "losartan", "metformin", "paracetamol"]):
                topic = "PHARMACOLOGY_GUIDE"

            return {
                "intent": "GENERAL_MEDICAL",
                "topic": topic,
                "raw_query": msg
            }

        # 4. Phân loại tra cứu NGUY CƠ TÉ NGÃ: Phân biệt rõ COUNT vs SEARCH/LIST
        fall_risk_keywords = [
            "nguy co te nga", "nguy co nga", "te nga cao", "risk cao", "nguy co cao",
            "kha nang nga", "kha nang nga cao", "de bi nga", "nga nhieu", "de nga",
            "co kha nang nga", "co nguy co nga"
        ]
        if any(k in q_norm for k in fall_risk_keywords):
            # Nếu người dùng hỏi đếm số lượng (COUNT)
            is_count = any(k in q_norm for k in ["co bao nhieu", "bao nhieu benh nhan", "so luong", "dem so", "thong ke so"])
            return {
                "intent": "FALL_RISK_COUNT" if is_count else "FALL_RISK_SEARCH",
                "filter_type": "FALL_RISK",
                "risk_level": "Cao",
                "is_count": is_count,
                "raw_query": msg
            }

        # 5. Phân loại tra cứu DỊ ỨNG (ALLERGY SEARCH)
        if any(k in q_norm for k in ["di ung", "allergy", "phan hoa", "penicillin", "hai san", "khang sinh"]):
            allergy_kw = "Phấn hoa"
            if "phan hoa" in q_norm:
                allergy_kw = "Phấn hoa"
            elif "penicillin" in q_norm:
                allergy_kw = "Penicillin"
            elif "hai san" in q_norm:
                allergy_kw = "Hải sản"
            elif "khang sinh" in q_norm:
                allergy_kw = "Kháng sinh"
            else:
                allergy_clean = re.sub(r".*?(?:di ung|allergy)\s*(?:voi|la|ve)?\s*", "", q_norm).strip()
                allergy_kw = allergy_clean if len(allergy_clean) >= 2 else "Phấn hoa"

            is_count = any(k in q_norm for k in ["co bao nhieu", "bao nhieu benh nhan", "so luong"])
            return {
                "intent": "ALLERGY_SEARCH",
                "filter_type": "ALLERGY",
                "allergy": allergy_kw,
                "is_count": is_count,
                "raw_query": msg
            }

        # 6. Phân loại tra cứu TRẠNG THÁI UỐNG THUỐC (CHƯA UỐNG THUỐC)
        if any(k in q_norm for k in ["chua uong thuoc", "quen thuoc", "quen uong", "chua uong", "chua dung thuoc", "ai chua uong"]):
            is_count = any(k in q_norm for k in ["co bao nhieu", "bao nhieu benh nhan", "so luong"])
            return {
                "intent": "MEDICATION_PENDING_SEARCH",
                "filter_type": "MEDICATION_STATUS",
                "medication_status": "Chưa uống",
                "is_count": is_count,
                "raw_query": msg
            }

        # 7. Phân loại tra cứu BỆNH LÝ / BỆNH ÁN CSDL (DISEASE SEARCH)
        known_diseases = [
            ("tang huyet ap", "Tăng huyết áp"),
            ("mach vanh", "Bệnh mạch vành"),
            ("copd", "Bệnh phổi tắc nghẽn (COPD)"),
            ("tieu duong", "Đái tháo đường"),
            ("tai bien", "Tai biến"),
            ("dot quy", "Đột quỵ")
        ]
        for dis_key, dis_val in known_diseases:
            if dis_key in q_norm and any(w in q_norm for w in ["benh nhan", "nhung", "danh sach", "tim", "ai bi", "ai mac", "co bao nhieu"]):
                is_count = any(k in q_norm for k in ["co bao nhieu", "bao nhieu benh nhan", "so luong"])
                return {
                    "intent": "DISEASE_SEARCH",
                    "filter_type": "DISEASE",
                    "disease": dis_val,
                    "is_count": is_count,
                    "raw_query": msg
                }

        # 8. Phân loại tra cứu CAMERA (CAMERA STATUS / SEARCH)
        if "camera" in q_norm:
            is_offline = any(k in q_norm for k in ["offline", "mat ket noi", "mat tin hieu", "hong", "tat", "ngoai tuyen"])
            is_count = any(k in q_norm for k in ["co bao nhieu", "bao nhieu camera", "so luong"])
            return {
                "intent": "CAMERA_SEARCH",
                "status": "OFFLINE" if is_offline else None,
                "is_count": is_count,
                "raw_query": msg
            }

        # 9. Phân loại BÁO CÁO TOÀN HỆ THỐNG (SYSTEM STATISTICS)
        if any(k in q_norm for k in ["tong so benh nhan", "bao cao he thong", "thong ke he thong", "tong quan toan vien", "bao cao tong quan", "thong ke toan vien"]):
            return {
                "intent": "SYSTEM_STATISTICS",
                "raw_query": msg
            }

        # 10. Tìm kiếm bệnh nhân theo Tên / Danh sách chung
        if any(k in q_norm for k in ["tim", "search", "danh sach", "loc", "tra cuu", "thong tin benh nhan", "ho so", "benh nhan", "nhung benh nhan", "tat ca benh nhan"]):
            name_candidate = re.sub(r"(?:tìm|tim|search|những bệnh nhân|nhung benh nhan|tất cả bệnh nhân|tat ca benh nhan|danh sách bệnh nhân|danh sach benh nhan|bệnh nhân|benh nhan|thông tin|thong tin|hồ sơ|ho so|cụ|cu|ai|ai là|ai dang|ai bi)\s*", "", msg, flags=re.IGNORECASE).strip()
            return {
                "intent": "PATIENT_SEARCH",
                "full_name": name_candidate if len(name_candidate) >= 2 else None,
                "search_type": "ALL" if len(name_candidate) < 2 else "NAME",
                "raw_query": msg
            }

        # 11. Mặc định
        return {
            "intent": "GENERAL_CONVERSATION",
            "raw_query": msg
        }
