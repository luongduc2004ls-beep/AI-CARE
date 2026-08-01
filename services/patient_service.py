from sqlalchemy import or_, func
from sqlalchemy.orm import selectinload
from database import db
from models.user import User
from models.health_record import HealthRecord
from models.fall_history import FallHistory

def _user_to_dict(user):
    health_record = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).first()
    recent_falls = FallHistory.query.filter_by(user_id=user.user_id).count()

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

    return {
        "user_id": user.user_id,
        "id": user.user_id,
        "patient_code": user.patient_code or f"PAT{user.user_id:05d}",
        "device_id": user.device_id,
        "full_name": user.full_name or "Chưa cập nhật",
        "fullName": user.full_name or "Chưa cập nhật",
        "age": user.age,
        "gender": user.gender or "Chưa rõ",
        "phone": user.phone or "Chưa cập nhật",
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "blood_group": user.blood_group,
        "allergy": user.allergy,
        "caregiver_name": user.caregiver_name,
        "caregiver_phone": user.caregiver_phone,
        "emergencyContact": f"{user.caregiver_name or 'Người thân'} - {user.caregiver_phone or user.emergency_contact or 'N/A'}",
        "emergency_contact": user.emergency_contact,
        "doctor_name": user.doctor_name,
        "address": f"Khu vực quản lý thiết bị {user.device_id or 'Đồng hồ AI'}",
        "health_record": hr_data,
        "fall_count": recent_falls,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

class PatientService:
    @staticmethod
    def get_all(page=1, per_page=20, keyword=None):
        query = User.query

        if keyword:
            keyword = f"%{keyword.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.like(keyword),
                    User.patient_code.like(keyword),
                    User.phone.like(keyword),
                    User.doctor_name.like(keyword),
                    User.caregiver_name.like(keyword)
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
        user = db.session.get(User, id)
        if not user:
            return None
        return _user_to_dict(user)

    @staticmethod
    def statistics():
        total_patients = User.query.count()
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
        full_name = (data.get("full_name") or data.get("fullName") or "").strip()
        if not full_name:
            raise ValueError("Full name is required")

        last_id = db.session.query(func.max(User.user_id)).scalar() or 0
        new_id = last_id + 1
        patient_code = data.get("patient_code") or f"PAT{new_id:05d}"
        device_id = data.get("device_id") or f"DEV{new_id:05d}"

        user = User(
            patient_code=patient_code,
            device_id=device_id,
            full_name=full_name,
            age=data.get("age"),
            gender=data.get("gender") or "Nam",
            phone=data.get("phone"),
            height_cm=data.get("height_cm"),
            weight_kg=data.get("weight_kg"),
            blood_group=data.get("blood_group") or "O+",
            allergy=data.get("allergy"),
            caregiver_name=data.get("caregiver_name"),
            caregiver_phone=data.get("caregiver_phone"),
            emergency_contact=data.get("emergency_contact") or data.get("emergencyContact") or data.get("caregiver_phone"),
            doctor_name=data.get("doctor_name") or "BS. Trực vịnh"
        )
        db.session.add(user)
        db.session.flush()

        # Add initial health record for newly created patient
        hr = HealthRecord(
            user_id=user.user_id,
            blood_pressure="120/80",
            heart_rate=75,
            spo2=98,
            body_temperature=36.8,
            blood_glucose=100,
            disease="Theo dõi định kỳ",
            fall_history="Không",
            fall_risk_score=10,
            risk_level="Bình thường",
            adherence_rate=100,
            ai_prediction="An toàn"
        )
        db.session.add(hr)

        db.session.commit()
        return _user_to_dict(user)

    @staticmethod
    def update(id, data):
        user = db.session.get(User, id)
        if not user:
            return None

        if "full_name" in data or "fullName" in data:
            user.full_name = data.get("full_name") or data.get("fullName")
        if "age" in data:
            user.age = data.get("age")
        if "gender" in data:
            user.gender = data.get("gender")
        if "phone" in data:
            user.phone = data.get("phone")
        if "emergency_contact" in data or "emergencyContact" in data:
            user.emergency_contact = data.get("emergency_contact") or data.get("emergencyContact")
        if "doctor_name" in data:
            user.doctor_name = data.get("doctor_name")
        if "caregiver_name" in data:
            user.caregiver_name = data.get("caregiver_name")
        if "caregiver_phone" in data:
            user.caregiver_phone = data.get("caregiver_phone")

        db.session.commit()
        return _user_to_dict(user)

    @staticmethod
    def delete(id):
        user = db.session.get(User, id)
        if not user:
            return False
        db.session.delete(user)
        db.session.commit()
        return True
