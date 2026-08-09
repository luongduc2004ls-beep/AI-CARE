import argparse
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd
from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from app import app
from database import db
from models.fall_history import FallHistory
from models.health_record import HealthRecord
from models.medicine import Medicine
from models.medicine_schedule import MedicineSchedule
from models.notification import Notification
from models.user import User

DEFAULT_DATASET = BASE_DIR.parent / "AI_CARE_Database.xlsx"
BATCH_SIZE = 500
TAKEN_STATUS = "Đã uống"
PENDING_STATUS = "Chưa uống"
MISSED_STATUS = "Quên uống"

REQUIRED_COLUMNS = {
    "Patients": {
        "patient_id", "device_id", "name", "age", "gender", "phone",
        "height_cm", "weight_kg", "blood_group", "allergy"
    },
    "Caregivers": {"patient_id", "caregiver_name", "caregiver_phone"},
    "Doctors": {"patient_id", "doctor_name"},
    "Health_Records": {
        "patient_id", "timestamp", "blood_pressure", "heart_rate", "spo2",
        "body_temperature", "blood_glucose", "disease", "fall_history",
        "fall_risk_score", "risk_level", "adherence_rate", "ai_prediction"
    },
    "Medicines": {"medicine_id", "medicine_name", "dosage", "frequency"},
    "Medication_Schedules": {
        "patient_id", "medicine_id", "medicine_start_date", "medicine_end_date",
        "scheduled_time", "reminder_type", "reminder_sent", "acknowledged"
    },
    "Notifications": {
        "patient_id", "timestamp", "alert_status", "reminder_sent", "acknowledged"
    },
}


SQLITE_COLUMN_MIGRATIONS = {
    "Users": {
        "patient_code": "VARCHAR(50)",
        "device_id": "VARCHAR(50)",
        "age": "INTEGER",
        "height_cm": "INTEGER",
        "weight_kg": "INTEGER",
        "blood_group": "VARCHAR(10)",
        "allergy": "VARCHAR(255)",
        "caregiver_name": "VARCHAR(100)",
        "caregiver_phone": "VARCHAR(20)",
        "doctor_name": "VARCHAR(100)",
        "updated_at": "DATETIME",
    },
    "Medicines": {
        "medicine_code": "VARCHAR(50)",
    },
    "MedicineSchedules": {
        "user_id": "INTEGER",
    },
}


def ensure_sqlite_schema():
    if db.engine.url.get_backend_name() != "sqlite":
        return

    with db.engine.begin() as connection:
        for table_name, columns in SQLITE_COLUMN_MIGRATIONS.items():
            existing_columns = {
                row[1]
                for row in connection.execute(sql_text(f"PRAGMA table_info({table_name})"))
            }

            for column_name, column_type in columns.items():
                if column_name not in existing_columns:
                    connection.execute(
                        sql_text(
                            f"ALTER TABLE {table_name} "
                            f"ADD COLUMN {column_name} {column_type}"
                        )
                    )


def is_blank(value):
    return pd.isna(value) or str(value).strip() == ""


def text(value):
    if is_blank(value):
        return None
    return str(value).strip()


def ascii_key(value):
    value = text(value) or ""
    normalized = unicodedata.normalize("NFD", value)
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return normalized.lower().strip()


def int_or_none(value):
    if is_blank(value):
        return None
    return int(float(value))


def float_or_none(value):
    if is_blank(value):
        return None
    return float(value)


def phone(value):
    if is_blank(value):
        return None

    if isinstance(value, float) and value.is_integer():
        raw = str(int(value))
    else:
        raw = str(value).strip()

    digits = re.sub(r"\D", "", raw)

    if len(digits) == 9:
        return "0" + digits

    return digits or raw


def parse_datetime(value):
    if is_blank(value):
        return None

    parsed = pd.to_datetime(value, errors="coerce")

    if pd.isna(parsed):
        return None

    return parsed.to_pydatetime()


def parse_date(value):
    parsed = parse_datetime(value)
    return parsed.date() if parsed else None


def parse_time(value):
    if is_blank(value):
        return None

    raw = str(value).strip()

    for time_format in ("%H:%M:%S", "%H:%M"):
        parsed = pd.to_datetime(raw, format=time_format, errors="coerce")

        if not pd.isna(parsed):
            return parsed.to_pydatetime().time()

    parsed = pd.to_datetime(raw, errors="coerce")

    if pd.isna(parsed):
        return None

    return parsed.to_pydatetime().time()


def yes(value):
    return ascii_key(value) in {"yes", "y", "true", "1", "co"}


def schedule_status(row):
    acknowledged = yes(row.get("acknowledged"))
    reminder_sent = yes(row.get("reminder_sent"))

    if acknowledged:
        return TAKEN_STATUS

    if reminder_sent:
        return MISSED_STATUS

    return PENDING_STATUS


def schedule_note(row):
    end_date = parse_date(row.get("medicine_end_date"))
    pieces = [
        f"Reminder type: {text(row.get('reminder_type')) or 'Unknown'}",
        f"End date: {end_date.isoformat() if end_date else 'Unknown'}",
        f"Reminder sent: {text(row.get('reminder_sent')) or 'No'}",
        f"Acknowledged: {text(row.get('acknowledged')) or 'No'}",
    ]
    return "; ".join(pieces)


def notification_title(alert_status):
    value = text(alert_status)
    return value or "AI Care notification"


def notification_content(row):
    return "; ".join([
        f"Status: {text(row.get('alert_status')) or 'Unknown'}",
        f"Reminder sent: {text(row.get('reminder_sent')) or 'No'}",
        f"Acknowledged: {text(row.get('acknowledged')) or 'No'}",
    ])


def load_sheets(path):
    sheets = pd.read_excel(path, sheet_name=None)
    missing_sheets = sorted(set(REQUIRED_COLUMNS) - set(sheets))

    if missing_sheets:
        raise ValueError("Missing sheets: " + ", ".join(missing_sheets))

    for sheet_name, required in REQUIRED_COLUMNS.items():
        missing_columns = sorted(required - set(sheets[sheet_name].columns))

        if missing_columns:
            raise ValueError(
                f"Sheet {sheet_name} missing columns: "
                + ", ".join(missing_columns)
            )

    return sheets


def commit_batch(index):
    if index % BATCH_SIZE == 0:
        db.session.commit()


def import_users(sheets):
    patients = sheets["Patients"]
    caregivers = sheets["Caregivers"].set_index("patient_id")
    doctors = sheets["Doctors"].set_index("patient_id")

    users_df = sheets.get("Users")
    users_by_patient_id = {}
    if users_df is not None:
        for idx, urow in users_df.iterrows():
            pid = text(urow.get("patient_id"))
            if pid and pid.isdigit():
                pid_int = int(pid)
                if 1 <= pid_int <= len(patients):
                    pid = text(patients.iloc[pid_int - 1]["patient_id"])
            if pid:
                users_by_patient_id[pid] = urow

    users = {
        user.patient_code: user
        for user in User.query.filter(User.patient_code.isnot(None)).all()
    }

    created = 0
    updated = 0

    for index, row in patients.iterrows():
        patient_code = text(row["patient_id"])
        user = users.get(patient_code)

        if user is None:
            user = User(patient_code=patient_code)
            db.session.add(user)
            users[patient_code] = user
            created += 1
        else:
            updated += 1

        caregiver = caregivers.loc[patient_code] if patient_code in caregivers.index else {}
        doctor = doctors.loc[patient_code] if patient_code in doctors.index else {}
        caregiver_phone = phone(caregiver.get("caregiver_phone")) if hasattr(caregiver, "get") else None

        user_info = users_by_patient_id.get(patient_code)
        if user_info is not None:
            user.username = text(user_info.get("username")) or f"user{index + 1}"
            user.role = text(user_info.get("role")) or "User"
        else:
            if not user.username:
                user.username = f"user_{patient_code.lower()}"
            if not user.role:
                user.role = "Caregiver"

        if not user.password_hash:
            user.set_password("password123")

        user.device_id = text(row["device_id"])
        user.full_name = text(row["name"]) or "Unknown patient"
        user.age = int_or_none(row["age"])
        user.gender = text(row["gender"])
        user.phone = phone(row["phone"])
        user.height_cm = int_or_none(row["height_cm"])
        user.weight_kg = int_or_none(row["weight_kg"])
        user.blood_group = text(row["blood_group"])
        user.allergy = text(row["allergy"])
        user.caregiver_name = text(caregiver.get("caregiver_name")) if hasattr(caregiver, "get") else None
        user.caregiver_phone = caregiver_phone
        user.emergency_contact = caregiver_phone
        user.doctor_name = text(doctor.get("doctor_name")) if hasattr(doctor, "get") else None

        commit_batch(index + 1)

    db.session.commit()

    # Import Admins sheet if present
    admins_df = sheets.get("Admins")
    if admins_df is not None:
        for index, row in admins_df.iterrows():
            admin_username = text(row.get("username"))
            if not admin_username:
                continue
            admin_user = User.query.filter_by(username=admin_username).first()
            if admin_user is None:
                admin_user = User(
                    username=admin_username,
                    email=text(row.get("email")) or f"{admin_username}@aicare.com",
                    full_name=text(row.get("full_name")) or f"Quản Trị Viên {admin_username}",
                    role="Admin",
                    patient_code=f"ADMIN_{admin_username.upper()}"
                )
                admin_user.set_password("password123")
                db.session.add(admin_user)
                created += 1
            else:
                admin_user.role = "Admin"
                admin_user.full_name = text(row.get("full_name")) or admin_user.full_name
                if text(row.get("email")):
                    admin_user.email = text(row.get("email"))
                updated += 1
        db.session.commit()

    # Ensure default accounts
    for default_item in [
        {"username": "admin", "role": "Admin", "email": "admin@elderlyai.vn", "full_name": "Quản Trị Viên Hệ Thống"},
        {"username": "cunguyenana", "role": "Caregiver", "email": "cunguyenana@elderlyai.vn", "full_name": "Cụ Nguyễn Văn A"}
    ]:
        def_user = User.query.filter_by(username=default_item["username"]).first()
        if not def_user:
            def_user = User(
                username=default_item["username"],
                role=default_item["role"],
                email=default_item["email"],
                full_name=default_item["full_name"],
                patient_code=f"PATIENT_{default_item['username'].upper()}"
            )
            def_user.set_password("password123")
            db.session.add(def_user)
        else:
            def_user.role = default_item["role"]
    db.session.commit()

    return users, created, updated


def import_medicines(sheets):
    medicines_df = sheets["Medicines"]
    schedules = sheets["Medication_Schedules"].copy()
    schedules["medicine_start_date"] = pd.to_datetime(schedules["medicine_start_date"], errors="coerce")
    schedules["medicine_end_date"] = pd.to_datetime(schedules["medicine_end_date"], errors="coerce")
    date_ranges = schedules.groupby("medicine_id").agg({
        "medicine_start_date": "min",
        "medicine_end_date": "max",
    })

    medicines = {
        medicine.medicine_code: medicine
        for medicine in Medicine.query.filter(Medicine.medicine_code.isnot(None)).all()
    }

    created = 0
    updated = 0

    for index, row in medicines_df.iterrows():
        medicine_code = text(row["medicine_id"])
        medicine = medicines.get(medicine_code)

        if medicine is None:
            medicine = Medicine(medicine_code=medicine_code)
            db.session.add(medicine)
            medicines[medicine_code] = medicine
            created += 1
        else:
            updated += 1

        dates = date_ranges.loc[medicine_code] if medicine_code in date_ranges.index else None
        start_date = dates["medicine_start_date"] if dates is not None else None
        expire_date = dates["medicine_end_date"] if dates is not None else None

        medicine.medicine_name = text(row["medicine_name"]) or medicine_code
        medicine.dosage = text(row["dosage"])
        medicine.frequency = text(row["frequency"])
        medicine.quantity = medicine.quantity or 0
        medicine.instruction = medicine.instruction or text(row["frequency"])
        medicine.start_date = start_date.date() if start_date is not None and not pd.isna(start_date) else None
        medicine.expire_date = expire_date.date() if expire_date is not None and not pd.isna(expire_date) else None

        commit_batch(index + 1)

    db.session.commit()
    return medicines, created, updated


def import_health_records(sheets, users):
    existing = {
        (record.user_id, record.recorded_at): record
        for record in HealthRecord.query.all()
    }
    created = 0
    updated = 0

    for index, row in sheets["Health_Records"].iterrows():
        user = users.get(text(row["patient_id"]))

        if user is None:
            continue

        recorded_at = parse_datetime(row["timestamp"])
        key = (user.user_id, recorded_at)
        record = existing.get(key)

        if record is None:
            record = HealthRecord(user_id=user.user_id, recorded_at=recorded_at)
            db.session.add(record)
            existing[key] = record
            created += 1
        else:
            updated += 1

        record.blood_pressure = text(row["blood_pressure"])
        record.heart_rate = int_or_none(row["heart_rate"])
        record.spo2 = int_or_none(row["spo2"])
        record.body_temperature = float_or_none(row["body_temperature"])
        record.blood_glucose = int_or_none(row["blood_glucose"])
        record.disease = text(row["disease"])
        record.fall_history = text(row["fall_history"])
        record.fall_risk_score = int_or_none(row["fall_risk_score"])
        record.risk_level = text(row["risk_level"])
        record.adherence_rate = int_or_none(row["adherence_rate"])
        record.ai_prediction = text(row["ai_prediction"])

        commit_batch(index + 1)

    db.session.commit()
    return created, updated


def import_schedules(sheets, users, medicines):
    existing = {
        (schedule.user_id, schedule.medicine_id, schedule.scheduled_date, schedule.take_time): schedule
        for schedule in MedicineSchedule.query.all()
    }
    created = 0
    updated = 0

    for index, row in sheets["Medication_Schedules"].iterrows():
        user = users.get(text(row["patient_id"]))
        medicine = medicines.get(text(row["medicine_id"]))

        if user is None or medicine is None:
            continue

        scheduled_date = parse_date(row["medicine_start_date"])
        take_time = parse_time(row["scheduled_time"])

        if scheduled_date is None or take_time is None:
            continue

        key = (user.user_id, medicine.medicine_id, scheduled_date, take_time)
        schedule = existing.get(key)

        if schedule is None:
            schedule = MedicineSchedule(
                user_id=user.user_id,
                medicine_id=medicine.medicine_id,
                scheduled_date=scheduled_date,
                take_time=take_time,
            )
            db.session.add(schedule)
            existing[key] = schedule
            created += 1
        else:
            updated += 1

        schedule.status = schedule_status(row)
        schedule.note = schedule_note(row)

        commit_batch(index + 1)

    db.session.commit()
    return created, updated


def import_notifications(sheets, users):
    existing = {
        (notification.user_id, notification.created_at, notification.title): notification
        for notification in Notification.query.all()
    }
    created = 0
    updated = 0

    for index, row in sheets["Notifications"].iterrows():
        user = users.get(text(row["patient_id"]))

        if user is None:
            continue

        created_at = parse_datetime(row["timestamp"])
        title = notification_title(row["alert_status"])
        key = (user.user_id, created_at, title)
        notification = existing.get(key)

        if notification is None:
            notification = Notification(user_id=user.user_id, created_at=created_at, title=title)
            db.session.add(notification)
            existing[key] = notification
            created += 1
        else:
            updated += 1

        notification.content = notification_content(row)
        notification.is_read = yes(row["acknowledged"])

        commit_batch(index + 1)

    db.session.commit()
    return created, updated


def import_fall_history(sheets, users):
    existing = {
        (fall.user_id, fall.fall_time): fall
        for fall in FallHistory.query.all()
    }
    created = 0
    updated = 0
    falls = sheets["Health_Records"][sheets["Health_Records"]["fall_history"].map(ascii_key).isin(["co", "yes"])]

    for index, row in falls.iterrows():
        user = users.get(text(row["patient_id"]))

        if user is None:
            continue

        fall_time = parse_datetime(row["timestamp"])
        key = (user.user_id, fall_time)
        fall = existing.get(key)

        if fall is None:
            fall = FallHistory(user_id=user.user_id, fall_time=fall_time)
            db.session.add(fall)
            existing[key] = fall
            created += 1
        else:
            updated += 1

        fall.location = fall.location or "Unknown"
        fall.severity = text(row["risk_level"])

        commit_batch(index + 1)

    db.session.commit()
    return created, updated


def import_dataset(path):
    sheets = load_sheets(path)

    with app.app_context():
        db.create_all()
        ensure_sqlite_schema()
        db.create_all()
        users, users_created, users_updated = import_users(sheets)
        medicines, medicines_created, medicines_updated = import_medicines(sheets)
        health_created, health_updated = import_health_records(sheets, users)
        schedules_created, schedules_updated = import_schedules(sheets, users, medicines)
        notifications_created, notifications_updated = import_notifications(sheets, users)
        falls_created, falls_updated = import_fall_history(sheets, users)

        return {
            "users": {"created": users_created, "updated": users_updated},
            "medicines": {"created": medicines_created, "updated": medicines_updated},
            "health_records": {"created": health_created, "updated": health_updated},
            "medicine_schedules": {"created": schedules_created, "updated": schedules_updated},
            "notifications": {"created": notifications_created, "updated": notifications_updated},
            "fall_history": {"created": falls_created, "updated": falls_updated},
        }


def main():
    parser = argparse.ArgumentParser(description="Import AI_CARE_Database.xlsx into the Elderly AI backend database.")
    parser.add_argument("xlsx_path", nargs="?", default=str(DEFAULT_DATASET), help="Path to AI_CARE_Database.xlsx")
    args = parser.parse_args()
    path = Path(args.xlsx_path)

    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    with app.app_context():
        try:
            result = import_dataset(path)
        except SQLAlchemyError as exc:
            db.session.rollback()
            print("Database import failed.")
            print("If this database already existed, run sql/migrate_ai_care_database.sql once first.")
            print(str(exc.orig) if getattr(exc, "orig", None) else str(exc))
            raise SystemExit(1) from exc

    print("AI CARE dataset import completed.")

    for table_name, stats in result.items():
        print(f"- {table_name}: created={stats['created']}, updated={stats['updated']}")


if __name__ == "__main__":
    main()
