# ==============================================================================
# AI INTENT ROUTER - BỘ ĐIỀU HƯỚNG Ý ĐỊNH TRUY VẤN NÂNG CAO (AI_INTENT_ROUTER.PY)
# ==============================================================================
# Phân loại intent câu hỏi tự nhiên và trích xuất tham số lọc CSDL đa chiều:
# - Dị ứng (Allergy)
# - Bệnh nền / Bệnh án (Disease)
# - Tên thuốc & Lịch uống thuốc (Medicine / Medication Status)
# - Sinh hiệu & Nguy cơ (SpO2, Huyết áp, Nguy cơ ngã)
# - Độ tuổi & Giới tính (Age, Gender)
# - Camera & Cảnh báo (Camera, Alert)
# - Hồ sơ cá nhân (Patient Profile)
# - Thống kê toàn viện (System Statistics - Chỉ khi hỏi rõ ràng)
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

        # 1. Trích xuất mã bệnh nhân dạng PATxxxxx hoặc số nguyên
        patient_code_match = re.search(r"\bPAT\d+\b", msg, re.IGNORECASE)
        extracted_code = patient_code_match.group(0).upper() if patient_code_match else None

        # 2. Xử lý câu hỏi có mã bệnh nhân cụ thể
        if extracted_code:
            if any(k in q_norm for k in ["suc khoe", "huyet ap", "sinh hieu", "nhip tim", "spo2", "than nhiet"]):
                return {"intent": "HEALTH_QUERY", "patient_id": extracted_code, "raw_query": msg}
            elif any(k in q_norm for k in ["thuoc", "uong", "lieu", "don thuoc"]):
                return {"intent": "MEDICINE_QUERY", "patient_id": extracted_code, "raw_query": msg}
            elif any(k in q_norm for k in ["camera", "phong", "giam sat"]):
                return {"intent": "CAMERA_QUERY", "patient_id": extracted_code, "raw_query": msg}
            elif any(k in q_norm for k in ["nga", "te", "canh bao", "su co"]):
                return {"intent": "FALL_QUERY", "patient_id": extracted_code, "raw_query": msg}
            else:
                return {"intent": "PATIENT_PROFILE", "patient_id": extracted_code, "raw_query": msg}

        # 3. Phân loại tra cứu Dị ứng (Allergy Search / Filter)
        if any(k in q_norm for k in ["di ung", "allergy", "phan hoa", "penicillin", "hai san", "khang sinh"]):
            # Trích xuất loại dị ứng
            allergy_kw = None
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

            return {
                "intent": "PATIENT_FILTER",
                "filter_type": "ALLERGY",
                "allergy": allergy_kw,
                "raw_query": msg
            }

        # 4. Phân loại tra cứu Kiến thức Y khoa về Thuốc (Medical Knowledge vs Patient DB)
        is_med_knowledge = any(k in q_norm for k in [
            "la thuoc gi", "la gi", "dung de lam gi", "tac dung cua", "tac dung phu", "chi dinh cua",
            "huong dan su dung", "cong dung cua", "uong the nao", "lieu luong cua"
        ])
        if is_med_knowledge and any(m[0] in q_norm for m in [("amlodipine", "Amlodipine"), ("omeprazole", "Omeprazole"), ("atorvastatin", "Atorvastatin"), ("losartan", "Losartan"), ("metformin", "Metformin")]):
            return {
                "intent": "MEDICAL_KNOWLEDGE",
                "topic": "MEDICATION_GUIDE",
                "raw_query": msg
            }

        # 4.1 Phân loại tra cứu Thuốc của một Bệnh nhân Cụ Thể (Patient Specific Medication Query)
        med_patient_patterns = [
            r"uong.*thuoc",
            r"dung.*thuoc",
            r"don.*thuoc",
            r"lich.*uong",
            r"danh sach.*thuoc",
            r"thuoc.*cua",
            r"cac loai thuoc",
            r"nhung thuoc",
            r"thuoc nao",
            r"thuoc gi",
            r"uong thuoc",
            r"dung thuoc",
            r"ke don"
        ]
        if any(re.search(p, q_norm) for p in med_patient_patterns):
            # Extract name or code
            pat_match = re.search(r"(PAT\d{4,5})", msg, re.IGNORECASE)
            name_candidate = None
            if pat_match:
                name_candidate = pat_match.group(1).upper()
            else:
                name_candidate = re.sub(r"(?:uống những thuốc gì|uống thuốc gì|đang uống thuốc gì|dùng thuốc gì|đơn thuốc của|lịch uống thuốc của|thuốc của|các loại thuốc|bệnh nhân|cụ|ông|bà|[?!.,;:])\s*", "", msg, flags=re.IGNORECASE).strip()
                name_candidate = name_candidate.strip("?!.,;: \n\r\t")
            return {
                "intent": "PATIENT_MEDICATION_QUERY",
                "patient_identifier": name_candidate or None,
                "raw_query": msg
            }

        # 4.2 Phân loại tra cứu Thuốc đang dùng (Medicine Search)
        known_medicines = [
            ("amlodipine", "Amlodipine"),
            ("omeprazole", "Omeprazole"),
            ("calcium", "Calcium"),
            ("vitamin d", "Vitamin D"),
            ("atorvastatin", "Atorvastatin"),
            ("metformin", "Metformin"),
            ("paracetamol", "Paracetamol"),
            ("losartan", "Losartan")
        ]
        for med_key, med_val in known_medicines:
            if med_key in q_norm:
                return {
                    "intent": "MEDICINE_SEARCH",
                    "filter_type": "MEDICINE",
                    "medicine_name": med_val,
                    "raw_query": msg
                }

        # 5. Phân loại tra cứu Trạng thái uống thuốc (Medication Status - Quên thuốc / Chưa uống)
        if any(k in q_norm for k in ["chua uong thuoc", "quen thuoc", "quen uong", "chua uong", "chua dung thuoc"]):
            return {
                "intent": "MEDICATION_STATUS_SEARCH",
                "filter_type": "MEDICATION_STATUS",
                "medication_status": "Chưa uống",
                "raw_query": msg
            }

        # 6. Phân loại tra cứu Bệnh lý / Bệnh nền (Disease Search)
        known_diseases = [
            ("tang huyet ap", "Tăng huyết áp"),
            ("huyet ap cao", "Tăng huyết áp"),
            ("mach vanh", "Bệnh mạch vành"),
            ("tim mach", "Bệnh mạch vành"),
            ("copd", "COPD"),
            ("phoi tac nghen", "Bệnh phổi tắc nghẽn (COPD)"),
            ("dai thao duong", "Đái tháo đường"),
            ("tieu duong", "Đái tháo đường"),
            ("tai bien", "Tai biến"),
            ("dot quy", "Đột quỵ")
        ]
        for dis_key, dis_val in known_diseases:
            if dis_key in q_norm:
                return {
                    "intent": "DISEASE_SEARCH",
                    "filter_type": "DISEASE",
                    "disease": dis_val,
                    "raw_query": msg
                }

        # 7. Phân loại tra cứu SpO2 thấp (SpO2 Hypoxia Search)
        if "spo2" in q_norm or "oxy" in q_norm or "kho tho" in q_norm:
            spo2_num_match = re.search(r"(?:duoi|nho hon|<)\s*(\d{2})", q_norm)
            spo2_val = int(spo2_num_match.group(1)) if spo2_num_match else 95
            return {
                "intent": "SPO2_SEARCH",
                "filter_type": "SPO2",
                "spo2_max": spo2_val,
                "raw_query": msg
            }

        # 8. Phân loại tra cứu Nguy cơ té ngã cao (Fall Risk Search)
        if any(k in q_norm for k in ["nguy co te nga", "nguy co nga", "te nga cao", "risk cao", "nguy co cao"]):
            return {
                "intent": "FALL_RISK_SEARCH",
                "filter_type": "FALL_RISK",
                "risk_level": "Cao",
                "raw_query": msg
            }

        # 9. Phân loại tra cứu Tuổi / Giới tính (Age / Gender Filter)
        age_match = re.search(r"(?:tren|lon hon|>|>=)\s*(\d{2})", q_norm)
        gender_match = None
        if any(k in q_norm for k in ["benh nhan nu", "cu ba", "ba cu", "gioi tinh nu"]):
            gender_match = "Nữ"
        elif any(k in q_norm for k in ["benh nhan nam", "cu ong", "ong cu", "gioi tinh nam"]):
            gender_match = "Nam"

        if age_match or gender_match:
            return {
                "intent": "PATIENT_FILTER",
                "filter_type": "DEMOGRAPHIC",
                "age_min": int(age_match.group(1)) if age_match else None,
                "gender": gender_match,
                "raw_query": msg
            }

        # 10. Phân loại tra cứu Camera
        if "camera" in q_norm:
            is_offline = any(k in q_norm for k in ["offline", "mat ket noi", "mat tin hieu", "hong", "tat"])
            return {
                "intent": "CAMERA_SEARCH",
                "status": "OFFLINE" if is_offline else None,
                "raw_query": msg
            }

        # 11. Phân loại tra cứu Báo cáo thống kê toàn hệ thống (Chỉ khi hỏi rõ về hệ thống / toàn viện)
        if any(k in q_norm for k in ["tong so benh nhan", "bao cao he thong", "thong ke he thong", "tong quan toan vien", "telemetry toan vien", "he thong hien tai the nao"]):
            return {
                "intent": "SYSTEM_STATISTICS",
                "raw_query": msg
            }

        # 12. Phân loại tìm kiếm danh sách bệnh nhân chung hoặc theo tên
        if any(k in q_norm for k in ["tim", "search", "danh sach", "loc", "tra cuu", "thong tin benh nhan", "ho so", "benh nhan", "nhung benh nhan", "tat ca benh nhan"]):
            name_candidate = re.sub(r"(?:tìm|tim|search|những bệnh nhân|nhung benh nhan|tất cả bệnh nhân|tat ca benh nhan|danh sách bệnh nhân|danh sach benh nhan|bệnh nhân|benh nhan|thông tin|thong tin|hồ sơ|ho so|cụ|cu|ai|ai là|ai dang|ai bi)\s*", "", msg, flags=re.IGNORECASE).strip()
            return {
                "intent": "PATIENT_SEARCH",
                "full_name": name_candidate if len(name_candidate) >= 2 else None,
                "search_type": "ALL" if len(name_candidate) < 2 else "NAME",
                "raw_query": msg
            }

        # 13. Mặc định
        return {
            "intent": "GENERAL_CHAT",
            "raw_query": msg
        }
