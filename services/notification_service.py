# ==========================================================
# notification_service.py
# Tầng Service quản lý thông báo và cảnh báo (Notification)
# Chịu trách nhiệm thực hiện nghiệp vụ, phân trang, lọc và thao tác DB
# Khớp 100% với Model Notification và bảng MySQL `notifications`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc

from database import db
from models.notification import Notification

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class NotificationService
# ==========================================================

class NotificationService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến thông báo và cảnh báo.
    """

    # ======================================================
    # Lấy danh sách thông báo (Phân trang, Lọc)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        patient_id: Optional[str] = None,
        alert_status: Optional[str] = None
    ) -> Tuple[List[Notification], int]:
        """
        Lấy danh sách thông báo có hỗ trợ Phân trang và Lọc theo bệnh nhân / trạng thái.

        Args:
            page (int): Số trang hiện tại.
            per_page (int): Số lượng bản ghi mỗi trang.
            patient_id (Optional[str]): Mã bệnh nhân.
            alert_status (Optional[str]): Trạng thái cảnh báo.

        Returns:
            Tuple[List[Notification], int]: (Danh sách Notification, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách thông báo (Page=%s, PerPage=%s)", page, per_page)
        query = Notification.query

        if patient_id:
            query = query.filter(Notification.patient_id == patient_id)

        if alert_status:
            query = query.filter(Notification.alert_status == alert_status)

        total = query.count()
        notifications = query.order_by(desc(Notification.timestamp)).offset((page - 1) * per_page).limit(per_page).all()
        return notifications, total

    # ======================================================
    # Lấy chi tiết thông báo theo khóa chính
    # ======================================================
    @staticmethod
    def get_by_id(patient_id: str, timestamp: str) -> Optional[Notification]:
        """
        Lấy chi tiết một bản ghi thông báo theo (patient_id, timestamp).

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian phát sinh thông báo.

        Returns:
            Optional[Notification]: Đối tượng Notification hoặc None.
        """
        logger.info("Service: Truy vấn thông báo ('%s', '%s')", patient_id, timestamp)
        return db.session.get(Notification, (patient_id, timestamp))

    # ======================================================
    # Lấy danh sách thông báo của một bệnh nhân
    # ======================================================
    @staticmethod
    def get_by_patient_id(patient_id: str) -> List[Notification]:
        """
        Lấy tất cả thông báo của một bệnh nhân cụ thể.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            List[Notification]: Danh sách thông báo.
        """
        logger.info("Service: Truy vấn thông báo cho bệnh nhân ID: '%s'", patient_id)
        return (
            Notification.query.filter(Notification.patient_id == patient_id)
            .order_by(desc(Notification.timestamp))
            .all()
        )

    # ======================================================
    # Thêm mới thông báo
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> Notification:
        """
        Tạo mới một bản ghi thông báo trong cơ sở dữ liệu MySQL.

        Args:
            data (Dict[str, Any]): Dữ liệu thông báo.

        Returns:
            Notification: Đối tượng vừa tạo.

        Raises:
            Exception: Lỗi lưu cơ sở dữ liệu.
        """
        logger.info("Service: Tiến hành tạo thông báo cho bệnh nhân ID: '%s'", data.get("patient_id"))
        try:
            notification = Notification(
                patient_id=data["patient_id"],
                timestamp=data["timestamp"],
                alert_status=data.get("alert_status"),
                reminder_sent=data.get("reminder_sent"),
                acknowledged=data.get("acknowledged"),
            )

            db.session.add(notification)
            db.session.commit()
            logger.info("Service: Tạo thành công thông báo")
            return notification
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi thêm thông báo: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật thông báo
    # ======================================================
    @staticmethod
    def update(
        patient_id: str,
        timestamp: str,
        data: Dict[str, Any]
    ) -> Optional[Notification]:
        """
        Cập nhật thông tin thông báo theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian thông báo.
            data (Dict[str, Any]): Dữ liệu mới.

        Returns:
            Optional[Notification]: Đối tượng sau cập nhật hoặc None.

        Raises:
            Exception: Lỗi cập nhật cơ sở dữ liệu.
        """
        logger.info("Service: Cập nhật thông báo ('%s', '%s')", patient_id, timestamp)
        try:
            notification = db.session.get(Notification, (patient_id, timestamp))
            if notification is None:
                logger.warning("Service: Không tìm thấy thông báo để cập nhật")
                return None

            if "alert_status" in data:
                notification.alert_status = data["alert_status"]
            if "reminder_sent" in data:
                notification.reminder_sent = data["reminder_sent"]
            if "acknowledged" in data:
                notification.acknowledged = data["acknowledged"]

            db.session.commit()
            logger.info("Service: Cập nhật thành công thông báo")
            return notification
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật thông báo: %s", str(error))
            raise error

    # ======================================================
    # Xóa thông báo
    # ======================================================
    @staticmethod
    def delete(patient_id: str, timestamp: str) -> bool:
        """
        Xóa một thông báo theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian thông báo.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Xóa thông báo ('%s', '%s')", patient_id, timestamp)
        try:
            notification = db.session.get(Notification, (patient_id, timestamp))
            if notification is None:
                logger.warning("Service: Không tìm thấy thông báo để xóa")
                return False

            db.session.delete(notification)
            db.session.commit()
            logger.info("Service: Xóa thành công thông báo")
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa thông báo: %s", str(error))
            raise error
