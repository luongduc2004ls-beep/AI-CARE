"""
Database Seeder Service (DB_SEEDER.PY)
ElderlyCare AI System - Auto Initialization & Seed Data
Ensures any fresh clone on any computer runs with full realistic database records immediately.
"""

import os
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash
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
from models.patient_access import UserPatientAccess
from models.medical_knowledge import MedicalDocument, MedicalChunk


class DatabaseSeeder:
    """
    Tự động nạp dữ liệu mẫu khởi tạo khi CSDL mới hoàn toàn hoặc rỗng.
    """

    @classmethod
    def seed_if_empty(cls):
        """Kiểm tra và tự động nạp dữ liệu khởi tạo nếu chưa có Users."""
        try:
            user_count = User.query.count()
            if user_count > 0:
                print(f"[DB_SEEDER] Database already initialized ({user_count} users present).")
                return False

            print("[DB_SEEDER] Database is empty. Seeding initial realistic clinical & management data...")
            cls.seed_all()
            print("[DB_SEEDER] Seed completed successfully!")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"[DB_SEEDER] Error during database seeding: {str(e)}")
            return False

    @classmethod
    def seed_all(cls):
        default_pwd_hash = generate_password_hash("password123")

        # 1. Admin Users
        admin1 = User(
            user_id=1001,
            username="admin1",
            password_hash=default_pwd_hash,
            full_name="BS. Nguyễn Văn Hùng",
            role="Admin",
            phone="0912345678",
            address="Bệnh viện Lão Khoa Trung Ương, Hà Nội",
            doctor_name="BS. Nguyễn Văn Hùng",
            is_active=True
        )
        admin2 = User(
            user_id=1002,
            username="admin",
            password_hash=default_pwd_hash,
            full_name="Quản Trị Viên Hệ Thống",
            role="Admin",
            phone="0987654321",
            address="Trung Tâm Y Tế ElderlyCare, Hà Nội",
            is_active=True
        )
        db.session.add_all([admin1, admin2])

        # 2. Patient Users
        patients_data = [
            ("PAT10000", "user_pat10000", "Hồ Thanh Khánh", 71, "Nam", "Phấn hoa", "0901234000", "135/85", 75, 97, 36.8, "Cao", "Nguyễn Thị Mai (Vợ)", "0909111222"),
            ("PAT10001", "user_pat10001", "Phan Anh Thảo", 68, "Nữ", "Penicillin", "0901234001", "120/80", 72, 98, 36.7, "Thấp", "Phan Quốc Tuấn (Con trai)", "0909111223"),
            ("PAT10002", "user_pat10002", "Trần Văn Bình", 75, "Nam", "Hải sản", "0901234002", "145/90", 82, 95, 37.0, "Cao", "Trần Văn An (Con trai)", "0909111224"),
            ("PAT10003", "user_pat10003", "Lê Thị Cẩm", 82, "Nữ", "Không có", "0901234003", "130/82", 70, 96, 36.6, "Cao", "Lê Hữu Đạt (Con trai)", "0909111225"),
            ("PAT10004", "user_pat10004", "Nguyễn Hoàng Long", 79, "Nam", "Kháng sinh", "0901234004", "125/78", 68, 99, 36.5, "Thấp", "Nguyễn Thu Hà (Con gái)", "0909111226"),
            ("PAT10005", "user_pat10005", "Vũ Thị Lan", 85, "Nữ", "Phấn hoa", "0901234005", "150/95", 88, 93, 37.2, "Cao", "Vũ Minh Quân (Cháu)", "0909111227"),
            ("PAT10006", "user_pat10006", "Phạm Khánh Hải", 61, "Nam", "Không có", "0901234006", "117/72", 76, 97, 36.7, "Cao", "Phạm Hải Đăng (Con trai)", "0909111228"),
            ("PAT10007", "user_pat10007", "Đỗ Hữu Dũng", 66, "Nam", "Penicillin", "0901234007", "127/83", 74, 93, 36.8, "Cao", "Đỗ Mỹ Linh (Con gái)", "0909111229"),
            ("PAT10008", "user_pat10008", "Hồ Thu Hương", 63, "Nữ", "Phấn hoa", "0901234008", "155/73", 80, 95, 36.9, "Cao", "Hồ Văn Cường (Chồng)", "0909111230"),
            ("PAT10009", "user_pat10009", "Vũ Gia Hải", 86, "Nam", "Hải sản", "0901234009", "121/85", 69, 95, 36.6, "Cao", "Vũ Lan Anh (Con gái)", "0909111231"),
            ("PAT10010", "user_pat10010", "Bùi Quốc Quân", 78, "Nam", "Phấn hoa", "0901234010", "117/74", 72, 96, 36.7, "Cao", "Bùi Thu Thủy (Con gái)", "0909111232")
        ]

        created_users = []
        for idx, (p_code, u_name, f_name, age, gender, allergy, phone, bp, hr, spo2, temp, risk, c_name, c_phone) in enumerate(patients_data):
            u_id = idx + 1
            user = User(
                user_id=u_id,
                username=u_name,
                password_hash=default_pwd_hash,
                full_name=f_name,
                role="User",
                patient_code=p_code,
                age=age,
                gender=gender,
                allergy=allergy,
                phone=phone,
                address=f"Phòng {100 + u_id}, Tòa Nhà A, ElderlyCare Hospital",
                doctor_name="BS. Nguyễn Văn Hùng",
                caregiver_name=c_name,
                caregiver_phone=c_phone,
                caregiver_relation="Thân nhân",
                blood_group="O+" if idx % 2 == 0 else "A+",
                is_active=True
            )
            db.session.add(user)
            created_users.append(user)

        db.session.flush()

        # 3. Master Medicines Catalog
        meds_data = [
            ("Amlodipine", "5mg", "Viên nén", "1 lần/ngày (Sáng sau ăn)", "Uống cùng 200ml nước ấm", "Viên", 500),
            ("Atorvastatin", "10mg", "Viên bao phim", "1 lần/ngày (Tối trước khi ngủ)", "Uống nguyên viên trước khi đi ngủ", "Viên", 300),
            ("Omeprazole", "20mg", "Viên nang", "1 lần/ngày (Sáng trước ăn 30p)", "Uống trước bữa ăn sáng 30 phút", "Viên", 450),
            ("Metformin", "500mg", "Viên nén", "2 lần/ngày (Sáng, Tối)", "Uống ngay trong hoặc sau bữa ăn", "Viên", 400),
            ("Losartan", "50mg", "Viên nén", "1 lần/ngày (Sáng)", "Uống vào buổi sáng", "Viên", 350),
            ("Paracetamol", "500mg", "Viên sủi", "Khi đau/sốt > 38.5°C", "Hòa tan trong 150ml nước", "Viên", 600)
        ]

        created_meds = []
        for name, dosage, form, freq, inst, unit, stock in meds_data:
            med = Medicine(
                medicine_name=name,
                dosage=dosage,
                form=form,
                frequency=freq,
                instruction=inst,
                unit=unit,
                stock_quantity=stock
            )
            db.session.add(med)
            created_meds.append(med)

        db.session.flush()

        # 4. Prescriptions & Schedules & Health Records
        today = date.today()
        for idx, (p_code, u_name, f_name, age, gender, allergy, phone, bp, hr, spo2, temp, risk, c_name, c_phone) in enumerate(patients_data):
            u_id = idx + 1
            
            # Prescription
            rx = Prescription(
                prescription_code=f"RX_AUTO_{1000 + u_id}",
                user_id=u_id,
                doctor_name="BS. Nguyễn Văn Hùng",
                diagnosis="Tăng huyết áp vô căn, Đái tháo đường type 2, Rối loạn mỡ máu" if idx % 2 == 0 else "Viêm loét dạ dày - tá tràng, Thiếu máu cơ tim nhẹ",
                start_date=today - timedelta(days=30),
                end_date=today + timedelta(days=60),
                status="Đang điều trị"
            )
            db.session.add(rx)
            db.session.flush()

            # Prescription Items
            p_item1 = PrescriptionItem(
                prescription_id=rx.prescription_id,
                medicine_id=created_meds[0].medicine_id,
                medicine_name=created_meds[0].medicine_name,
                dosage="5mg",
                frequency="1 lần/ngày",
                instruction="Uống vào buổi sáng sau ăn 15 phút"
            )
            p_item2 = PrescriptionItem(
                prescription_id=rx.prescription_id,
                medicine_id=created_meds[1].medicine_id if idx % 2 == 0 else created_meds[2].medicine_id,
                medicine_name=created_meds[1].medicine_name if idx % 2 == 0 else created_meds[2].medicine_name,
                dosage="10mg" if idx % 2 == 0 else "20mg",
                frequency="1 lần/ngày",
                instruction="Uống theo chỉ định"
            )
            db.session.add_all([p_item1, p_item2])
            db.session.flush()

            # Schedules for today (08:00, 12:00, 20:00)
            sched1 = MedicineSchedule(
                prescription_item_id=p_item1.prescription_item_id,
                medicine_id=p_item1.medicine_id,
                user_id=u_id,
                scheduled_date=today,
                take_time=datetime.strptime("08:00", "%H:%M").time(),
                dose_amount="1 viên",
                status="Đã uống" if idx % 3 == 0 else "Chưa uống",
                note="Uống sau ăn sáng"
            )
            sched2 = MedicineSchedule(
                prescription_item_id=p_item2.prescription_item_id,
                medicine_id=p_item2.medicine_id,
                user_id=u_id,
                scheduled_date=today,
                take_time=datetime.strptime("20:00", "%H:%M").time(),
                dose_amount="1 viên",
                status="Chưa uống",
                note="Uống trước khi ngủ"
            )
            db.session.add_all([sched1, sched2])

            # Health Record
            hr_record = HealthRecord(
                user_id=u_id,
                blood_pressure=bp,
                heart_rate=hr,
                spo2=spo2,
                body_temperature=temp,
                blood_glucose=6.5 if idx % 2 == 0 else 5.8,
                risk_level=risk,
                ai_prediction="Ổn định" if risk == "Thấp" else "Cần theo dõi sát",
                fall_history="Có lịch sử té ngã tại phòng ngủ" if risk == "Cao" else "Không",
                recorded_at=datetime.utcnow()
            )
            db.session.add(hr_record)

            # Access control mapping
            access = UserPatientAccess(
                user_id=u_id,
                patient_code=p_code,
                relationship="Chính chủ",
                is_primary_contact=True
            )
            db.session.add(access)

        # 5. Cameras
        for cam_id in range(1, 9):
            cam = Camera(
                camera_name=f"Camera Giám Sát Phòng {100 + cam_id}",
                location=f"Phòng {100 + cam_id} - Khu Điều Dưỡng A",
                patient_id=f"PAT{10000 + cam_id - 1}",
                stream_url=f"http://127.0.0.1:5000/api/cameras/{cam_id}/stream",
                status="ONLINE" if cam_id <= 6 else "OFFLINE"
            )
            db.session.add(cam)

        # 6. Alerts
        alert1 = Alert(
            patient_id="PAT10000",
            title="Cảnh báo phát hiện người bệnh bước loạng choạng gần mép giường",
            description="Camera AI phòng 101 phát hiện nguy cơ mất thăng bằng.",
            severity="High",
            status="ALERTED",
            location="Phòng ngủ 101"
        )
        alert2 = Alert(
            patient_id="PAT10002",
            title="Cảnh báo huyết áp đo vượt ngưỡng an toàn (145/90 mmHg)",
            description="Sinh hiệu thời gian thực ghi nhận huyết áp tâm thu cao.",
            severity="Medium",
            status="ALERTED",
            location="Phòng 103"
        )
        db.session.add_all([alert1, alert2])

        db.session.commit()
