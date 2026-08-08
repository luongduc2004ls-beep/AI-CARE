import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from pathlib import Path

# Seed for reproducibility
random.seed(42)
np.random.seed(42)

TOTAL_RECORDS = 1000

# 1. Generate Vietnamese names helpers
HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngo", "Dương", "Lý"]
LOT_NAM = ["Văn", "Hữu", "Đức", "Thành", "Quốc", "Anh", "Minh", "Quang", "Đình", "Thái", "Ngọc", "Thanh"]
TEN_NAM = ["An", "Bình", "Cường", "Dũng", "Đạt", "Hải", "Hùng", "Huy", "Khoa", "Long", "Nam", "Nghĩa", "Phong", "Phúc", "Quân", "Sơn", "Thành", "Thắng", "Tùng", "Vinh"]

LOT_NU = ["Thị", "Ngọc", "Thanh", "Phương", "Khánh", "Mai", "Quỳnh", "Ánh", "Thu", "Minh"]
TEN_NU = ["Anh", "Bình", "Cúc", "Dung", "Giang", "Hà", "Hương", "Hằng", "Hoa", "Lan", "Linh", "Mai", "Nga", "Nhung", "Phương", "Quyên", "Thảo", "Trang", "Yến"]

DOCTOR_NAMES = [
    "BS. CKII. Nguyễn Văn Hòa", "BS. CKI. Trần Thị Mai", "BS. Lê Quốc Tuấn", 
    "ThS. BS. Phạm Minh Đức", "BS. CKI. Hoàng Thu Trang", "BS. Huỳnh Thanh Trang",
    "BS. Đặng Thị Khánh", "BS. Huỳnh Văn Long", "BS. Vũ Hoàng Anh", "BS. Đỗ Thanh Hà"
]

SPECIALTIES = ["Tim mạch", "Lão khoa", "Nội tiết", "Thần kinh", "Cơ xương khớp", "Hô hấp"]
HOSPITALS = ["Bệnh viện Chợ Rẫy", "Bệnh viện Đại học Y Dược", "Bệnh viện Thống Nhất", "Bệnh viện 115", "Bệnh viện Bạch Mai", "Bệnh viện Đa khoa Quốc tế"]

DISEASES = [
    "Tăng huyết áp", "Tiểu đường Type 2", "Viêm khớp mãn tính", "Bệnh mạch vành",
    "Suy nhược cơ thể", "Rối loạn tiền đình", "Tăng huyết áp & Tiểu đường", "Bệnh phổi tắc nghẽn (COPD)",
    "Theo dõi định kỳ lão khoa"
]

ALLERGIES = ["Không", "Không", "Không", "Không", "Phấn hoa", "Penicillin", "Aspirin", "Hải sản", "Hạt nhược"]
BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]

MEDICINES_DATA = [
    {"medicine_id": "MED001", "medicine_name": "Paracetamol 500mg", "dosage": "1 viên", "frequency": "2 lần/ngày (Sáng, Tối)"},
    {"medicine_id": "MED002", "medicine_name": "Amlodipine 5mg", "dosage": "1 viên", "frequency": "1 lần/ngày (Sáng)"},
    {"medicine_id": "MED003", "medicine_name": "Metformin 850mg", "dosage": "1 viên", "frequency": "2 lần/ngày (Sau ăn)"},
    {"medicine_id": "MED004", "medicine_name": "Losartan 50mg", "dosage": "1 viên", "frequency": "1 lần/ngày (Sáng)"},
    {"medicine_id": "MED005", "medicine_name": "Panadol Extra", "dosage": "1 viên", "frequency": "Khi đau (>6h/lần)"},
    {"medicine_id": "MED006", "medicine_name": "Aspirin 81mg", "dosage": "1 viên", "frequency": "1 lần/ngày (Trưa)"},
    {"medicine_id": "MED007", "medicine_name": "Atorvastatin 10mg", "dosage": "1 viên", "frequency": "1 lần/ngày (Tối)"},
    {"medicine_id": "MED008", "medicine_name": "Omeprazole 20mg", "dosage": "1 viên", "frequency": "1 lần/ngày (Trước ăn sáng)"},
]

def gen_name(gender):
    ho = random.choice(HO)
    if gender == "Nam":
        lot = random.choice(LOT_NAM)
        ten = random.choice(TEN_NAM)
    else:
        lot = random.choice(LOT_NU)
        ten = random.choice(TEN_NU)
    return f"{ho} {lot} {ten}"

def gen_phone():
    prefix = random.choice(["090", "091", "098", "097", "096", "085", "083", "039", "038", "056", "077"])
    suffix = "".join([str(random.randint(0, 9)) for _ in range(7)])
    return f"{prefix}{suffix}"

# Generate Patients Data
patients = []
caregivers = []
doctors = []
health_records = []
schedules = []
notifications = []

base_date = datetime.now() - timedelta(days=30)

# Pre-defined Admin & User entries for testing suitability
# Patient 0: Admin user account
# Patient 1: Test caregiver user account (cunguyenana / Cụ Nguyễn Văn A)

for i in range(TOTAL_RECORDS):
    patient_id = f"PAT{10000 + i}"
    device_id = f"D{1000 + i}"
    
    if i == 0:
        gender = "Nam"
        name = "Quản Trị Viên System"
        username = "admin"
        email = "admin@elderlyai.vn"
        role = "Admin"
        age = 45
    elif i == 1:
        gender = "Nam"
        name = "Nguyễn Văn A"
        username = "cunguyenana"
        email = "cunguyenana@elderlyai.vn"
        role = "Patient"
        age = 78
    else:
        gender = random.choice(["Nam", "Nữ"])
        name = gen_name(gender)
        username = f"user_{patient_id.lower()}"
        email = f"{patient_id.lower()}@elderly.ai"
        role = random.choice(["Patient", "Patient", "Patient", "Caregiver", "Doctor"])
        age = random.randint(60, 92)

    phone_num = gen_phone()
    height = random.randint(150, 178) if gender == "Nam" else random.randint(145, 168)
    weight = random.randint(52, 82) if gender == "Nam" else random.randint(42, 72)
    blood = random.choice(BLOOD_GROUPS)
    allergy = random.choice(ALLERGIES)
    status = "Hoạt động" if random.random() > 0.02 else "Tạm khóa"

    # Patient record
    patients.append({
        "patient_id": patient_id,
        "device_id": device_id,
        "name": name,
        "username": username,
        "email": email,
        "role": role,
        "age": age,
        "gender": gender,
        "phone": phone_num,
        "height_cm": height,
        "weight_kg": weight,
        "blood_group": blood,
        "allergy": allergy,
        "status": status
    })

    # Caregiver record
    cg_gender = random.choice(["Nam", "Nữ"])
    cg_name = gen_name(cg_gender)
    cg_relation = random.choice(["Con trai", "Con gái", "Cháu nội", "Cháu ngoại", "Vợ/Chồng", "Người chăm sóc"])
    cg_phone = gen_phone()
    cg_email = f"family_{patient_id.lower()}@elderly.ai"

    caregivers.append({
        "patient_id": patient_id,
        "caregiver_name": cg_name,
        "caregiver_relation": cg_relation,
        "caregiver_phone": cg_phone,
        "caregiver_email": cg_email
    })

    # Doctor record
    doc_name = random.choice(DOCTOR_NAMES)
    doc_spec = random.choice(SPECIALTIES)
    doc_hosp = random.choice(HOSPITALS)
    doc_phone = gen_phone()

    doctors.append({
        "patient_id": patient_id,
        "doctor_name": doc_name,
        "specialty": doc_spec,
        "hospital": doc_hosp,
        "doctor_phone": doc_phone
    })

    # Health Record
    record_time = base_date + timedelta(minutes=random.randint(0, 43200))
    sys_bp = random.randint(110, 155)
    dia_bp = random.randint(70, 95)
    blood_pressure = f"{sys_bp}/{dia_bp}"
    heart_rate = random.randint(62, 98)
    spo2 = random.randint(93, 99)
    body_temp = round(random.uniform(36.3, 37.4), 1)
    blood_glucose = random.randint(85, 145)
    disease = random.choice(DISEASES)
    
    # Fall risk logic
    has_fall = "Có" if random.random() < 0.12 else "Không"
    fall_score = random.randint(60, 95) if has_fall == "Có" else random.randint(10, 50)
    if fall_score > 75:
        risk_level = "Cao"
        ai_pred = "Nguy cơ ngã cao - Cần theo dõi sát sao"
    elif fall_score > 40:
        risk_level = "Trung bình"
        ai_pred = "Chỉ số ổn định - Khuyến nghị duy trì vận động nhẹ"
    else:
        risk_level = "Thấp"
        ai_pred = "Sức khỏe tốt - Không phát hiện bất thường"

    adherence = random.randint(75, 100)

    health_records.append({
        "patient_id": patient_id,
        "timestamp": record_time.strftime("%Y-%m-%d %H:%M:%S"),
        "blood_pressure": blood_pressure,
        "heart_rate": heart_rate,
        "spo2": spo2,
        "body_temperature": body_temp,
        "blood_glucose": blood_glucose,
        "disease": disease,
        "fall_history": has_fall,
        "fall_risk_score": fall_score,
        "risk_level": risk_level,
        "adherence_rate": adherence,
        "ai_prediction": ai_pred
    })

    # Medication Schedule
    med = random.choice(MEDICINES_DATA)
    start_d = record_time.date()
    end_d = start_d + timedelta(days=30)
    sched_t = random.choice(["07:00:00", "08:00:00", "12:00:00", "18:00:00", "20:00:00"])
    remind_sent = random.choice(["Có", "Không"])
    ack = "Có" if remind_sent == "Có" and random.random() > 0.2 else "Không"

    schedules.append({
        "patient_id": patient_id,
        "medicine_id": med["medicine_id"],
        "medicine_start_date": start_d.strftime("%Y-%m-%d"),
        "medicine_end_date": end_d.strftime("%Y-%m-%d"),
        "scheduled_time": sched_t,
        "reminder_type": "Âm thanh & Tin nhắn Push",
        "reminder_sent": remind_sent,
        "acknowledged": ack
    })

    # Notification
    if has_fall == "Có":
        alert_status = "Cảnh báo ngã khẩn cấp!"
        notif_type = "Báo động"
    elif sys_bp > 140 or heart_rate > 90:
        alert_status = "Chỉ số sinh hiệu bất thường"
        notif_type = "Cảnh báo y tế"
    else:
        alert_status = f"Nhắc nhở uống thuốc {med['medicine_name']}"
        notif_type = "Nhắc nhở"

    notifications.append({
        "patient_id": patient_id,
        "timestamp": record_time.strftime("%Y-%m-%d %H:%M:%S"),
        "alert_status": alert_status,
        "reminder_sent": remind_sent,
        "acknowledged": ack,
        "notification_type": notif_type
    })

# Convert to DataFrames
df_patients = pd.DataFrame(patients)
df_caregivers = pd.DataFrame(caregivers)
df_doctors = pd.DataFrame(doctors)
df_health = pd.DataFrame(health_records)
df_medicines = pd.DataFrame(MEDICINES_DATA)
df_schedules = pd.DataFrame(schedules)
df_notifications = pd.DataFrame(notifications)

# Path to Excel output
out_excel = Path(r"f:\AI CARE 2\AI-CARE\AI_CARE_Database.xlsx")

with pd.ExcelWriter(out_excel, engine="openpyxl") as writer:
    df_patients.to_excel(writer, sheet_name="Patients", index=False)
    df_caregivers.to_excel(writer, sheet_name="Caregivers", index=False)
    df_doctors.to_excel(writer, sheet_name="Doctors", index=False)
    df_health.to_excel(writer, sheet_name="Health_Records", index=False)
    df_medicines.to_excel(writer, sheet_name="Medicines", index=False)
    df_schedules.to_excel(writer, sheet_name="Medication_Schedules", index=False)
    df_notifications.to_excel(writer, sheet_name="Notifications", index=False)

print(f"[SUCCESS] Successfully generated Excel database with {TOTAL_RECORDS} entries per sheet at: {out_excel}")
