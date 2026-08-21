"""
Patient Isolated Tools for Gemini Function Calling
ElderlyCare AI Medical Assistant (Patient Scope)
"""

from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from database import db
from models.user import User
from models.health_record import HealthRecord
from models.medicine_schedule import MedicineSchedule
from models.prescription import Prescription, PrescriptionItem
from models.alert import Alert
from models.notification import Notification
from models.camera import Camera
from models.patient_memory import AIAuditLog


def _log_tool_access(patient_id: str, tool_name: str, result_count: int = 1, details: str = ""):
    try:
        audit = AIAuditLog(
            user_id=None,
            user_role="PATIENT",
            action_type=f"TOOL_{tool_name.upper()}",
            target_id=patient_id,
            details=f"Results: {result_count}. {details}"[:200],
            status="SUCCESS"
        )
        db.session.add(audit)
        db.session.commit()
    except Exception:
        db.session.rollback()


def _resolve_user(patient_id: str) -> Optional[User]:
    if not patient_id:
        return None
    pid = str(patient_id).strip()
    u = User.query.filter(User.patient_code.ilike(pid)).first()
    if u:
        return u
    digits = "".join([c for c in pid if c.isdigit()])
    if digits:
        val = int(digits)
        u = User.query.filter_by(user_id=val).first()
        if u:
            return u
        u = User.query.filter(
            (User.patient_code.ilike(f"PAT{val:05d}")) |
            (User.patient_code.ilike(f"PAT{val:04d}")) |
            (User.patient_code.ilike(f"PAT{val}"))
        ).first()
        if u:
            return u
    return None


def get_my_profile(patient_id: str) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        _log_tool_access(patient_id, "get_my_profile", 0, "Patient not found")
        return {"found": False, "message": "Chưa tìm thấy hồ sơ trong cơ sở dữ liệu."}

    _log_tool_access(patient_id, "get_my_profile", 1, user.full_name)
    return {
        "found": True,
        "patient_code": user.patient_code or f"PAT{user.user_id:05d}",
        "full_name": user.full_name,
        "age": user.age or 70,
        "gender": user.gender or "Nam",
        "phone": user.phone or "Chưa cập nhật",
        "address": user.address or "Hà Nội",
        "blood_group": user.blood_group or "Chưa xác định",
        "allergy": user.allergy or "Không có dị ứng ghi nhận",
        "caregiver_name": user.caregiver_name or "Người thân gia đình",
        "caregiver_phone": user.caregiver_phone or "0901234567",
        "doctor_name": user.doctor_name or "BS. Chuyên khoa Lão",
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else None
    }


def get_my_latest_health(patient_id: str) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy hồ sơ người dùng."}

    record = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).first()
    if not record:
        _log_tool_access(patient_id, "get_my_latest_health", 0, "No health records")
        return {
            "found": False,
            "patient_code": user.patient_code,
            "message": "Chưa có bản ghi đo sinh hiệu nào trong cơ sở dữ liệu."
        }

    rec_time_str = record.recorded_at.strftime("%H:%M ngày %d/%m/%Y") if record.recorded_at else "Hôm nay"
    temp = getattr(record, "body_temperature", None)
    glucose = getattr(record, "blood_glucose", None)
    risk = getattr(record, "risk_level", "Thấp")
    ai_pred = getattr(record, "ai_prediction", "Ổn định")

    _log_tool_access(patient_id, "get_my_latest_health", 1, f"BP: {record.blood_pressure}, SpO2: {record.spo2}")

    return {
        "found": True,
        "patient_code": user.patient_code,
        "full_name": user.full_name,
        "blood_pressure": record.blood_pressure or "120/80",
        "heart_rate": record.heart_rate or 75,
        "spo2": record.spo2 or 98,
        "temperature": float(temp) if temp else 36.8,
        "blood_sugar": float(glucose) if glucose else 5.8,
        "fall_risk": risk or "Thấp",
        "health_status": ai_pred or "Ổn định",
        "recorded_at": rec_time_str,
        "raw_timestamp": record.recorded_at.isoformat() if record.recorded_at else None
    }


def get_my_health_records(patient_id: str, days: int = 7) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    since_date = datetime.utcnow() - timedelta(days=days or 7)
    records = HealthRecord.query.filter(
        HealthRecord.user_id == user.user_id,
        HealthRecord.recorded_at >= since_date
    ).order_by(HealthRecord.recorded_at.desc()).all()

    items = []
    for r in records:
        temp = getattr(r, "body_temperature", None)
        glucose = getattr(r, "blood_glucose", None)
        ai_pred = getattr(r, "ai_prediction", "Ổn định")
        items.append({
            "recorded_at": r.recorded_at.strftime("%d/%m/%Y %H:%M") if r.recorded_at else None,
            "blood_pressure": r.blood_pressure,
            "heart_rate": r.heart_rate,
            "spo2": r.spo2,
            "temperature": float(temp) if temp else None,
            "blood_sugar": float(glucose) if glucose else None,
            "health_status": ai_pred
        })

    _log_tool_access(patient_id, "get_my_health_records", len(items))
    return {
        "found": True,
        "total_records": len(items),
        "days": days,
        "records": items
    }


def get_my_medications(patient_id: str) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    prescriptions = Prescription.query.filter_by(user_id=user.user_id).all()
    med_list = []
    for p in prescriptions:
        for item in p.items:
            m_name = item.medicine.medicine_name if item.medicine else f"Thuốc #{item.medicine_id}"
            med_list.append({
                "medicine_name": m_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "instruction": item.instruction,
                "duration_days": getattr(item, "quantity", 30),
                "diagnosis": p.diagnosis,
                "doctor_name": p.doctor_name,
                "status": p.status
            })

    _log_tool_access(patient_id, "get_my_medications", len(med_list))
    return {
        "found": True,
        "patient_code": user.patient_code,
        "total_medications": len(med_list),
        "medications": med_list
    }


def get_my_prescriptions(patient_id: str) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    prescriptions = Prescription.query.filter_by(user_id=user.user_id).order_by(Prescription.created_at.desc()).all()
    res = []
    for p in prescriptions:
        res.append({
            "prescription_code": p.prescription_code,
            "diagnosis": p.diagnosis,
            "doctor_name": p.doctor_name,
            "status": p.status,
            "note": getattr(p, "note", None),
            "created_at": p.created_at.strftime("%d/%m/%Y") if p.created_at else None,
            "items_count": len(p.items)
        })

    _log_tool_access(patient_id, "get_my_prescriptions", len(res))
    return {
        "found": True,
        "total_prescriptions": len(res),
        "prescriptions": res
    }


def get_my_medication_schedule(patient_id: str, date_str: str = None) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    target_date = date.today()
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            pass

    schedules = MedicineSchedule.query.filter_by(user_id=user.user_id, scheduled_date=target_date).order_by(MedicineSchedule.take_time.asc()).all()
    items = []
    for s in schedules:
        m_name = "Thuốc theo đơn"
        if s.prescription_item and s.prescription_item.medicine:
            m_name = s.prescription_item.medicine.medicine_name
        elif s.medicine:
            m_name = s.medicine.medicine_name
        items.append({
            "schedule_id": s.schedule_id,
            "medicine_name": m_name,
            "dosage": getattr(s, "dose_amount", "1 viên"),
            "time": s.take_time.strftime("%H:%M") if s.take_time else "08:00",
            "status": s.status or "Chưa uống",
            "note": getattr(s, "note", None)
        })

    _log_tool_access(patient_id, "get_my_medication_schedule", len(items), f"Date: {target_date}")
    return {
        "found": True,
        "date": target_date.strftime("%d/%m/%Y"),
        "total_doses": len(items),
        "schedules": items
    }


def get_my_alerts(patient_id: str, limit: int = 10) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    p_code = user.patient_code or f"PAT{user.user_id:05d}"
    alerts = Alert.query.filter(
        (Alert.patient_id == p_code) |
        (Alert.patient_id == user.patient_code) |
        (Alert.patient_id == str(user.user_id))
    ).order_by(Alert.created_at.desc()).limit(limit or 10).all()
    items = []
    for a in alerts:
        items.append({
            "alert_id": a.alert_id,
            "title": a.title,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "status": a.status,
            "time": a.created_at.strftime("%H:%M ngày %d/%m/%Y") if a.created_at else None
        })

    _log_tool_access(patient_id, "get_my_alerts", len(items))
    return {
        "found": True,
        "total_alerts": len(items),
        "alerts": items
    }


def get_my_notifications(patient_id: str, limit: int = 10) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    notes = Notification.query.filter_by(user_id=user.user_id).order_by(Notification.created_at.desc()).limit(limit or 10).all()
    items = []
    for n in notes:
        items.append({
            "notification_id": n.notification_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "time": n.created_at.strftime("%H:%M ngày %d/%m/%Y") if n.created_at else None
        })

    _log_tool_access(patient_id, "get_my_notifications", len(items))
    return {
        "found": True,
        "total_notifications": len(items),
        "notifications": items
    }


def get_my_camera_status(patient_id: str) -> Dict[str, Any]:
    user = _resolve_user(patient_id)
    if not user:
        return {"found": False, "message": "Không tìm thấy người dùng."}

    p_code = user.patient_code or f"PAT{user.user_id:05d}"
    cams = Camera.query.filter(
        (Camera.patient_id == p_code) |
        (Camera.patient_id == user.patient_code) |
        (Camera.patient_id == str(user.user_id))
    ).all()
    items = []
    for c in cams:
        items.append({
            "camera_id": c.camera_id,
            "camera_name": getattr(c, "camera_name", None) or c.name,
            "location": c.location,
            "status": c.status,
            "room": getattr(c, "room", c.location)
        })

    _log_tool_access(patient_id, "get_my_camera_status", len(items))
    return {
        "found": True,
        "total_cameras": len(items),
        "cameras": items
    }


PATIENT_TOOL_DECLARATIONS = [
    {
        "name": "get_my_profile",
        "description": "Tra cứu hồ sơ cá nhân của người dùng/người thân hiện tại (Tuổi, nhóm máu, dị ứng, người thân, bác sĩ phụ trách)."
    },
    {
        "name": "get_my_latest_health",
        "description": "Tra cứu chỉ số sinh hiệu đo được gần nhất (Huyết áp, Nhịp tim, SpO2, Thân nhiệt, Đường huyết, Đánh giá rủi ro, Thời gian đo)."
    },
    {
        "name": "get_my_health_records",
        "description": "Lấy lịch sử diễn tiến sức khỏe trong các ngày gần đây.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "days": {"type": "INTEGER", "description": "Số ngày cần xem lịch sử (mặc định: 7)"}
            }
        }
    },
    {
        "name": "get_my_medications",
        "description": "Lấy danh sách các loại thuốc hiện đang được chỉ định điều trị và hướng dẫn uống."
    },
    {
        "name": "get_my_prescriptions",
        "description": "Lấy danh sách đơn thuốc và chẩn đoán điều trị của bác sĩ."
    },
    {
        "name": "get_my_medication_schedule",
        "description": "Tra cứu lịch uống thuốc trong ngày (Đã uống / Chưa uống).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "date_str": {"type": "STRING", "description": "Ngày cần xem dạng YYYY-MM-DD (mặc định: hôm nay)"}
            }
        }
    },
    {
        "name": "get_my_alerts",
        "description": "Tra cứu các sự cố té ngã và cảnh báo an toàn gần nhất."
    },
    {
        "name": "get_my_notifications",
        "description": "Tra cứu thông báo nhắc nhở sức khỏe từ hệ thống."
    },
    {
        "name": "get_my_camera_status",
        "description": "Kiểm tra tình trạng camera giám sát phòng của người thân."
    }
]

PATIENT_TOOL_DISPATCHER = {
    "get_my_profile": get_my_profile,
    "get_my_latest_health": get_my_latest_health,
    "get_my_health_records": get_my_health_records,
    "get_my_medications": get_my_medications,
    "get_my_prescriptions": get_my_prescriptions,
    "get_my_medication_schedule": get_my_medication_schedule,
    "get_my_alerts": get_my_alerts,
    "get_my_notifications": get_my_notifications,
    "get_my_camera_status": get_my_camera_status
}
