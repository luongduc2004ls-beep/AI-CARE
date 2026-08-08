from sqlalchemy import or_, func
from sqlalchemy.orm import selectinload
from database import db
from models.user import User
from models.health_record import HealthRecord
from models.fall_history import FallHistory

from datetime import datetime

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
        "patient_id": user.user_id,
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
        "caregiver_name": user.caregiver_name or "Nguyễn Văn B",
        "caregiver_relation": getattr(user, "caregiver_relation", None) or "Con trai",
        "caregiver_age": getattr(user, "caregiver_age", None) or 42,
        "caregiver_phone": user.caregiver_phone or user.emergency_contact or "0987654321",
        "caregiver_email": getattr(user, "caregiver_email", None) or "nguyenvanb@gmail.com",
        "relativeName": user.caregiver_name or "Nguyễn Văn B",
        "relativeRelation": getattr(user, "caregiver_relation", None) or "Con trai",
        "relativeAge": getattr(user, "caregiver_age", None) or 42,
        "relativePhone": user.caregiver_phone or user.emergency_contact or "0987654321",
        "relativeEmail": getattr(user, "caregiver_email", None) or "nguyenvanb@gmail.com",
        "medical_history": disease_name or "Không có",
        "medicalConditions": disease_name or "Không có",
        "emergencyContact": f"{user.caregiver_name or 'Nguyễn Văn B (Con trai)'} - {user.caregiver_phone or '0987654321'}",
        "emergency_contact": user.emergency_contact,
        "doctor_name": user.doctor_name,
        "address": user.address or f"Khu vực quản lý thiết bị {user.device_id or 'Đồng hồ AI'}",
        "health_record": hr_data,
        "fall_count": recent_falls,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

INITIAL_PATIENTS = [
    {
        "patient_code": "PAT00001",
        "device_id": "DEV0001",
        "full_name": "Cụ Nguyễn Văn A",
        "age": 72,
        "gender": "Nam",
        "phone": "0912345678",
        "height_cm": 165,
        "weight_kg": 62,
        "blood_group": "O+",
        "allergy": "Dị ứng Penicillin & Phấn hoa",
        "address": "Số 15, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
        "caregiver_name": "Nguyễn Văn B",
        "caregiver_relation": "Con trai",
        "caregiver_age": 42,
        "caregiver_phone": "0987654321",
        "caregiver_email": "nguyenvanb@gmail.com",
        "doctor_name": "BS. Nguyễn Thanh Tùng"
    },
    {
        "patient_code": "PAT00002",
        "device_id": "DEV0002",
        "full_name": "Cụ Trần Thị B",
        "age": 78,
        "gender": "Nữ",
        "phone": "0913987654",
        "height_cm": 155,
        "weight_kg": 52,
        "blood_group": "A+",
        "allergy": "Dị ứng Aspirin & Hải sản",
        "address": "Phòng 202, Tòa nhà Lão Khoa, Hoàn Kiếm, Hà Nội",
        "caregiver_name": "Trần Thị Mai",
        "caregiver_relation": "Con gái",
        "caregiver_age": 45,
        "caregiver_phone": "0977123456",
        "caregiver_email": "tranthimai@gmail.com",
        "doctor_name": "BS. Lê Hoàng Long"
    },
    {
        "patient_code": "PAT00003",
        "device_id": "DEV0003",
        "full_name": "Cụ Lê Văn C",
        "age": 81,
        "gender": "Nam",
        "phone": "0988555666",
        "height_cm": 168,
        "weight_kg": 68,
        "blood_group": "B+",
        "allergy": "Dị ứng Sulfa & Thời tiết lạnh",
        "address": "Số 88, Phố Nhổn, Bắc Từ Liêm, Hà Nội",
        "caregiver_name": "Lê Văn Dũng",
        "caregiver_relation": "Cháu nội",
        "caregiver_age": 28,
        "caregiver_phone": "0966888999",
        "caregiver_email": "levandung@gmail.com",
        "doctor_name": "BS. Phạm Minh Tuấn"
    },
    {
        "patient_code": "PAT00004",
        "device_id": "DEV0004",
        "full_name": "Cụ Phạm Thị D",
        "age": 75,
        "gender": "Nữ",
        "phone": "0904111222",
        "height_cm": 152,
        "weight_kg": 58,
        "blood_group": "AB+",
        "allergy": "Không ghi nhận dị ứng",
        "address": "Số 45, Đường Giải Phóng, Hai Bà Trưng, Hà Nội",
        "caregiver_name": "Phạm Quốc Hùng",
        "caregiver_relation": "Con trai",
        "caregiver_age": 49,
        "caregiver_phone": "0911333444",
        "caregiver_email": "phamquochung@gmail.com",
        "doctor_name": "BS. Vũ Thị Hồng"
    },
    {
        "patient_code": "PAT00005",
        "device_id": "DEV0005",
        "full_name": "Cụ Hoàng Văn E",
        "age": 85,
        "gender": "Nam",
        "phone": "0936777888",
        "height_cm": 162,
        "weight_kg": 55,
        "blood_group": "O-",
        "allergy": "Dị ứng thuốc cản quang",
        "address": "Số 12, Phố Huế, Hoàn Kiếm, Hà Nội",
        "caregiver_name": "Hoàng Thu Trang",
        "caregiver_relation": "Cháu ngoại",
        "caregiver_age": 31,
        "caregiver_phone": "0944222111",
        "caregiver_email": "hoangthutrang@gmail.com",
        "doctor_name": "BS. Đỗ Quang Vinh"
    }
]

def seed_patients_if_empty():
    try:
        if db.session:
            db.create_all()
            count = User.query.count()
            if count < 5:
                for item in INITIAL_PATIENTS:
                    existing = User.query.filter_by(patient_code=item["patient_code"]).first()
                    if not existing:
                        u = User(
                            patient_code=item["patient_code"],
                            device_id=item["device_id"],
                            full_name=item["full_name"],
                            age=item["age"],
                            gender=item["gender"],
                            phone=item["phone"],
                            height_cm=item["height_cm"],
                            weight_kg=item["weight_kg"],
                            blood_group=item["blood_group"],
                            allergy=item["allergy"],
                            address=item["address"],
                            caregiver_name=item["caregiver_name"],
                            caregiver_relation=item["caregiver_relation"],
                            caregiver_age=item["caregiver_age"],
                            caregiver_phone=item["caregiver_phone"],
                            caregiver_email=item["caregiver_email"],
                            doctor_name=item["doctor_name"]
                        )
                        db.session.add(u)
                db.session.commit()
    except Exception:
        if db.session:
            db.session.rollback()
        pass

class PatientService:
    @staticmethod
    def get_all(page=1, per_page=20, keyword=None):
        try:
            seed_patients_if_empty()
        except Exception:
            pass

        query = User.query.options(
            selectinload(User.health_records),
            selectinload(User.fall_history)
        )

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
            caregiver_name=data.get("caregiver_name") or data.get("relativeName"),
            caregiver_relation=data.get("caregiver_relation") or data.get("relativeRelation") or "Con trai",
            caregiver_age=data.get("caregiver_age") or data.get("relativeAge") or 42,
            caregiver_phone=data.get("caregiver_phone") or data.get("relativePhone"),
            caregiver_email=data.get("caregiver_email") or data.get("relativeEmail") or "nguyenvanb@gmail.com",
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
        if "device_id" in data:
            user.device_id = data.get("device_id")
        if "height_cm" in data or "height" in data:
            user.height_cm = data.get("height_cm") or data.get("height")
        if "weight_kg" in data or "weight" in data:
            user.weight_kg = data.get("weight_kg") or data.get("weight")
        if "blood_group" in data or "bloodType" in data:
            user.blood_group = data.get("blood_group") or data.get("bloodType")
        if "allergy" in data:
            user.allergy = data.get("allergy")
        if "emergency_contact" in data or "emergencyContact" in data:
            user.emergency_contact = data.get("emergency_contact") or data.get("emergencyContact")
        if "doctor_name" in data:
            user.doctor_name = data.get("doctor_name")
        if "caregiver_name" in data or "relativeName" in data:
            user.caregiver_name = data.get("caregiver_name") or data.get("relativeName")
        if "caregiver_relation" in data or "relativeRelation" in data:
            user.caregiver_relation = data.get("caregiver_relation") or data.get("relativeRelation")
        if "caregiver_age" in data or "relativeAge" in data:
            user.caregiver_age = data.get("caregiver_age") or data.get("relativeAge")
        if "caregiver_phone" in data or "relativePhone" in data:
            user.caregiver_phone = data.get("caregiver_phone") or data.get("relativePhone")
        if "caregiver_email" in data or "relativeEmail" in data:
            user.caregiver_email = data.get("caregiver_email") or data.get("relativeEmail")

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
