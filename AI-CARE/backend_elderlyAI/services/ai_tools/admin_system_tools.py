"""
Admin System Tools for Gemini Function Calling
ElderlyCare AI Medical and Management Assistant (Admin Scope)
"""

import unicodedata
import re
import math
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import or_, and_, desc, func
from database import db
from models.user import User
from models.health_record import HealthRecord
from models.medicine import Medicine
from models.medicine_schedule import MedicineSchedule
from models.prescription import Prescription, PrescriptionItem
from models.alert import Alert
from models.notification import Notification
from models.camera import Camera
from models.fall_history import FallHistory
from models.patient_memory import AIAuditLog


def strip_accents(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0300-\u036f]", "", text)
    return text.replace("đ", "d").replace("Đ", "D")


def _log_admin_tool(tool_name: str, action: str, result_count: int = 1, target_id: str = None):
    try:
        audit = AIAuditLog(
            user_id=1,
            user_role="ADMIN",
            action_type=f"ADMIN_TOOL_{tool_name.upper()}",
            target_id=target_id,
            details=f"Action: {action} | Count: {result_count}"[:200],
            status="SUCCESS"
        )
        db.session.add(audit)
        db.session.commit()
    except Exception:
        db.session.rollback()


def _resolve_patient(patient_id: str) -> Optional[User]:
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
    pid_norm = strip_accents(pid).lower()
    for usr in User.query.limit(200).all():
        if pid_norm in strip_accents(usr.full_name or "").lower():
            return usr
    return None


def get_patient_profile(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        _log_admin_tool("get_patient_profile", "Not Found", 0, patient_id)
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}' trong cơ sở dữ liệu."}

    _log_admin_tool("get_patient_profile", "Found Profile", 1, user.patient_code)
    return {
        "found": True,
        "patient_id": user.patient_code or f"PAT{user.user_id:05d}",
        "full_name": user.full_name,
        "age": user.age or 70,
        "gender": user.gender or "Nam",
        "phone": user.phone,
        "address": user.address,
        "blood_group": user.blood_group or "Chưa xác định",
        "allergy": user.allergy or "Không có dị ứng ghi nhận",
        "caregiver_name": user.caregiver_name,
        "caregiver_phone": user.caregiver_phone,
        "doctor_name": user.doctor_name,
        "created_at": user.created_at.strftime("%Y-%m-%d") if user.created_at else None
    }


def get_latest_health_record(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    record = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).first()
    if not record:
        return {"found": False, "patient_code": user.patient_code, "message": "Chưa có bản ghi sinh hiệu."}

    rec_time = record.recorded_at.strftime("%H:%M ngày %d/%m/%Y") if record.recorded_at else "Chưa có mốc thời gian"
    temp = getattr(record, "body_temperature", None)
    glucose = getattr(record, "blood_glucose", None)
    risk = getattr(record, "risk_level", "Thấp")
    ai_pred = getattr(record, "ai_prediction", "Ổn định")

    _log_admin_tool("get_latest_health_record", "Found Record", 1, user.patient_code)
    return {
        "found": True,
        "patient_code": user.patient_code,
        "full_name": user.full_name,
        "blood_pressure": record.blood_pressure,
        "heart_rate": record.heart_rate,
        "spo2": record.spo2,
        "temperature": float(temp) if temp else None,
        "blood_sugar": float(glucose) if glucose else None,
        "fall_risk": risk or "Thấp",
        "health_status": ai_pred,
        "recorded_at": rec_time
    }


def get_patient_health_records(patient_id: str, days: int = 7) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    since = datetime.utcnow() - timedelta(days=days or 7)
    records = HealthRecord.query.filter(
        HealthRecord.user_id == user.user_id,
        HealthRecord.recorded_at >= since
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

    _log_admin_tool("get_patient_health_records", f"History {days} days", len(items), user.patient_code)
    return {
        "found": True,
        "patient_code": user.patient_code,
        "full_name": user.full_name,
        "total_records": len(items),
        "records": items
    }


def get_patient_medications(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    prescriptions = Prescription.query.filter_by(user_id=user.user_id).all()
    meds = []
    for p in prescriptions:
        for it in p.items:
            m_name = it.medicine.medicine_name if it.medicine else f"Thuốc #{it.medicine_id}"
            meds.append({
                "medicine_name": m_name,
                "dosage": it.dosage,
                "frequency": it.frequency,
                "instruction": it.instruction,
                "diagnosis": p.diagnosis,
                "doctor_name": p.doctor_name,
                "status": p.status
            })

    _log_admin_tool("get_patient_medications", "Found Meds", len(meds), user.patient_code)
    return {
        "found": True,
        "patient_code": user.patient_code,
        "full_name": user.full_name,
        "total_medications": len(meds),
        "medications": meds
    }


def get_patient_prescriptions(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    prescriptions = Prescription.query.filter_by(user_id=user.user_id).order_by(Prescription.created_at.desc()).all()
    rxs = [{
        "prescription_code": p.prescription_code,
        "diagnosis": p.diagnosis,
        "doctor_name": p.doctor_name,
        "status": p.status,
        "note": getattr(p, "note", None),
        "created_at": p.created_at.strftime("%d/%m/%Y") if p.created_at else None,
        "items_count": len(p.items)
    } for p in prescriptions]

    _log_admin_tool("get_patient_prescriptions", "Found Rx", len(rxs), user.patient_code)
    return {"found": True, "patient_code": user.patient_code, "total_prescriptions": len(rxs), "prescriptions": rxs}


def get_patient_medication_schedule(patient_id: str, date_str: str = None) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

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

    _log_admin_tool("get_patient_medication_schedule", f"Schedule {target_date}", len(items), user.patient_code)
    return {"found": True, "patient_code": user.patient_code, "date": target_date.strftime("%d/%m/%Y"), "total_doses": len(items), "schedules": items}


def get_patient_alerts(patient_id: str, limit: int = 10) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    p_code = user.patient_code or f"PAT{user.user_id:05d}"
    alerts = Alert.query.filter(
        (Alert.patient_id == p_code) |
        (Alert.patient_id == user.patient_code) |
        (Alert.patient_id == str(user.user_id))
    ).order_by(Alert.created_at.desc()).limit(limit or 10).all()
    items = [{
        "alert_id": a.alert_id,
        "title": a.title,
        "severity": a.severity,
        "status": a.status,
        "time": a.created_at.strftime("%H:%M ngày %d/%m/%Y") if a.created_at else None
    } for a in alerts]

    _log_admin_tool("get_patient_alerts", "Found Alerts", len(items), user.patient_code)
    return {"found": True, "patient_code": user.patient_code, "total_alerts": len(items), "alerts": items}


def get_patient_notifications(patient_id: str, limit: int = 10) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    notes = Notification.query.filter_by(user_id=user.user_id).order_by(Notification.created_at.desc()).limit(limit or 10).all()
    items = [{
        "notification_id": n.notification_id,
        "title": n.title,
        "message": n.message,
        "time": n.created_at.strftime("%H:%M ngày %d/%m/%Y") if n.created_at else None
    } for n in notes]

    _log_admin_tool("get_patient_notifications", "Found Notes", len(items), user.patient_code)
    return {"found": True, "patient_code": user.patient_code, "total_notifications": len(items), "notifications": items}


def get_patient_caregiver(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    return {
        "found": True,
        "patient_code": user.patient_code,
        "patient_name": user.full_name,
        "caregiver_name": user.caregiver_name or "Chưa cập nhật",
        "caregiver_phone": user.caregiver_phone or "Chưa cập nhật",
        "caregiver_relation": user.caregiver_relation or "Thân nhân"
    }


def get_patient_doctor(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    return {
        "found": True,
        "patient_code": user.patient_code,
        "patient_name": user.full_name,
        "doctor_name": user.doctor_name or "BS. Chuyên khoa Lão"
    }


def get_patient_camera_status(patient_id: str) -> Dict[str, Any]:
    user = _resolve_patient(patient_id)
    if not user:
        return {"found": False, "message": f"Không tìm thấy bệnh nhân '{patient_id}'."}

    p_code = user.patient_code or f"PAT{user.user_id:05d}"
    cams = Camera.query.filter(
        (Camera.patient_id == p_code) |
        (Camera.patient_id == user.patient_code) |
        (Camera.patient_id == str(user.user_id))
    ).all()
    items = [{
        "camera_id": c.camera_id,
        "name": getattr(c, "camera_name", None) or c.name,
        "location": c.location,
        "status": c.status
    } for c in cams]

    _log_admin_tool("get_patient_camera_status", "Found Cameras", len(items), user.patient_code)
    return {"found": True, "patient_code": user.patient_code, "total_cameras": len(items), "cameras": items}


def _format_patient_list_result(query_obj, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    page = max(1, page)
    limit = max(1, min(100, limit))
    total = query_obj.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1

    users = query_obj.offset((page - 1) * limit).limit(limit).all()
    results = []
    for u in users:
        latest_hr = HealthRecord.query.filter_by(user_id=u.user_id).order_by(HealthRecord.recorded_at.desc()).first()
        risk = getattr(latest_hr, "risk_level", "Thấp") if latest_hr else "Thấp"
        ai_pred = getattr(latest_hr, "ai_prediction", "Ổn định") if latest_hr else "Ổn định"
        results.append({
            "patient_code": u.patient_code or f"PAT{u.user_id:05d}",
            "full_name": u.full_name,
            "age": u.age,
            "gender": u.gender,
            "phone": u.phone,
            "allergy": u.allergy,
            "blood_pressure": latest_hr.blood_pressure if latest_hr else None,
            "spo2": latest_hr.spo2 if latest_hr else None,
            "health_status": ai_pred,
            "fall_risk": risk
        })

    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
        "results": results
    }


def search_patients(query: str = "", page: int = 1, limit: int = 20) -> Dict[str, Any]:
    base_q = User.query.filter(User.is_active != False)
    if query:
        q_clean = query.strip()
        base_q = base_q.filter(
            or_(
                User.patient_code.ilike(f"%{q_clean}%"),
                User.full_name.ilike(f"%{q_clean}%"),
                User.phone.ilike(f"%{q_clean}%"),
                User.address.ilike(f"%{q_clean}%"),
                User.allergy.ilike(f"%{q_clean}%")
            )
        )
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients", f"Query: {query}", res["total"])
    return res


def search_patients_by_name(name: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    base_q = User.query.filter(User.is_active != False)
    if name:
        base_q = base_q.filter(User.full_name.ilike(f"%{name.strip()}%"))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_name", f"Name: {name}", res["total"])
    return res


def search_patients_by_disease(disease: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    dis_clean = (disease or "").strip()
    subq = db.session.query(Prescription.user_id).filter(Prescription.diagnosis.ilike(f"%{dis_clean}%"))
    base_q = User.query.filter(User.is_active != False, User.user_id.in_(subq))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_disease", f"Disease: {disease}", res["total"])
    return res


def search_patients_by_allergy(allergy: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    all_clean = (allergy or "").strip()
    base_q = User.query.filter(User.is_active != False, User.allergy.ilike(f"%{all_clean}%"))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_allergy", f"Allergy: {allergy}", res["total"])
    return res


def search_patients_by_medicine(medicine_name: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    med_clean = (medicine_name or "").strip()
    subq = db.session.query(Prescription.user_id).join(PrescriptionItem).filter(PrescriptionItem.medicine_name.ilike(f"%{med_clean}%"))
    base_q = User.query.filter(User.is_active != False, User.user_id.in_(subq))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_medicine", f"Medicine: {medicine_name}", res["total"])
    return res


def search_patients_by_risk_level(risk_level: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    r_clean = (risk_level or "").strip()
    subq = db.session.query(HealthRecord.user_id).filter(HealthRecord.risk_level.ilike(f"%{r_clean}%"))
    base_q = User.query.filter(User.is_active != False, User.user_id.in_(subq))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_risk_level", f"Risk: {risk_level}", res["total"])
    return res


def search_patients_by_fall_risk(fall_risk_level: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    r_clean = (fall_risk_level or "").strip()
    subq = db.session.query(HealthRecord.user_id).filter(
        or_(
            HealthRecord.risk_level.ilike(f"%{r_clean}%"),
            HealthRecord.fall_history.ilike(f"%{r_clean}%")
        )
    )
    base_q = User.query.filter(User.is_active != False, User.user_id.in_(subq))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_fall_risk", f"Fall Risk: {fall_risk_level}", res["total"])
    return res


def search_patients_by_health_status(status_criteria: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    s_clean = (status_criteria or "").strip()
    subq = db.session.query(HealthRecord.user_id).filter(
        or_(
            HealthRecord.ai_prediction.ilike(f"%{s_clean}%"),
            HealthRecord.risk_level.ilike(f"%{s_clean}%")
        )
    )
    base_q = User.query.filter(User.is_active != False, User.user_id.in_(subq))
    res = _format_patient_list_result(base_q, page, limit)
    _log_admin_tool("search_patients_by_health_status", f"Status: {status_criteria}", res["total"])
    return res


def search_unmedicated_patients(date_str: str = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    today = date.today()
    schedules = MedicineSchedule.query.filter(
        MedicineSchedule.status == "Chưa uống"
    ).all()

    total = len(schedules)
    page = max(1, page)
    limit = max(1, min(100, limit))
    total_pages = math.ceil(total / limit) if total > 0 else 1

    paged = schedules[(page - 1) * limit : page * limit]
    results = []
    for s in paged:
        u = db.session.get(User, s.user_id) if s.user_id else None
        p_code = u.patient_code if u else f"PAT{s.user_id:05d}"
        p_name = u.full_name if u else "Bệnh nhân"
        dict_rep = s.to_dict()
        results.append({
            "schedule_id": s.schedule_id,
            "patient_code": p_code,
            "patient_name": p_name,
            "medicine_name": dict_rep.get("medicine_name", "Thuốc chỉ định"),
            "dosage": dict_rep.get("dosage", "1 viên"),
            "time": dict_rep.get("time", "08:00"),
            "status": s.status
        })

    _log_admin_tool("search_unmedicated_patients", f"Date: {today}", total)
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
        "results": results
    }


def get_system_statistics() -> Dict[str, Any]:
    total_patients = User.query.filter(User.is_active != False).count()
    total_cameras = Camera.query.count()
    online_cameras = Camera.query.filter(Camera.status.ilike("online")).count()
    active_alerts = Alert.query.filter(Alert.status != "Đã xử lý").count()
    high_fall_risk_count = HealthRecord.query.filter(HealthRecord.risk_level.ilike("%cao%")).count()

    _log_admin_tool("get_system_statistics", "System Summary", 1)
    return {
        "success": True,
        "total_patients": total_patients,
        "total_cameras": total_cameras,
        "online_cameras": online_cameras,
        "active_alerts": active_alerts,
        "high_fall_risk_patients": high_fall_risk_count
    }


def get_system_alerts() -> Dict[str, Any]:
    alerts = Alert.query.filter(Alert.status != "Đã xử lý").order_by(Alert.created_at.desc()).limit(30).all()
    items = []
    for a in alerts:
        p_name = "N/A"
        if a.patient_id:
            u = User.query.filter((User.patient_code == a.patient_id) | (User.user_id == (int(a.patient_id[3:]) if a.patient_id.startswith("PAT") and a.patient_id[3:].isdigit() else -1))).first()
            if u:
                p_name = u.full_name
        items.append({
            "alert_id": a.alert_id,
            "patient_code": a.patient_id or "N/A",
            "patient_name": p_name,
            "title": a.title,
            "severity": a.severity,
            "status": a.status,
            "time": a.created_at.strftime("%H:%M ngày %d/%m/%Y") if a.created_at else None
        })

    _log_admin_tool("get_system_alerts", "Active System Alerts", len(items))
    return {"success": True, "total": len(items), "alerts": items}


def get_camera_status() -> Dict[str, Any]:
    cams = Camera.query.all()
    items = []
    for c in cams:
        p_name = "Chưa gán"
        if c.patient_id:
            u = User.query.filter((User.patient_code == c.patient_id) | (User.user_id == (int(c.patient_id[3:]) if c.patient_id.startswith("PAT") and c.patient_id[3:].isdigit() else -1))).first()
            if u:
                p_name = u.full_name
        items.append({
            "camera_id": c.camera_id,
            "name": getattr(c, "camera_name", None) or c.name,
            "location": c.location,
            "status": c.status,
            "assigned_patient": p_name
        })

    _log_admin_tool("get_camera_status", "All Cameras", len(items))
    return {"success": True, "total": len(items), "cameras": items}


def get_recent_alerts(limit: int = 20) -> Dict[str, Any]:
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(limit or 20).all()
    items = []
    for a in alerts:
        p_name = "N/A"
        if a.patient_id:
            u = User.query.filter((User.patient_code == a.patient_id) | (User.user_id == (int(a.patient_id[3:]) if a.patient_id.startswith("PAT") and a.patient_id[3:].isdigit() else -1))).first()
            if u:
                p_name = u.full_name
        items.append({
            "alert_id": a.alert_id,
            "patient_code": a.patient_id or "N/A",
            "patient_name": p_name,
            "title": a.title,
            "severity": a.severity,
            "status": a.status,
            "time": a.created_at.strftime("%H:%M ngày %d/%m/%Y") if a.created_at else None
        })

    _log_admin_tool("get_recent_alerts", f"Recent {limit}", len(items))
    return {"success": True, "total": len(items), "alerts": items}


ADMIN_TOOL_DECLARATIONS = [
    {
        "name": "get_patient_profile",
        "description": "Tra cứu thông tin hồ sơ nhân khẩu học, thông tin cá nhân và người liên hệ của một bệnh nhân theo mã định danh (Ví dụ: PAT10000).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân (PAT10000) hoặc Tên"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_latest_health_record",
        "description": "Tra cứu chỉ số sinh hiệu đo được gần nhất của bệnh nhân (Huyết áp, Nhịp tim, SpO2, Thân nhiệt, Đường huyết, Thời gian đo).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_health_records",
        "description": "Tra cứu lịch sử sinh hiệu và diễn tiến sức khỏe của bệnh nhân trong các ngày gần đây.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"},
                "days": {"type": "INTEGER", "description": "Số ngày xem lịch sử (mặc định: 7)"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_medications",
        "description": "Tra cứu danh sách các loại thuốc đang được chỉ định điều trị cho bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_prescriptions",
        "description": "Tra cứu danh sách đơn thuốc và chẩn đoán điều trị của bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_medication_schedule",
        "description": "Tra cứu lịch uống thuốc trong ngày của bệnh nhân (Đã uống / Chưa uống).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"},
                "date_str": {"type": "STRING", "description": "Ngày dạng YYYY-MM-DD (mặc định hôm nay)"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_alerts",
        "description": "Tra cứu các sự cố té ngã và cảnh báo của một bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_notifications",
        "description": "Tra cứu danh sách thông báo nhắc nhở của bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_caregiver",
        "description": "Tra cứu thông tin người thân/người chăm sóc của bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_doctor",
        "description": "Tra cứu thông tin bác sĩ phụ trách của bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "get_patient_camera_status",
        "description": "Tra cứu camera phòng của một bệnh nhân.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "patient_id": {"type": "STRING", "description": "Mã bệnh nhân"}
            },
            "required": ["patient_id"]
        }
    },
    {
        "name": "search_patients",
        "description": "Tìm kiếm bệnh nhân theo từ khóa chung hỗ trợ phân trang.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Từ khóa tìm kiếm"},
                "page": {"type": "INTEGER", "description": "Số trang (mặc định: 1)"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi mỗi trang (mặc định: 20)"}
            }
        }
    },
    {
        "name": "search_patients_by_name",
        "description": "Tìm kiếm bệnh nhân theo họ và tên.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING", "description": "Tên bệnh nhân"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi mỗi trang"}
            },
            "required": ["name"]
        }
    },
    {
        "name": "search_patients_by_disease",
        "description": "Tìm kiếm bệnh nhân theo bệnh nền hoặc chẩn đoán điều trị (Tăng huyết áp, Đái tháo đường, COPD, v.v.).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "disease": {"type": "STRING", "description": "Tên bệnh nền"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["disease"]
        }
    },
    {
        "name": "search_patients_by_allergy",
        "description": "Tìm kiếm bệnh nhân theo loại dị ứng ghi nhận (Penicillin, Phấn hoa, Hải sản, v.v.).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "allergy": {"type": "STRING", "description": "Tên chất dị ứng"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["allergy"]
        }
    },
    {
        "name": "search_patients_by_medicine",
        "description": "Tìm kiếm bệnh nhân đang sử dụng một loại thuốc cụ thể (Amlodipine, Omeprazole, v.v.).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "medicine_name": {"type": "STRING", "description": "Tên thuốc"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["medicine_name"]
        }
    },
    {
        "name": "search_patients_by_risk_level",
        "description": "Tìm kiếm bệnh nhân theo mức độ rủi ro sức khỏe chung (Cao, Trung bình, Thấp).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "risk_level": {"type": "STRING", "description": "Mức độ rủi ro ('Cao', 'Trung bình', 'Thấp')"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["risk_level"]
        }
    },
    {
        "name": "search_patients_by_fall_risk",
        "description": "Tìm kiếm bệnh nhân theo mức độ nguy cơ té ngã (Cao, Trung bình, Thấp).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "fall_risk_level": {"type": "STRING", "description": "Mức độ nguy cơ ngã ('Cao', 'Trung bình', 'Thấp')"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["fall_risk_level"]
        }
    },
    {
        "name": "search_patients_by_health_status",
        "description": "Tìm kiếm bệnh nhân theo tình trạng sức khỏe (Bất thường, Cần theo dõi, Ổn định).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "status_criteria": {"type": "STRING", "description": "Trạng thái sức khỏe"},
                "page": {"type": "INTEGER", "description": "Số trang"},
                "limit": {"type": "INTEGER", "description": "Số bản ghi"}
            },
            "required": ["status_criteria"]
        }
    },
    {
        "name": "get_system_statistics",
        "description": "Lấy số liệu thống kê tổng thể toàn hệ thống (Tổng bệnh nhân, tổng camera, camera online, cảnh báo mở, bệnh nhân nguy cơ ngã cao)."
    },
    {
        "name": "get_system_alerts",
        "description": "Lấy danh sách tất cả các cảnh báo đang hoạt động trong toàn hệ thống."
    },
    {
        "name": "get_camera_status",
        "description": "Lấy danh sách và trạng thái hoạt động của toàn bộ camera giám sát."
    },
    {
        "name": "get_recent_alerts",
        "description": "Lấy danh sách các sự cố và cảnh báo mới nhất toàn viện.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "limit": {"type": "INTEGER", "description": "Số lượng bản ghi"}
            }
        }
    }
]

ADMIN_TOOL_DISPATCHER = {
    "get_patient_profile": get_patient_profile,
    "get_latest_health_record": get_latest_health_record,
    "get_patient_health_records": get_patient_health_records,
    "get_patient_medications": get_patient_medications,
    "get_patient_prescriptions": get_patient_prescriptions,
    "get_patient_medication_schedule": get_patient_medication_schedule,
    "get_patient_alerts": get_patient_alerts,
    "get_patient_notifications": get_patient_notifications,
    "get_patient_caregiver": get_patient_caregiver,
    "get_patient_doctor": get_patient_doctor,
    "get_patient_camera_status": get_patient_camera_status,
    "search_patients": search_patients,
    "search_patients_by_name": search_patients_by_name,
    "search_patients_by_disease": search_patients_by_disease,
    "search_patients_by_allergy": search_patients_by_allergy,
    "search_patients_by_medicine": search_patients_by_medicine,
    "search_patients_by_risk_level": search_patients_by_risk_level,
    "search_patients_by_fall_risk": search_patients_by_fall_risk,
    "search_patients_by_health_status": search_patients_by_health_status,
    "get_system_statistics": get_system_statistics,
    "get_system_alerts": get_system_alerts,
    "get_camera_status": get_camera_status,
    "get_recent_alerts": get_recent_alerts,
    "search_unmedicated_patients": search_unmedicated_patients
}
