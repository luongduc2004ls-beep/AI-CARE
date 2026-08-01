# ==========================================================
# dashboard_service.py
# Tầng Service tổng hợp báo cáo và thống kê tổng quan (Dashboard)
# Chịu trách nhiệm thực hiện nghiệp vụ và thao tác DB
# Khớp 100% với 7 bảng MySQL hiện tại
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict

from database import db
from models.caregiver import Caregiver
from models.doctor import Doctor
from models.health_record import HealthRecord
from models.medicine import Medicine
from models.medication_schedule import MedicationSchedule
from models.notification import Notification
from models.patient import Patient

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class DashboardService
# ==========================================================

class DashboardService:
    """
    Lớp xử lý nghiệp vụ thống kê báo cáo dữ liệu tổng quan hệ thống AI CARE.
    """

    # ======================================================
    # Lấy thông tin thống kê tổng quan (Summary Cards)
    # ======================================================
    @staticmethod
    def get_summary() -> Dict[str, Any]:
        """
        Tổng hợp tất cả các số liệu thống kê quan trọng phục vụ Dashboard.

        Returns:
            Dict[str, Any]: Dictionary chứa thông tin số liệu tổng quan.
        """
        logger.info("Service: Tổng hợp số liệu thống kê Dashboard.")

        total_patients = db.session.query(Patient).count()
        total_caregivers = db.session.query(Caregiver).count()
        total_doctors = db.session.query(Doctor).count()
        total_medicines = db.session.query(Medicine).count()
        total_health_records = db.session.query(HealthRecord).count()
        total_schedules = db.session.query(MedicationSchedule).count()
        total_notifications = db.session.query(Notification).count()

        high_risk_patients = (
            db.session.query(HealthRecord)
            .filter(HealthRecord.risk_level.ilike("%cao%"))
            .count()
        )

        unacknowledged_reminders = (
            db.session.query(MedicationSchedule)
            .filter(
                (MedicationSchedule.acknowledged.is_(None)) | (MedicationSchedule.acknowledged == "No") | (MedicationSchedule.acknowledged == "False")
            )
            .count()
        )

        return {
            "total_patients": total_patients,
            "total_caregivers": total_caregivers,
            "total_doctors": total_doctors,
            "total_medicines": total_medicines,
            "total_health_records": total_health_records,
            "total_schedules": total_schedules,
            "total_notifications": total_notifications,
            "high_risk_patients": high_risk_patients,
            "unacknowledged_reminders": unacknowledged_reminders,
        }

    # ======================================================
    # Lấy các hoạt động và bản ghi gần đây (Recent Activities)
    # ======================================================
    @staticmethod
    def get_recent_activities() -> Dict[str, Any]:
        """
        Lấy các danh sách dữ liệu mới nhất (Bệnh nhân, Chỉ số sức khỏe, Lịch uống thuốc, Thông báo).

        Returns:
            Dict[str, Any]: Dictionary chứa các danh sách hoạt động gần nhất.
        """
        logger.info("Service: Lấy danh sách hoạt động gần nhất cho Dashboard.")

        recent_patients = Patient.query.limit(5).all()
        recent_health_records = HealthRecord.query.order_by(HealthRecord.timestamp.desc()).limit(5).all()
        recent_notifications = Notification.query.order_by(Notification.timestamp.desc()).limit(5).all()
        recent_schedules = MedicationSchedule.query.limit(5).all()

        return {
            "recent_patients": [patient.to_dict() for patient in recent_patients],
            "recent_health_records": [record.to_dict() for record in recent_health_records],
            "recent_notifications": [item.to_dict() for item in recent_notifications],
            "recent_schedules": [sch.to_dict() for sch in recent_schedules],
        }
