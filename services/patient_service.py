# ==========================================================
# patient_service.py
# Tầng Service quản lý thông tin bệnh nhân
# Chịu trách nhiệm thực hiện nghiệp vụ, phân trang, lọc, sắp xếp và thao tác DB
# Khớp 100% với Model Patient và bảng MySQL `patients`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import asc, desc, or_

from database import db
from models.patient import Patient

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class PatientService
# ==========================================================

class PatientService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến bệnh nhân.
    """

    # ======================================================
    # Lấy danh sách bệnh nhân (Phân trang, Tìm kiếm, Lọc, Sắp xếp)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None,
        sort_by: str = "patient_id",
        order: str = "asc"
    ) -> Tuple[List[Patient], int]:
        """
        Lấy danh sách bệnh nhân có hỗ trợ Phân trang, Tìm kiếm và Sắp xếp.

        Args:
            page (int): Số trang hiện tại.
            per_page (int): Số lượng bản ghi mỗi trang.
            search (Optional[str]): Từ khóa tìm kiếm (Tên, SĐT, Nhóm máu, ID).
            sort_by (str): Tên cột cần sắp xếp.
            order (str): Thứ tự sắp xếp ('asc' hoặc 'desc').

        Returns:
            Tuple[List[Patient], int]: (Danh sách Patient, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách bệnh nhân (Page=%s, PerPage=%s)", page, per_page)
        query = Patient.query

        # Filter / Search
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Patient.patient_id.like(search_pattern),
                    Patient.name.like(search_pattern),
                    Patient.phone.like(search_pattern),
                    Patient.blood_group.like(search_pattern)
                )
            )

        # Total count
        total = query.count()

        # Sort
        sort_column = getattr(Patient, sort_by, Patient.patient_id)
        if order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Pagination
        patients = query.offset((page - 1) * per_page).limit(per_page).all()
        return patients, total

    # ======================================================
    # Lấy thông tin bệnh nhân theo ID
    # ======================================================
    @staticmethod
    def get_by_id(patient_id: str) -> Optional[Patient]:
        """
        Lấy chi tiết bệnh nhân theo patient_id.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            Optional[Patient]: Đối tượng Patient hoặc None.
        """
        logger.info("Service: Truy vấn bệnh nhân theo ID: '%s'", patient_id)
        return db.session.get(Patient, patient_id)

    # ======================================================
    # Thêm mới bệnh nhân
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> Patient:
        """
        Tạo mới một hồ sơ bệnh nhân trong MySQL.

        Args:
            data (Dict[str, Any]): Dữ liệu bệnh nhân.

        Returns:
            Patient: Đối tượng Patient vừa tạo.

        Raises:
            Exception: Lỗi phát sinh trong quá trình lưu dữ liệu.
        """
        logger.info("Service: Tiến hành tạo bệnh nhân mới ID: '%s'", data.get("patient_id"))
        try:
            patient = Patient(
                patient_id=data["patient_id"],
                device_id=data.get("device_id"),
                name=data.get("name"),
                age=int(data["age"]) if data.get("age") is not None else None,
                gender=data.get("gender"),
                phone=int(data["phone"]) if data.get("phone") is not None else None,
                height_cm=int(data["height_cm"]) if data.get("height_cm") is not None else None,
                weight_kg=int(data["weight_kg"]) if data.get("weight_kg") is not None else None,
                blood_group=data.get("blood_group"),
                allergy=data.get("allergy"),
            )

            db.session.add(patient)
            db.session.commit()
            logger.info("Service: Tạo thành công bệnh nhân ID: '%s'", patient.patient_id)
            return patient
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi tạo mới bệnh nhân: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật thông tin bệnh nhân
    # ======================================================
    @staticmethod
    def update(patient_id: str, data: Dict[str, Any]) -> Optional[Patient]:
        """
        Cập nhật thông tin bệnh nhân theo ID.

        Args:
            patient_id (str): Mã bệnh nhân cần cập nhật.
            data (Dict[str, Any]): Dữ liệu cập nhật.

        Returns:
            Optional[Patient]: Đối tượng Patient sau khi cập nhật hoặc None.

        Raises:
            Exception: Lỗi phát sinh khi cập nhật.
        """
        logger.info("Service: Tiến hành cập nhật bệnh nhân ID: '%s'", patient_id)
        try:
            patient = db.session.get(Patient, patient_id)
            if patient is None:
                logger.warning("Service: Không tìm thấy bệnh nhân ID: '%s'", patient_id)
                return None

            if "device_id" in data:
                patient.device_id = data["device_id"]
            if "name" in data:
                patient.name = data["name"]
            if "age" in data:
                patient.age = int(data["age"]) if data["age"] is not None else None
            if "gender" in data:
                patient.gender = data["gender"]
            if "phone" in data:
                patient.phone = int(data["phone"]) if data["phone"] is not None else None
            if "height_cm" in data:
                patient.height_cm = int(data["height_cm"]) if data["height_cm"] is not None else None
            if "weight_kg" in data:
                patient.weight_kg = int(data["weight_kg"]) if data["weight_kg"] is not None else None
            if "blood_group" in data:
                patient.blood_group = data["blood_group"]
            if "allergy" in data:
                patient.allergy = data["allergy"]

            db.session.commit()
            logger.info("Service: Cập nhật thành công bệnh nhân ID: '%s'", patient_id)
            return patient
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật bệnh nhân ID '%s': %s", patient_id, str(error))
            raise error

    # ======================================================
    # Xóa hồ sơ bệnh nhân
    # ======================================================
    @staticmethod
    def delete(patient_id: str) -> bool:
        """
        Xóa hồ sơ bệnh nhân khỏi hệ thống.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi phát sinh khi xóa.
        """
        logger.info("Service: Tiến hành xóa bệnh nhân ID: '%s'", patient_id)
        try:
            patient = db.session.get(Patient, patient_id)
            if patient is None:
                logger.warning("Service: Không tìm thấy bệnh nhân ID: '%s' để xóa", patient_id)
                return False

            db.session.delete(patient)
            db.session.commit()
            logger.info("Service: Xóa thành công bệnh nhân ID: '%s'", patient_id)
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa bệnh nhân ID '%s': %s", patient_id, str(error))
            raise error
