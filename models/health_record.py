# ==========================================================
# health_record.py
# Model HealthRecord quản lý các bản ghi chỉ số sức khỏe bệnh nhân
# Khớp 100% với bảng `health_records` trong Database MySQL
# ==========================================================

from __future__ import annotations

from typing import Any, Dict

from database import db


# ==========================================================
# Model HealthRecord
# ==========================================================

class HealthRecord(db.Model):
    """
    Model lưu trữ các thông số sức khỏe, lịch sử té ngã và dự đoán AI.
    Bảng: health_records
    """

    __tablename__ = "health_records"

    # ======================================================
    # Các trường dữ liệu (Khớp 100% cột trong MySQL)
    # ======================================================

    patient_id = db.Column(
        db.String(50),
        db.ForeignKey("patients.patient_id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        doc="Mã bệnh nhân (Primary Key / Foreign Key)"
    )

    timestamp = db.Column(
        db.String(50),
        primary_key=True,
        nullable=False,
        doc="Thời gian ghi nhận chỉ số (Primary Key)"
    )

    blood_pressure = db.Column(
        db.String(50),
        nullable=True,
        doc="Huyết áp (VD: 120/80)"
    )

    heart_rate = db.Column(
        db.Integer,
        nullable=True,
        doc="Nhịp tim (bpm)"
    )

    spo2 = db.Column(
        db.Integer,
        nullable=True,
        doc="Nồng độ Oxy trong máu SpO2 (%)"
    )

    body_temperature = db.Column(
        db.Float,
        nullable=True,
        doc="Thân nhiệt (°C)"
    )

    blood_glucose = db.Column(
        db.Integer,
        nullable=True,
        doc="Chỉ số đường huyết (mg/dL)"
    )

    disease = db.Column(
        db.Text,
        nullable=True,
        doc="Bệnh lý kèm theo"
    )

    fall_history = db.Column(
        db.Text,
        nullable=True,
        doc="Lịch sử té ngã"
    )

    fall_risk_score = db.Column(
        db.Integer,
        nullable=True,
        doc="Điểm rủi ro té ngã"
    )

    risk_level = db.Column(
        db.String(50),
        nullable=True,
        doc="Mức độ rủi ro sức khỏe (Thấp/Trung bình/Cao)"
    )

    adherence_rate = db.Column(
        db.Integer,
        nullable=True,
        doc="Tỷ lệ tuân thủ điều trị (%)"
    )

    ai_prediction = db.Column(
        db.Text,
        nullable=True,
        doc="Kết quả chẩn đoán / dự đoán từ AI"
    )

    # ======================================================
    # Quan hệ giữa các bảng (Relationships)
    # ======================================================

    patient = db.relationship(
        "Patient",
        back_populates="health_records",
        lazy="select"
    )

    # ======================================================
    # Serialization
    # ======================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Chuyển đổi đối tượng Model HealthRecord thành Dictionary JSON.

        Returns:
            Dict[str, Any]: Dữ liệu bản ghi sức khỏe dạng Dictionary.
        """
        return {
            "patient_id": self.patient_id,
            "timestamp": self.timestamp,
            "blood_pressure": self.blood_pressure,
            "heart_rate": self.heart_rate,
            "spo2": self.spo2,
            "body_temperature": self.body_temperature,
            "blood_glucose": self.blood_glucose,
            "disease": self.disease,
            "fall_history": self.fall_history,
            "fall_risk_score": self.fall_risk_score,
            "risk_level": self.risk_level,
            "adherence_rate": self.adherence_rate,
            "ai_prediction": self.ai_prediction,
        }

    # ======================================================
    # Representation
    # ======================================================

    def __repr__(self) -> str:
        """
        Chuỗi đại diện mô tả đối tượng HealthRecord.

        Returns:
            str: Chuỗi thông tin ngắn gọn.
        """
        return f"<HealthRecord patient_id='{self.patient_id}', timestamp='{self.timestamp}'>"
