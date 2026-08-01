# ==========================================================
# doctor_service.py
# Tầng Service quản lý thông tin bác sĩ điều trị (Doctor)
# Chịu trách nhiệm thực hiện nghiệp vụ và thao tác DB
# Khớp 100% với Model Doctor và bảng MySQL `doctors`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_

from database import db
from models.doctor import Doctor

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class DoctorService
# ==========================================================

class DoctorService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến bác sĩ điều trị.
    """

    # ======================================================
    # Lấy danh sách bác sĩ (Phân trang, Tìm kiếm)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None
    ) -> Tuple[List[Doctor], int]:
        """
        Lấy danh sách bác sĩ có hỗ trợ Phân trang và Tìm kiếm.

        Args:
            page (int): Số trang.
            per_page (int): Số lượng bản ghi mỗi trang.
            search (Optional[str]): Từ khóa tìm kiếm (Tên bác sĩ, Mã bệnh nhân).

        Returns:
            Tuple[List[Doctor], int]: (Danh sách Doctor, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách bác sĩ (Page=%s, PerPage=%s)", page, per_page)
        query = Doctor.query

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Doctor.patient_id.like(search_pattern),
                    Doctor.doctor_name.like(search_pattern)
                )
            )

        total = query.count()
        doctors = query.offset((page - 1) * per_page).limit(per_page).all()
        return doctors, total

    # ======================================================
    # Lấy danh sách bác sĩ theo patient_id
    # ======================================================
    @staticmethod
    def get_by_patient_id(patient_id: str) -> List[Doctor]:
        """
        Lấy danh sách bác sĩ quản lý một bệnh nhân cụ thể.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            List[Doctor]: Danh sách bác sĩ.
        """
        logger.info("Service: Truy vấn danh sách bác sĩ cho bệnh nhân ID: '%s'", patient_id)
        return Doctor.query.filter(Doctor.patient_id == patient_id).all()

    # ======================================================
    # Thêm mới bác sĩ
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> Doctor:
        """
        Thêm bác sĩ mới vào hệ thống.

        Args:
            data (Dict[str, Any]): Dữ liệu bác sĩ.

        Returns:
            Doctor: Đối tượng Doctor vừa tạo.

        Raises:
            Exception: Lỗi lưu cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành tạo bác sĩ cho bệnh nhân ID: '%s'", data.get("patient_id"))
        try:
            doctor = Doctor(
                patient_id=data["patient_id"],
                doctor_name=data["doctor_name"],
            )

            db.session.add(doctor)
            db.session.commit()
            logger.info("Service: Tạo thành công bác sĩ: '%s'", doctor.doctor_name)
            return doctor
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi tạo mới bác sĩ: %s", str(error))
            raise error

    # ======================================================
    # Xóa bác sĩ
    # ======================================================
    @staticmethod
    def delete(patient_id: str, doctor_name: str) -> bool:
        """
        Xóa thông tin phân công bác sĩ theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            doctor_name (str): Tên bác sĩ.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Xóa bác sĩ '%s' của bệnh nhân '%s'", doctor_name, patient_id)
        try:
            doctor = db.session.get(Doctor, (patient_id, doctor_name))
            if doctor is None:
                logger.warning("Service: Không tìm thấy bác sĩ để xóa")
                return False

            db.session.delete(doctor)
            db.session.commit()
            logger.info("Service: Xóa thành công bác sĩ '%s'", doctor_name)
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa bác sĩ: %s", str(error))
            raise error
