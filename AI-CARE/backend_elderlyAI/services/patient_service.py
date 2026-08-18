from datetime import datetime
from sqlalchemy import or_, func
from sqlalchemy.orm import selectinload
from database import db
from models.user import User
from models.health_record import HealthRecord
from models.fall_history import FallHistory

def _resolve_user(id_or_code):
    """
    Tìm kiếm User/Patient linh hoạt theo user_id số nguyên hoặc patient_code dạng chuỗi ('PAT10000').
    """
    if id_or_code is None:
        return None
    
    # Thử tìm theo user_id số nguyên
    if isinstance(id_or_code, int) or (isinstance(id_or_code, str) and id_or_code.isdigit()):
        user = db.session.get(User, int(id_or_code))
        if user and getattr(user, "is_active", True) is not False:
            return user
        if user and getattr(user, "is_active", True) is False:
            return None

    # Thử tìm theo patient_code dạng chuỗi
    code_str = str(id_or_code).strip()
    user = User.query.filter(
        User.patient_code.ilike(code_str),
        or_(User.is_active.is_(True), User.is_active.is_(None))
    ).first()
    if user:
        return user

    # Thử tìm theo full_name nếu chuỗi là tên
    user = User.query.filter(
        User.full_name.ilike(f"%{code_str}%"),
        or_(User.is_active.is_(True), User.is_active.is_(None))
    ).first()
    return user


def _user_to_dict(user):
    records = getattr(user, "health_records", [])
    health_record = sorted(records, key=lambda r: r.recorded_at or datetime.min, reverse=True)[0] if records else None
    falls = getattr(user, "fall_history", [])
    recent_falls = len(falls)

    hr_data = None
    if health_record:
        hr_data = {
            "record_id": health_record.record_id,
            "recorded_at": health_record.recorded_at.isoformat() if health_record.recorded_at else None,
            "blood_pressure": health_record.blood_pressure,
            "heart_rate": health_record.heart_rate,
            "spo2": health_record.spo2,
            "body_temperature": health_record.body_temperature,
            "blood_glucose": health_record.blood_glucose,
            "disease": health_record.disease,
            "fall_history": health_record.fall_history,
            "fall_risk_score": health_record.fall_risk_score,
            "risk_level": health_record.risk_level,
            "adherence_rate": health_record.adherence_rate,
            "ai_prediction": health_record.ai_prediction,
        }

    disease_name = health_record.disease if health_record else None

    return {
        "user_id": user.user_id,
        "id": user.user_id,
        "patient_id": user.patient_code or f"PAT{user.user_id:05d}",
        "patient_code": user.patient_code or f"PAT{user.user_id:05d}",
        "device_id": user.device_id or f"DEV{user.user_id:04d}",
        "full_name": user.full_name or "Chưa cập nhật",
        "fullName": user.full_name or "Chưa cập nhật",
        "name": user.full_name or "Chưa cập nhật",
        "age": user.age or 70,
        "gender": user.gender or "Nam",
        "phone": user.phone or "0912345678",
        "height_cm": user.height_cm or 165,
        "weight_kg": user.weight_kg or 62,
        "blood_group": user.blood_group or "O+",
        "bloodType": user.blood_group or "O+",
        "allergy": user.allergy or "Không có",
        "caregiver_name": user.caregiver_name or "Người thân",
        "caregiver_relation": getattr(user, "caregiver_relation", None) or "Con trai",
        "caregiver_age": getattr(user, "caregiver_age", None) or 42,
        "caregiver_phone": user.caregiver_phone or user.emergency_contact or "0987654321",
        "caregiver_email": getattr(user, "caregiver_email", None) or "family@elderly.ai",
        "relativeName": user.caregiver_name or "Người thân",
        "relativeRelation": getattr(user, "caregiver_relation", None) or "Con trai",
        "relativeAge": getattr(user, "caregiver_age", None) or 42,
        "relativePhone": user.caregiver_phone or user.emergency_contact or "0987654321",
        "relativeEmail": getattr(user, "caregiver_email", None) or "family@elderly.ai",
        "medical_history": disease_name or user.address or "Theo dõi định kỳ",
        "medicalConditions": disease_name or user.address or "Theo dõi định kỳ",
        "emergencyContact": f"{user.caregiver_name or 'Người thân'} - {user.caregiver_phone or '0987654321'}",
        "emergency_contact": user.emergency_contact or user.caregiver_phone,
        "doctor_name": user.doctor_name or "BS. Nguyễn Thanh Tùng",
        "address": user.address or "Hà Nội",
        "health_record": hr_data,
        "fall_count": recent_falls,
        "is_active": getattr(user, "is_active", True),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


class PatientService:
    @staticmethod
    def get_all(page=1, per_page=20, keyword=None):
        query = User.query.options(
            selectinload(User.health_records),
            selectinload(User.fall_history)
        ).filter(
            or_(User.is_active.is_(True), User.is_active.is_(None))
        )

        if keyword:
            kw = f"%{keyword.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(kw),
                    User.patient_code.ilike(kw),
                    User.phone.ilike(kw),
                    User.doctor_name.ilike(kw),
                    User.caregiver_name.ilike(kw),
                    User.device_id.ilike(kw)
                )
            )

        total = query.count()
        users = query.order_by(User.user_id.asc()).offset((page - 1) * per_page).limit(per_page).all()
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1

        return {
            "items": [_user_to_dict(user) for user in users],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }

    @staticmethod
    def get_by_id(id):
        user = _resolve_user(id)
        if not user:
            return None
        return _user_to_dict(user)

    @staticmethod
    def statistics():
        total_patients = User.query.filter(or_(User.is_active.is_(True), User.is_active.is_(None))).count()
        high_risk = HealthRecord.query.filter(HealthRecord.risk_level == "Cao").count()
        medium_risk = HealthRecord.query.filter(HealthRecord.risk_level == "Trung bình").count()
        low_risk = HealthRecord.query.filter(HealthRecord.risk_level == "Thấp").count()
        fall_risk_ai = HealthRecord.query.filter(HealthRecord.ai_prediction == "Nguy cơ té ngã").count()
        forget_med_ai = HealthRecord.query.filter(HealthRecord.ai_prediction == "Có nguy cơ quên thuốc").count()
        total_falls = FallHistory.query.count()

        return {
            "totalPatients": total_patients,
            "highRiskPatients": high_risk,
            "mediumRiskPatients": medium_risk,
            "lowRiskPatients": low_risk,
            "fallRiskAIPredictions": fall_risk_ai,
            "forgetMedAIPredictions": forget_med_ai,
            "totalFalls": total_falls
        }

    @staticmethod
    def create(data):
        full_name = (data.get("full_name") or data.get("fullName") or data.get("name") or "").strip()
        if not full_name:
            raise ValueError("Họ và tên bệnh nhân là bắt buộc.")

        last_id = db.session.query(func.max(User.user_id)).scalar() or 0
        new_id = last_id + 1
        patient_code = data.get("patient_code") or f"PAT{new_id:05d}"
        device_id = data.get("device_id") or f"DEV{new_id:04d}"

        user = User(
            patient_code=patient_code,
            device_id=device_id,
            full_name=full_name,
            age=int(data.get("age") or 70),
            gender=data.get("gender") or "Nam",
            phone=data.get("phone") or "",
            height_cm=int(data.get("height_cm") or data.get("height") or 165),
            weight_kg=int(data.get("weight_kg") or data.get("weight") or 62),
            blood_group=data.get("blood_group") or data.get("bloodType") or "O+",
            allergy=data.get("allergy") or "Không có",
            address=data.get("address") or "",
            caregiver_name=data.get("caregiver_name") or data.get("relativeName") or "",
            caregiver_relation=data.get("caregiver_relation") or data.get("relativeRelation") or "Người thân",
            caregiver_age=int(data.get("caregiver_age") or data.get("relativeAge") or 40),
            caregiver_phone=data.get("caregiver_phone") or data.get("relativePhone") or "",
            caregiver_email=data.get("caregiver_email") or data.get("relativeEmail") or "",
            emergency_contact=data.get("emergency_contact") or data.get("emergencyContact") or data.get("caregiver_phone") or "",
            doctor_name=data.get("doctor_name") or "BS. Nguyễn Thanh Tùng",
            is_active=True
        )
        db.session.add(user)
        db.session.flush()

        # Tạo hồ sơ sinh hiệu ban đầu
        hr = HealthRecord(
            user_id=user.user_id,
            blood_pressure="120/80",
            heart_rate=76,
            spo2=98,
            body_temperature=36.8,
            blood_glucose=95,
            disease=data.get("medical_history") or data.get("medicalConditions") or "Theo dõi sức khỏe định kỳ",
            fall_history="Không",
            fall_risk_score=15,
            risk_level="Thấp",
            adherence_rate=100,
            ai_prediction="An toàn"
        )
        db.session.add(hr)
        db.session.commit()
        return _user_to_dict(user)

    @staticmethod
    def update(id, data):
        user = _resolve_user(id)
        if not user:
            return None

        if "full_name" in data or "fullName" in data or "name" in data:
            user.full_name = (data.get("full_name") or data.get("fullName") or data.get("name") or "").strip()
        if "age" in data and data.get("age") is not None:
            user.age = int(data.get("age"))
        if "gender" in data and data.get("gender"):
            user.gender = data.get("gender")
        if "phone" in data:
            user.phone = data.get("phone")
        if "device_id" in data:
            user.device_id = data.get("device_id")
        if "height_cm" in data or "height" in data:
            val = data.get("height_cm") or data.get("height")
            if val: user.height_cm = int(val)
        if "weight_kg" in data or "weight" in data:
            val = data.get("weight_kg") or data.get("weight")
            if val: user.weight_kg = int(val)
        if "blood_group" in data or "bloodType" in data:
            user.blood_group = data.get("blood_group") or data.get("bloodType")
        if "allergy" in data:
            user.allergy = data.get("allergy")
        if "address" in data:
            user.address = data.get("address")
        if "emergency_contact" in data or "emergencyContact" in data:
            user.emergency_contact = data.get("emergency_contact") or data.get("emergencyContact")
        if "doctor_name" in data:
            user.doctor_name = data.get("doctor_name")
        if "caregiver_name" in data or "relativeName" in data:
            user.caregiver_name = data.get("caregiver_name") or data.get("relativeName")
        if "caregiver_relation" in data or "relativeRelation" in data:
            user.caregiver_relation = data.get("caregiver_relation") or data.get("relativeRelation")
        if "caregiver_age" in data or "relativeAge" in data:
            val = data.get("caregiver_age") or data.get("relativeAge")
            if val: user.caregiver_age = int(val)
        if "caregiver_phone" in data or "relativePhone" in data:
            user.caregiver_phone = data.get("caregiver_phone") or data.get("relativePhone")
        if "caregiver_email" in data or "relativeEmail" in data:
            user.caregiver_email = data.get("caregiver_email") or data.get("relativeEmail")

        # Cập nhật thông tin bệnh lý vào HealthRecord nếu có
        med_hist = data.get("medical_history") or data.get("medicalConditions")
        if med_hist:
            hr = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).first()
            if hr:
                hr.disease = med_hist
            else:
                hr = HealthRecord(
                    user_id=user.user_id,
                    blood_pressure="120/80",
                    heart_rate=76,
                    spo2=98,
                    body_temperature=36.8,
                    blood_glucose=95,
                    disease=med_hist
                )
                db.session.add(hr)

        user.updated_at = datetime.utcnow()
        db.session.commit()
        return _user_to_dict(user)

    @staticmethod
    def delete(id):
        user = _resolve_user(id)
        if not user:
            return False
        # Soft delete để bảo toàn lịch sử sinh hiệu và camera
        user.is_active = False
        user.deleted_at = datetime.utcnow()
        db.session.commit()
        return True
