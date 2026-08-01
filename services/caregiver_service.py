# ==========================================================
# caregiver_service.py
# Tầng Service quản lý thông tin người chăm sóc (Caregiver)
# Chịu trách nhiệm thực hiện nghiệp vụ và thao tác DB
# Khớp 100% với Model Caregiver và bảng MySQL `caregivers`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_

from database import db
from models.caregiver import Caregiver

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class CaregiverService
# ==========================================================

class CaregiverService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến người chăm sóc.
    """

    # ======================================================
    # Lấy danh sách người chăm sóc (Phân trang, Tìm kiếm)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None
    ) -> Tuple[List[Caregiver], int]:
        """
        Lấy danh sách người chăm sóc có hỗ trợ Phân trang và Tìm kiếm.

        Args:
            page (int): Số trang.
            per_page (int): Số lượng bản ghi mỗi trang.
            search (Optional[str]): Từ khóa tìm kiếm (Tên người chăm sóc, SĐT, Mã bệnh nhân).

        Returns:
            Tuple[List[Caregiver], int]: (Danh sách Caregiver, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách người chăm sóc (Page=%s, PerPage=%s)", page, per_page)
        query = Caregiver.query

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Caregiver.patient_id.like(search_pattern),
                    Caregiver.caregiver_name.like(search_pattern),
                    Caregiver.caregiver_phone.like(search_pattern)
                )
            )

        total = query.count()
        caregivers = query.offset((page - 1) * per_page).limit(per_page).all()
        return caregivers, total

    # ======================================================
    # Lấy người chăm sóc theo patient_id
    # ======================================================
    @staticmethod
    def get_by_patient_id(patient_id: str) -> List[Caregiver]:
        """
        Lấy danh sách người chăm sóc của một bệnh nhân cụ thể.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            List[Caregiver]: Danh sách người chăm sóc.
        """
        logger.info("Service: Truy vấn người chăm sóc cho bệnh nhân ID: '%s'", patient_id)
        return Caregiver.query.filter(Caregiver.patient_id == patient_id).all()

    # ======================================================
    # Thêm mới người chăm sóc
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> Caregiver:
        """
        Thêm người chăm sóc mới vào hệ thống.

        Args:
            data (Dict[str, Any]): Dữ liệu người chăm sóc.

        Returns:
            Caregiver: Đối tượng vừa được tạo.

        Raises:
            Exception: Lỗi lưu cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành tạo người chăm sóc cho bệnh nhân ID: '%s'", data.get("patient_id"))
        try:
            caregiver = Caregiver(
                patient_id=data["patient_id"],
                caregiver_name=data["caregiver_name"],
                caregiver_phone=int(data["caregiver_phone"]) if data.get("caregiver_phone") is not None else None,
            )

            db.session.add(caregiver)
            db.session.commit()
            logger.info("Service: Tạo thành công người chăm sóc: '%s'", caregiver.caregiver_name)
            return caregiver
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi tạo mới người chăm sóc: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật thông tin người chăm sóc
    # ======================================================
    @staticmethod
    def update(patient_id: str, caregiver_name: str, data: Dict[str, Any]) -> Optional[Caregiver]:
        """
        Cập nhật thông tin người chăm sóc theo khóa chính (patient_id, caregiver_name).

        Args:
            patient_id (str): Mã bệnh nhân.
            caregiver_name (str): Tên người chăm sóc.
            data (Dict[str, Any]): Dữ liệu mới.

        Returns:
            Optional[Caregiver]: Đối tượng Caregiver sau khi cập nhật hoặc None.

        Raises:
            Exception: Lỗi cập nhật cơ sở dữ liệu.
        """
        logger.info("Service: Cập nhật người chăm sóc '%s' của bệnh nhân '%s'", caregiver_name, patient_id)
        try:
            caregiver = db.session.get(Caregiver, (patient_id, caregiver_name))
            if caregiver is None:
                logger.warning("Service: Không tìm thấy người chăm sóc để cập nhật")
                return None

            if "caregiver_phone" in data:
                caregiver.caregiver_phone = (
                    int(data["caregiver_phone"]) if data["caregiver_phone"] is not None else None
                )

            db.session.commit()
            logger.info("Service: Cập nhật thành công người chăm sóc '%s'", caregiver_name)
            return caregiver
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật người chăm sóc: %s", str(error))
            raise error

    # ======================================================
    # Xóa người chăm sóc
    # ======================================================
    @staticmethod
    def delete(patient_id: str, caregiver_name: str) -> bool:
        """
        Xóa người chăm sóc theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            caregiver_name (str): Tên người chăm sóc.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Xóa người chăm sóc '%s' của bệnh nhân '%s'", caregiver_name, patient_id)
        try:
            caregiver = db.session.get(Caregiver, (patient_id, caregiver_name))
            if caregiver is None:
                logger.warning("Service: Không tìm thấy người chăm sóc để xóa")
                return False

            db.session.delete(caregiver)
            db.session.commit()
            logger.info("Service: Xóa thành công người chăm sóc '%s'", caregiver_name)
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa người chăm sóc: %s", str(error))
            raise error
