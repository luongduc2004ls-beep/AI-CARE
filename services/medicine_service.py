# ==========================================================
# medicine_service.py
# Tầng Service quản lý danh mục thuốc (Medicine)
# Chịu trách nhiệm thực hiện nghiệp vụ, phân trang, lọc, sắp xếp và thao tác DB
# Khớp 100% với Model Medicine và bảng MySQL `medicines`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import asc, desc, or_

from database import db
from models.medicine import Medicine

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class MedicineService
# ==========================================================

class MedicineService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến danh mục thuốc.
    """

    # ======================================================
    # Lấy danh sách thuốc (Phân trang, Tìm kiếm, Sắp xếp)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None,
        sort_by: str = "medicine_id",
        order: str = "asc"
    ) -> Tuple[List[Medicine], int]:
        """
        Lấy danh sách thuốc có hỗ trợ Phân trang, Tìm kiếm và Sắp xếp.

        Args:
            page (int): Số trang hiện tại.
            per_page (int): Số lượng bản ghi mỗi trang.
            search (Optional[str]): Từ khóa tìm kiếm (Tên thuốc, Mã thuốc, Liều lượng).
            sort_by (str): Tên cột sắp xếp.
            order (str): Thứ tự sắp xếp ('asc' hoặc 'desc').

        Returns:
            Tuple[List[Medicine], int]: (Danh sách Medicine, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách thuốc (Page=%s, PerPage=%s)", page, per_page)
        query = Medicine.query

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Medicine.medicine_id.like(search_pattern),
                    Medicine.medicine_name.like(search_pattern),
                    Medicine.dosage.like(search_pattern),
                    Medicine.frequency.like(search_pattern)
                )
            )

        total = query.count()

        sort_column = getattr(Medicine, sort_by, Medicine.medicine_id)
        if order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        medicines = query.offset((page - 1) * per_page).limit(per_page).all()
        return medicines, total

    # ======================================================
    # Lấy thuốc theo medicine_id
    # ======================================================
    @staticmethod
    def get_by_id(medicine_id: str) -> Optional[Medicine]:
        """
        Lấy thông tin chi tiết một loại thuốc theo medicine_id.

        Args:
            medicine_id (str): Mã thuốc.

        Returns:
            Optional[Medicine]: Đối tượng Medicine hoặc None.
        """
        logger.info("Service: Truy vấn thuốc theo ID: '%s'", medicine_id)
        return db.session.get(Medicine, medicine_id)

    # ======================================================
    # Thêm mới thuốc
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> Medicine:
        """
        Thêm mới một loại thuốc vào cơ sở dữ liệu MySQL.

        Args:
            data (Dict[str, Any]): Dữ liệu thuốc.

        Returns:
            Medicine: Đối tượng Medicine vừa tạo.

        Raises:
            Exception: Lỗi lưu cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành tạo thuốc mới ID: '%s'", data.get("medicine_id"))
        try:
            medicine = Medicine(
                medicine_id=data["medicine_id"],
                medicine_name=data.get("medicine_name"),
                dosage=data.get("dosage"),
                frequency=data.get("frequency"),
            )

            db.session.add(medicine)
            db.session.commit()
            logger.info("Service: Tạo thành công thuốc ID: '%s'", medicine.medicine_id)
            return medicine
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi thêm mới thuốc: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật thông tin thuốc
    # ======================================================
    @staticmethod
    def update(medicine_id: str, data: Dict[str, Any]) -> Optional[Medicine]:
        """
        Cập nhật thông tin thuốc theo medicine_id.

        Args:
            medicine_id (str): Mã thuốc cần cập nhật.
            data (Dict[str, Any]): Dữ liệu mới.

        Returns:
            Optional[Medicine]: Đối tượng Medicine sau cập nhật hoặc None.

        Raises:
            Exception: Lỗi cập nhật cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành cập nhật thuốc ID: '%s'", medicine_id)
        try:
            medicine = db.session.get(Medicine, medicine_id)
            if medicine is None:
                logger.warning("Service: Không tìm thấy thuốc ID: '%s'", medicine_id)
                return None

            if "medicine_name" in data:
                medicine.medicine_name = data["medicine_name"]
            if "dosage" in data:
                medicine.dosage = data["dosage"]
            if "frequency" in data:
                medicine.frequency = data["frequency"]

            db.session.commit()
            logger.info("Service: Cập nhật thành công thuốc ID: '%s'", medicine_id)
            return medicine
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật thuốc ID '%s': %s", medicine_id, str(error))
            raise error

    # ======================================================
    # Xóa thuốc khỏi hệ thống
    # ======================================================
    @staticmethod
    def delete(medicine_id: str) -> bool:
        """
        Xóa một loại thuốc theo medicine_id.

        Args:
            medicine_id (str): Mã thuốc.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành xóa thuốc ID: '%s'", medicine_id)
        try:
            medicine = db.session.get(Medicine, medicine_id)
            if medicine is None:
                logger.warning("Service: Không tìm thấy thuốc ID: '%s' để xóa", medicine_id)
                return False

            db.session.delete(medicine)
            db.session.commit()
            logger.info("Service: Xóa thành công thuốc ID: '%s'", medicine_id)
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa thuốc ID '%s': %s", medicine_id, str(error))
            raise error