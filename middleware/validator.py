# ==========================================================
# validator.py
# Kiểm tra dữ liệu đầu vào cho toàn bộ hệ thống
# ==========================================================

from __future__ import annotations

from datetime import datetime
from typing import Tuple


class Validator:
    """
    Lớp hỗ trợ kiểm tra dữ liệu đầu vào cho hệ thống AI CARE.
    """

    # ======================================================
    # Kiểm tra dữ liệu Thuốc
    # ======================================================
    @staticmethod
    def validate_medicine(data: dict) -> Tuple[bool, str]:
        """
        Kiểm tra dữ liệu thuốc.

        Returns:
            Tuple[bool, str]: (Hợp lệ hay không, Thông báo)
        """
        required_fields = [
            "medicine_name",
            "dosage",
            "frequency",
            "quantity",
            "expire_date",
        ]

        for field in required_fields:
            if field not in data:
                return False, f"Thiếu trường '{field}'."
            if str(data[field]).strip() == "":
                return False, f"'{field}' không được để trống."

        try:
            quantity = int(data["quantity"])
            if quantity < 0:
                return False, "Số lượng phải lớn hơn hoặc bằng 0."
        except (ValueError, TypeError):
            return False, "Số lượng phải là số nguyên."

        try:
            datetime.strptime(data["expire_date"], "%Y-%m-%d")
        except (ValueError, TypeError):
            return False, "Ngày hết hạn phải có định dạng YYYY-MM-DD."

        return True, "Dữ liệu hợp lệ"

    # ======================================================
    # Kiểm tra dữ liệu Bệnh nhân
    # ======================================================
    @staticmethod
    def validate_patient(data: dict) -> Tuple[bool, str]:
        """
        Kiểm tra dữ liệu bệnh nhân.

        Returns:
            Tuple[bool, str]: (Hợp lệ hay không, Thông báo)
        """
        required_fields = ["full_name", "age", "gender"]

        for field in required_fields:
            if field not in data:
                return False, f"Thiếu trường '{field}'."
            if str(data[field]).strip() == "":
                return False, f"'{field}' không được để trống."

        try:
            age = int(data["age"])
            if age <= 0 or age > 150:
                return False, "Tuổi phải là số nguyên dương hợp lệ (1-150)."
        except (ValueError, TypeError):
            return False, "Tuổi phải là số nguyên."

        if data["gender"] not in ["Nam", "Nữ", "Khác"]:
            return False, "Giới tính phải là 'Nam', 'Nữ' hoặc 'Khác'."

        return True, "Dữ liệu hợp lệ"

    # ======================================================
    # Kiểm tra dữ liệu Hồ sơ sức khỏe
    # ======================================================
    @staticmethod
    def validate_health_record(data: dict) -> Tuple[bool, str]:
        """
        Kiểm tra dữ liệu chỉ số sức khỏe.

        Returns:
            Tuple[bool, str]: (Hợp lệ hay không, Thông báo)
        """
        required_fields = ["patient_id"]

        for field in required_fields:
            if field not in data:
                return False, f"Thiếu trường '{field}'."

        try:
            patient_id = int(data["patient_id"])
            if patient_id <= 0:
                return False, "patient_id phải là số nguyên dương."
        except (ValueError, TypeError):
            return False, "patient_id phải là số nguyên."

        return True, "Dữ liệu hợp lệ"

    # ======================================================
    # Kiểm tra dữ liệu Thông báo
    # ======================================================
    @staticmethod
    def validate_notification(data: dict) -> Tuple[bool, str]:
        """
        Kiểm tra dữ liệu thông báo.

        Returns:
            Tuple[bool, str]: (Hợp lệ hay không, Thông báo)
        """
        required_fields = ["title", "message"]

        for field in required_fields:
            if field not in data:
                return False, f"Thiếu trường '{field}'."
            if str(data[field]).strip() == "":
                return False, f"'{field}' không được để trống."

        return True, "Dữ liệu hợp lệ"


# ==========================================================
# Các hàm tương thích với Controller cũ
# ==========================================================

def validate_medicine(data: dict) -> Tuple[bool, str]:
    return Validator.validate_medicine(data)


def validate_patient(data: dict) -> Tuple[bool, str]:
    return Validator.validate_patient(data)


def validate_health_record(data: dict) -> Tuple[bool, str]:
    return Validator.validate_health_record(data)


def validate_notification(data: dict) -> Tuple[bool, str]:
    return Validator.validate_notification(data)