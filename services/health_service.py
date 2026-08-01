# ==========================================================
# health_service.py
# Tầng Service quản lý hồ sơ chỉ số sức khỏe (HealthRecord)
# Chịu trách nhiệm thực hiện nghiệp vụ, phân trang, lọc, sắp xếp và thao tác DB
# Khớp 100% với Model HealthRecord và bảng MySQL `health_records`
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import asc, desc, or_

from database import db
from models.health_record import HealthRecord

# ==========================================================
# Cấu hình Logger
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# Class HealthService
# ==========================================================

class HealthService:
    """
    Lớp dịch vụ xử lý nghiệp vụ liên quan đến chỉ số sức khỏe.
    """

    # ======================================================
    # Lấy danh sách chỉ số sức khỏe (Phân trang, Lọc, Sắp xếp)
    # ======================================================
    @staticmethod
    def get_all(
        page: int = 1,
        per_page: int = 10,
        patient_id: Optional[str] = None,
        risk_level: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "timestamp",
        order: str = "desc"
    ) -> Tuple[List[HealthRecord], int]:
        """
        Lấy danh sách chỉ số sức khỏe có hỗ trợ Phân trang, Lọc và Sắp xếp.

        Args:
            page (int): Số trang hiện tại.
            per_page (int): Số lượng bản ghi mỗi trang.
            patient_id (Optional[str]): Mã bệnh nhân cần lọc.
            risk_level (Optional[str]): Mức độ rủi ro (Thấp / Trung bình / Cao).
            search (Optional[str]): Từ khóa tìm kiếm (Bệnh lý, Dự đoán AI, Mã bệnh nhân).
            sort_by (str): Tên cột sắp xếp.
            order (str): Thứ tự sắp xếp ('asc' hoặc 'desc').

        Returns:
            Tuple[List[HealthRecord], int]: (Danh sách HealthRecord, Tổng số bản ghi)
        """
        logger.info("Service: Truy vấn danh sách chỉ số sức khỏe (Page=%s, PerPage=%s)", page, per_page)
        query = HealthRecord.query

        if patient_id:
            query = query.filter(HealthRecord.patient_id == patient_id)

        if risk_level:
            query = query.filter(HealthRecord.risk_level == risk_level)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    HealthRecord.patient_id.like(search_pattern),
                    HealthRecord.disease.like(search_pattern),
                    HealthRecord.ai_prediction.like(search_pattern)
                )
            )

        total = query.count()

        sort_column = getattr(HealthRecord, sort_by, HealthRecord.timestamp)
        if order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        records = query.offset((page - 1) * per_page).limit(per_page).all()
        return records, total

    # ======================================================
    # Lấy thông tin bản ghi sức khỏe theo khóa chính (patient_id, timestamp)
    # ======================================================
    @staticmethod
    def get_by_id(patient_id: str, timestamp: str) -> Optional[HealthRecord]:
        """
        Lấy chi tiết một bản ghi chỉ số sức khỏe.

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian ghi nhận.

        Returns:
            Optional[HealthRecord]: Bản ghi sức khỏe hoặc None.
        """
        logger.info("Service: Truy vấn bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
        return db.session.get(HealthRecord, (patient_id, timestamp))

    # ======================================================
    # Lấy bản ghi sức khỏe mới nhất của một bệnh nhân
    # ======================================================
    @staticmethod
    def get_latest_by_patient_id(patient_id: str) -> Optional[HealthRecord]:
        """
        Lấy bản ghi sức khỏe gần nhất của một bệnh nhân.

        Args:
            patient_id (str): Mã bệnh nhân.

        Returns:
            Optional[HealthRecord]: Bản ghi gần nhất hoặc None.
        """
        logger.info("Service: Lấy bản ghi sức khỏe mới nhất bệnh nhân ID: '%s'", patient_id)
        return (
            HealthRecord.query.filter(HealthRecord.patient_id == patient_id)
            .order_by(HealthRecord.timestamp.desc())
            .first()
        )

    # ======================================================
    # Thêm mới bản ghi chỉ số sức khỏe
    # ======================================================
    @staticmethod
    def create(data: Dict[str, Any]) -> HealthRecord:
        """
        Ghi nhận bản ghi chỉ số sức khỏe mới vào MySQL.

        Args:
            data (Dict[str, Any]): Dữ liệu chỉ số sức khỏe.

        Returns:
            HealthRecord: Bản ghi vừa được lưu.

        Raises:
            Exception: Lỗi phát sinh trong quá trình lưu dữ liệu.
        """
        logger.info("Service: Ghi nhận chỉ số sức khỏe cho bệnh nhân ID: '%s'", data.get("patient_id"))
        try:
            record = HealthRecord(
                patient_id=data["patient_id"],
                timestamp=data["timestamp"],
                blood_pressure=data.get("blood_pressure"),
                heart_rate=int(data["heart_rate"]) if data.get("heart_rate") is not None else None,
                spo2=int(data["spo2"]) if data.get("spo2") is not None else None,
                body_temperature=float(data["body_temperature"]) if data.get("body_temperature") is not None else None,
                blood_glucose=int(data["blood_glucose"]) if data.get("blood_glucose") is not None else None,
                disease=data.get("disease"),
                fall_history=data.get("fall_history"),
                fall_risk_score=int(data["fall_risk_score"]) if data.get("fall_risk_score") is not None else None,
                risk_level=data.get("risk_level"),
                adherence_rate=int(data["adherence_rate"]) if data.get("adherence_rate") is not None else None,
                ai_prediction=data.get("ai_prediction"),
            )

            db.session.add(record)
            db.session.commit()
            logger.info("Service: Ghi nhận thành công chỉ số sức khỏe ID '%s'", record.patient_id)
            return record
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi thêm chỉ số sức khỏe: %s", str(error))
            raise error

    # ======================================================
    # Cập nhật bản ghi sức khỏe
    # ======================================================
    @staticmethod
    def update(patient_id: str, timestamp: str, data: Dict[str, Any]) -> Optional[HealthRecord]:
        """
        Cập nhật thông tin bản ghi sức khỏe theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian ghi nhận.
            data (Dict[str, Any]): Dữ liệu mới.

        Returns:
            Optional[HealthRecord]: Bản ghi sau khi cập nhật hoặc None.

        Raises:
            Exception: Lỗi cập nhật cơ sở dữ liệu.
        """
        logger.info("Service: Cập nhật bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
        try:
            record = db.session.get(HealthRecord, (patient_id, timestamp))
            if record is None:
                logger.warning("Service: Không tìm thấy bản ghi sức khỏe để cập nhật")
                return None

            if "blood_pressure" in data:
                record.blood_pressure = data["blood_pressure"]
            if "heart_rate" in data:
                record.heart_rate = int(data["heart_rate"]) if data["heart_rate"] is not None else None
            if "spo2" in data:
                record.spo2 = int(data["spo2"]) if data["spo2"] is not None else None
            if "body_temperature" in data:
                record.body_temperature = float(data["body_temperature"]) if data["body_temperature"] is not None else None
            if "blood_glucose" in data:
                record.blood_glucose = int(data["blood_glucose"]) if data["blood_glucose"] is not None else None
            if "disease" in data:
                record.disease = data["disease"]
            if "fall_history" in data:
                record.fall_history = data["fall_history"]
            if "fall_risk_score" in data:
                record.fall_risk_score = int(data["fall_risk_score"]) if data["fall_risk_score"] is not None else None
            if "risk_level" in data:
                record.risk_level = data["risk_level"]
            if "adherence_rate" in data:
                record.adherence_rate = int(data["adherence_rate"]) if data["adherence_rate"] is not None else None
            if "ai_prediction" in data:
                record.ai_prediction = data["ai_prediction"]

            db.session.commit()
            logger.info("Service: Cập nhật thành công bản ghi sức khỏe")
            return record
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi cập nhật bản ghi sức khỏe: %s", str(error))
            raise error

    # ======================================================
    # Xóa bản ghi chỉ số sức khỏe
    # ======================================================
    @staticmethod
    def delete(patient_id: str, timestamp: str) -> bool:
        """
        Xóa một bản ghi chỉ số sức khỏe theo khóa chính.

        Args:
            patient_id (str): Mã bệnh nhân.
            timestamp (str): Thời gian ghi nhận.

        Returns:
            bool: True nếu xóa thành công, False nếu không tìm thấy.

        Raises:
            Exception: Lỗi xóa cơ sở dữ liệu.
        """
        logger.info("Service: Xóa bản ghi sức khỏe ('%s', '%s')", patient_id, timestamp)
        try:
            record = db.session.get(HealthRecord, (patient_id, timestamp))
            if record is None:
                logger.warning("Service: Không tìm thấy bản ghi sức khỏe để xóa")
                return False

            db.session.delete(record)
            db.session.commit()
            logger.info("Service: Xóa thành công bản ghi sức khỏe")
            return True
        except Exception as error:
            db.session.rollback()
            logger.error("Service: Lỗi khi xóa bản ghi sức khỏe: %s", str(error))
            raise error
