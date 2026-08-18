"""
Alert Service & Lifecycle Manager
Manages Alert State Machine: DETECTED -> CONFIRMED -> ALERTED -> ACKNOWLEDGED -> RESOLVED
"""
from datetime import datetime
from database import db
from models.alert import Alert
from models.camera import Camera
from models.user import User
from services.auth_permission_service import AuthPermissionService

INITIAL_ALERTS = [
    {
        "patient_id": "PAT10000",
        "camera_id": 1,
        "alert_type": "FALL",
        "title": "CẢNH BÁO TÉ NGÃ KHẨN CẤP",
        "severity": "CRITICAL",
        "confidence": 0.94,
        "status": "ALERTED",
        "location": "Phòng Ngủ 101",
        "spine_angle": 78.5,
        "duration_seconds": 14
    },
    {
        "patient_id": "PAT10002",
        "camera_id": 3,
        "alert_type": "ABNORMAL_MOVEMENT",
        "title": "BẤT THƯỜNG TRONG NHÀ VỆ SINH",
        "severity": "WARNING",
        "confidence": 0.88,
        "status": "ACKNOWLEDGED",
        "location": "Nhà Vệ Sinh Tầng 1",
        "spine_angle": 52.0,
        "duration_seconds": 8,
        "acknowledged_by": "Điều dưỡng trực ca"
    },
    {
        "patient_id": "PAT10001",
        "camera_id": 2,
        "alert_type": "FALL",
        "title": "ĐÃ XỬ LÝ KHÔI PHỤC BÌNH THƯỜNG",
        "severity": "INFO",
        "confidence": 0.91,
        "status": "RESOLVED",
        "location": "Phòng Khách Trung Tâm",
        "spine_angle": 12.0,
        "duration_seconds": 0,
        "acknowledged_by": "Bác sĩ phụ trách",
        "resolved_by": "Bác sĩ phụ trách",
        "resolution_note": "Bệnh nhân trượt chân nhẹ, đã được hỗ trợ đứng dậy an toàn."
    }
]

def seed_alerts_if_empty():
    try:
        count = Alert.query.count()
        if count == 0:
            for item in INITIAL_ALERTS:
                al = Alert(
                    patient_id=item["patient_id"],
                    camera_id=item.get("camera_id"),
                    alert_type=item.get("alert_type", "FALL"),
                    title=item.get("title", "Cảnh báo"),
                    severity=item.get("severity", "CRITICAL"),
                    confidence=item.get("confidence", 0.92),
                    status=item.get("status", "ALERTED"),
                    location=item.get("location", "Phòng Ngủ"),
                    spine_angle=item.get("spine_angle", 78.5),
                    duration_seconds=item.get("duration_seconds", 14),
                    acknowledged_by=item.get("acknowledged_by"),
                    resolved_by=item.get("resolved_by"),
                    resolution_note=item.get("resolution_note"),
                    alert_created_at=datetime.utcnow()
                )
                db.session.add(al)
            db.session.commit()
    except Exception:
        db.session.rollback()

class AlertService:
    @staticmethod
    def get_alerts(user_role="Admin", user_id=None, status=None, limit=50):
        seed_alerts_if_empty()
        query = Alert.query

        # Enforce RBAC Patient Scope
        if (user_role or "").upper() != "ADMIN":
            allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
            query = query.filter(Alert.patient_id.in_(allowed_ids))

        if status:
            query = query.filter_by(status=status)

        alerts = query.order_by(Alert.alert_created_at.desc()).limit(limit).all()
        
        results = []
        for a in alerts:
            d = a.to_dict()
            # Enrich with patient name
            u = User.query.filter_by(patient_code=a.patient_id).first()
            d["patient_name"] = u.full_name if u else a.patient_id
            d["age"] = u.age if u else 70
            d["gender"] = u.gender if u else "Nam"
            d["caregiver_name"] = u.caregiver_name if u else "Người thân"
            d["caregiver_phone"] = u.caregiver_phone if u else "0987654321"
            results.append(d)

        return results

    @staticmethod
    def acknowledge_alert(alert_id, acknowledged_by="Quản trị viên"):
        alert = db.session.get(Alert, alert_id)
        if not alert:
            return None

        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by = acknowledged_by
        db.session.commit()
        return alert.to_dict()

    @staticmethod
    def resolve_alert(alert_id, resolved_by="Bác sĩ / Quản trị viên", resolution_note="Đã kiểm tra an toàn"):
        alert = db.session.get(Alert, alert_id)
        if not alert:
            return None

        alert.status = "RESOLVED"
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = resolved_by
        alert.resolution_note = resolution_note
        db.session.commit()
        return alert.to_dict()

    @staticmethod
    def create_alert(data):
        alert = Alert(
            patient_id=data.get("patient_id", "PAT10000"),
            camera_id=data.get("camera_id"),
            event_id=data.get("event_id"),
            alert_type=data.get("alert_type", "FALL"),
            title=data.get("title", "CẢNH BÁO TÉ NGÃ PHÁT HIỆN QUA CAMERA AI"),
            severity=data.get("severity", "CRITICAL"),
            confidence=float(data.get("confidence", 0.94)),
            status="ALERTED",
            location=data.get("location", "Phòng Ngủ"),
            spine_angle=float(data.get("spine_angle", 78.5)),
            duration_seconds=int(data.get("duration_seconds", 14)),
            alert_created_at=datetime.utcnow()
        )
        db.session.add(alert)
        db.session.commit()
        return alert.to_dict()
