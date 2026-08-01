# ==========================================================
# medication_schedule_service.py
# Tầng Service quản lý lịch uống thuốc của bệnh nhân (MedicationSchedule)
# Chịu trách nhiệm thực hiện nghiệp vụ, phân trang, lọc và thao tác DB
# Khớp 100% với Model MedicationSchedule và bảng MySQL `medication_schedules`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_

from database import db
from models.medication_schedule import MedicationSchedule

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class MedicationScheduleService
# ==========================================================

class MedicationScheduleService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến lịch uống thuốc.
    """

    # ======================================================
    # Lấy danh sách lịch uống thuốc (Phân trang, Lọc)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        patient_id: Optional[str] = None,
        medicine_id: Optional[str] = None
    ) -> Tuple[List[MedicationSchedule], int]:
        """
        Lấy danh sách lịch uống thuốc có hỗ trợ Phân trang và Lọc theo bệnh nhân / thuốc.

        Args:
            page (int): Số trang hiện tại.
            per_page (int): Số lượng bản ghi mỗi trang.
            patient_id (Optional[str]): Mã bệnh nhân cần lọc.
            medicine_id (Optional[str]): Mã thuốc cần lọc.

        Returns:
            Tuple[List[MedicationSchedule], int]: (Danh sách MedicationSchedule, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách lịch uống thuốc (Page=%s, PerPage=%s)", page, per_page)
        query = MedicationSchedule.query

        if patient_id:
            query = query.filter(MedicationSchedule.patient_id == patient_id)

        if medicine_id:
            query = query.filter(MedicationSchedule.medicine_id == medicine_id)

        total = query.count()
        schedules = query.offset((page - 1) * per_page).limit(per_page).all()
        return schedules, total

    # ======================================================
    # Lấy chi tiết lịch uống thuốc theo khóa chính
    # ======================================================
    @staticmethod
    def get_by_id(patient_id: str, medicine_id: str, scheduled_time: str) -> Optional[MedicationSchedule]:
        """
        Lấy chi tiết một lịch uống thuốc theo khóa chính (patient_id, medicine_id, scheduled_time).

        Args:
            patient_id (str): Mã bệnh nhân.
            medicine_id (str): Mã thuốc.
            scheduled_time (str): Giờ nhắc nhở.

        Returns:
            Optional[MedicationSchedule]: Lịch uống thuốc hoặc None.
        """
        logger.info("Service: Truy vấn lịch uống thuốc ('%s', '%s', '%s')", patient_id, medicine_id, scheduled_time)
        return db.session.get(MedicationSchedule, (patient_id, medicine_id, scheduled_time))

    # ======================================================
    # Lấy danh sách lịch uống thuốc của một bệnh nhân
    # ======================================================
    @staticmethod
    def get_by_patient_id(patient_id: str) -> List[MedicationSchedule]:
        """
        Lấy tất cả lịch uống thuốc của một bệnh nhân cụ thể.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            List[MedicationSchedule]: Danh sách lịch uống thuốc.
        """
        logger.info("Service: Truy vấn lịch uống thuốc cho bệnh nhân ID: '%s'", patient_id)
        return MedicationSchedule.query.filter(MedicationSchedule.patient_id == patient_id).all()

    # ======================================================
    # Thêm mới lịch uống thuốc
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> MedicationSchedule:
        """
        Tạo mới một lịch uống thuốc trong cơ sở dữ liệu MySQL.

        Args:
            data (Dict[str, Any]): Dữ liệu lịch uống thuốc.

        Returns:
            MedicationSchedule: Đối tượng vừa tạo.

        Raises:
            Exception: Lỗi lưu cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành tạo lịch uống thuốc cho bệnh nhân ID: '%s'", data.get("patient_id"))
        try:
            schedule = MedicationSchedule(
                patient_id=data["patient_id"],
                medicine_id=data["medicine_id"],
                scheduled_time=data["scheduled_time"],
                medicine_start_date=data.get("medicine_start_date"),
                medicine_end_date=data.get("medicine_end_date"),
                reminder_type=data.get("reminder_type"),
                reminder_sent=data.get("reminder_sent"),
                acknowledged=data.get("acknowledged"),
            )

            db.session.add(schedule)
            db.session.commit()
            logger.info("Service: Tạo thành công lịch uống thuốc")
            return schedule
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi thêm lịch uống thuốc: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật lịch uống thuốc
    # ======================================================
    @staticmethod
    def update(
        patient_id: str,
        medicine_id: str,
        scheduled_time: str,
        data: Dict[str, Any]
    ) -> Optional[MedicationSchedule]:
        """
        Cập nhật thông tin lịch uống thuốc.

        Args:
            patient_id (str): Mã bệnh nhân.
            medicine_id (str): Mã thuốc.
            scheduled_time (str): Giờ nhắc nhở.
            data (Dict[str, Any]): Dữ liệu mới.

        Returns:
            Optional[MedicationSchedule]: Đối tượng sau cập nhật hoặc None.

        Raises:
            Exception: Lỗi cập nhật cơ sở dữ liệu.
        """
        logger.info("Service: Cập nhật lịch uống thuốc ('%s', '%s', '%s')", patient_id, medicine_id, scheduled_time)
        try:
            schedule = db.session.get(MedicationSchedule, (patient_id, medicine_id, scheduled_time))
            if schedule is None:
                logger.warning("Service: Không tìm thấy lịch uống thuốc để cập nhật")
                return None

            if "medicine_start_date" in data:
                schedule.medicine_start_date = data["medicine_start_date"]
            if "medicine_end_date" in data:
                schedule.medicine_end_date = data["medicine_end_date"]
            if "reminder_type" in data:
                schedule.reminder_type = data["reminder_type"]
            if "reminder_sent" in data:
                schedule.reminder_sent = data["reminder_sent"]
            if "acknowledged" in data:
                schedule.acknowledged = data["acknowledged"]

            db.session.commit()
            logger.info("Service: Cập nhật thành công lịch uống thuốc")
            return schedule
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật lịch uống thuốc: %s", str(error))
            raise error

    # ======================================================
    # Xóa lịch uống thuốc
    # ======================================================
    @staticmethod
    def delete(patient_id: str, medicine_id: str, scheduled_time: str) -> bool:
        """
        Xóa một lịch uống thuốc theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            medicine_id (str): Mã thuốc.
            scheduled_time (str): Giờ nhắc nhở.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Xóa lịch uống thuốc ('%s', '%s', '%s')", patient_id, medicine_id, scheduled_time)
        try:
            schedule = db.session.get(MedicationSchedule, (patient_id, medicine_id, scheduled_time))
            if schedule is None:
                logger.warning("Service: Không tìm thấy lịch uống thuốc để xóa")
                return False

            db.session.delete(schedule)
            db.session.commit()
            logger.info("Service: Xóa thành công lịch uống thuốc")
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa lịch uống thuốc: %s", str(error))
            raise error
