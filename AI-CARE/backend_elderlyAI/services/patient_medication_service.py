from datetime import datetime, date, time
from sqlalchemy.exc import SQLAlchemyError
from database import db
from models import (
    User,
    Medicine,
    Prescription,
    PrescriptionItem,
    MedicineSchedule,
    MedicationHistory
)
from services.patient_service import _resolve_user


class PatientMedicationService:
    """
    Service quản lý toàn diện Đơn thuốc & Lịch uống thuốc phân lập theo từng bệnh nhân.
    Đảm bảo 100% Patient Data Isolation, tuân thủ nguyên tắc không rò rỉ dữ liệu chéo.
    """

    @staticmethod
    def get_patient_prescriptions(patient_identifier):
        """
        Lấy danh sách toàn bộ đơn thuốc của một bệnh nhân cụ thể.
        """
        user = _resolve_user(patient_identifier)
        if not user:
            return None

        prescriptions = Prescription.query.filter_by(user_id=user.user_id)\
            .order_by(Prescription.created_at.desc()).all()

        return {
            "patient": {
                "user_id": user.user_id,
                "patient_code": user.patient_code,
                "full_name": user.full_name,
                "age": user.age,
                "gender": user.gender,
                "doctor_name": user.doctor_name
            },
            "total_prescriptions": len(prescriptions),
            "prescriptions": [rx.to_dict() for rx in prescriptions]
        }

    @staticmethod
    def get_patient_medications(patient_identifier):
        """
        Lấy danh sách các loại thuốc đang được kê đơn thực tế cho một bệnh nhân.
        Không lấy từ master catalog dùng chung, chỉ lấy từ PrescriptionItems của bệnh nhân.
        """
        user = _resolve_user(patient_identifier)
        if not user:
            return None

        # Query all active prescription items for this user
        items = db.session.query(PrescriptionItem, Prescription, Medicine)\
            .join(Prescription, PrescriptionItem.prescription_id == Prescription.prescription_id)\
            .join(Medicine, PrescriptionItem.medicine_id == Medicine.medicine_id)\
            .filter(Prescription.user_id == user.user_id)\
            .filter(Prescription.status.in_(["Active", "Đang điều trị"]))\
            .all()

        today = date.today()
        med_list = []
        for item, rx, med in items:
            # Lấy lịch uống thuốc hôm nay của loại thuốc này trong CSDL
            sched = MedicineSchedule.query.filter_by(
                prescription_item_id=item.prescription_item_id,
                scheduled_date=today
            ).order_by(MedicineSchedule.take_time.asc()).first()

            if not sched:
                sched = MedicineSchedule.query.filter_by(
                    prescription_item_id=item.prescription_item_id
                ).order_by(MedicineSchedule.scheduled_date.desc(), MedicineSchedule.take_time.asc()).first()

            current_status = sched.status if sched and sched.status else "Chưa uống"
            schedule_id = sched.schedule_id if sched else None
            take_time_str = sched.take_time.strftime("%H:%M") if sched and sched.take_time else None

            med_list.append({
                "prescription_item_id": item.prescription_item_id,
                "prescription_id": rx.prescription_id,
                "prescription_code": rx.prescription_code,
                "doctor_name": rx.doctor_name,
                "diagnosis": rx.diagnosis,
                "medicine_id": med.medicine_id,
                "medicine_code": med.medicine_code,
                "medicine_name": med.medicine_name,
                "name": med.medicine_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "quantity": item.quantity,
                "unit": item.unit or "Viên",
                "instruction": item.instruction,
                "start_date": item.start_date.isoformat() if item.start_date else None,
                "end_date": item.end_date.isoformat() if item.end_date else None,
                "note": item.note,
                "status": current_status,
                "schedule_id": schedule_id,
                "time": take_time_str or item.frequency or "08:00"
            })

        return {
            "patient": {
                "user_id": user.user_id,
                "patient_code": user.patient_code,
                "full_name": user.full_name
            },
            "total_medications": len(med_list),
            "medications": med_list
        }

    @staticmethod
    def get_patient_medication_schedule(patient_identifier, target_date=None):
        """
        Lấy lịch uống thuốc theo ngày của một bệnh nhân cụ thể.
        Chỉ trả các cữ uống của bệnh nhân đó, không lẫn bệnh nhân khác.
        """
        user = _resolve_user(patient_identifier)
        if not user:
            return None

        if isinstance(target_date, str):
            try:
                target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
            except ValueError:
                target_date = date.today()
        elif not target_date:
            target_date = date.today()

        schedules = MedicineSchedule.query.filter_by(user_id=user.user_id, scheduled_date=target_date)\
            .order_by(MedicineSchedule.take_time.asc()).all()

        # If today has no records, fallback to any active schedules of THIS patient
        if not schedules:
            schedules = MedicineSchedule.query.filter_by(user_id=user.user_id)\
                .order_by(MedicineSchedule.scheduled_date.desc(), MedicineSchedule.take_time.asc()).limit(10).all()

        sched_list = [s.to_dict() for s in schedules]

        return {
            "patient": {
                "user_id": user.user_id,
                "patient_code": user.patient_code,
                "full_name": user.full_name
            },
            "scheduled_date": target_date.isoformat(),
            "total_schedules": len(sched_list),
            "schedules": sched_list
        }

    @staticmethod
    def get_patient_medication_history(patient_identifier, limit=50):
        """
        Lấy nhật ký lịch sử uống thuốc thực tế của một bệnh nhân cụ thể.
        """
        user = _resolve_user(patient_identifier)
        if not user:
            return None

        history_records = MedicationHistory.query.filter_by(user_id=user.user_id)\
            .order_by(MedicationHistory.actual_taken_time.desc())\
            .limit(limit).all()

        return {
            "patient": {
                "user_id": user.user_id,
                "patient_code": user.patient_code,
                "full_name": user.full_name
            },
            "total_records": len(history_records),
            "history": [h.to_dict() for h in history_records]
        }

    @staticmethod
    def create_patient_prescription(patient_identifier, data):
        """
        Tạo mới một Đơn thuốc hoàn chỉnh kèm Chi tiết thuốc và Sinh lịch uống thuốc tự động.
        Thực hiện qua Database Transaction: Lỗi bất kỳ bước nào sẽ ROLLBACK hoàn toàn.
        """
        user = _resolve_user(patient_identifier)
        if not user:
            return None, "Không tìm thấy bệnh nhân"

        items_data = data.get("items", [])
        if not items_data:
            return None, "Đơn thuốc phải chứa ít nhất 1 loại thuốc"

        try:
            # 1. Generate unique prescription code
            count = Prescription.query.filter_by(user_id=user.user_id).count() + 1
            code = data.get("prescription_code") or f"RX_{user.patient_code}_{count:02d}"

            rx = Prescription(
                prescription_code=code,
                user_id=user.user_id,
                doctor_name=data.get("doctor_name", user.doctor_name or "BS. Chuyên Khoa Lão"),
                diagnosis=data.get("diagnosis", "Theo dõi và điều trị"),
                prescription_date=date.today(),
                start_date=date.today(),
                status=data.get("status", "Active"),
                note=data.get("note", "")
            )
            db.session.add(rx)
            db.session.flush()

            # 2. Add PrescriptionItems and Schedules
            for it in items_data:
                med_id = it.get("medicine_id")
                if not med_id:
                    med_name = it.get("medicine_name", "Thuốc điều trị")
                    med = Medicine.query.filter(Medicine.medicine_name.ilike(med_name)).first()
                    if not med:
                        med = Medicine(medicine_code=f"MED_{int(datetime.utcnow().timestamp())}", medicine_name=med_name)
                        db.session.add(med)
                        db.session.flush()
                    med_id = med.medicine_id

                rx_item = PrescriptionItem(
                    prescription_id=rx.prescription_id,
                    medicine_id=med_id,
                    dosage=it.get("dosage", "1 viên"),
                    frequency=it.get("frequency", "1 lần/ngày"),
                    quantity=int(it.get("quantity", 30)),
                    unit=it.get("unit", "Viên"),
                    instruction=it.get("instruction", "Uống sau ăn"),
                    start_date=date.today()
                )
                db.session.add(rx_item)
                db.session.flush()

                # Generate schedules (e.g. 08:00, 20:00)
                times = it.get("times", ["08:00"])
                today = date.today()
                for t_str in times:
                    try:
                        t_val = datetime.strptime(t_str.strip(), "%H:%M").time()
                    except Exception:
                        t_val = time(8, 0)
                    sched = MedicineSchedule(
                        prescription_item_id=rx_item.prescription_item_id,
                        medicine_id=med_id,
                        user_id=user.user_id,
                        scheduled_date=today,
                        take_time=t_val,
                        dose_amount=rx_item.dosage,
                        status="Chưa uống",
                        note=it.get("instruction", "Uống theo đơn")
                    )
                    db.session.add(sched)

            db.session.commit()
            return rx.to_dict(), None

        except SQLAlchemyError as exc:
            db.session.rollback()
            return None, f"Lỗi cơ sở dữ liệu khi tạo đơn thuốc: {str(exc)}"

    @staticmethod
    def update_prescription_item(item_id, data):
        """Cập nhật chi tiết thuốc trong đơn (Liều lượng, Tần suất, Hướng dẫn)"""
        item = db.session.get(PrescriptionItem, item_id)
        if not item:
            return None, "Không tìm thấy chi tiết thuốc trong đơn"

        try:
            if "dosage" in data:
                item.dosage = str(data["dosage"]).strip()
            if "frequency" in data:
                item.frequency = str(data["frequency"]).strip()
            if "quantity" in data:
                item.quantity = int(data["quantity"])
            if "instruction" in data:
                item.instruction = str(data["instruction"]).strip()
            if "note" in data:
                item.note = data["note"]

            # Đồng bộ cập nhật dose_amount sang các schedules liên quan
            if "dosage" in data:
                MedicineSchedule.query.filter_by(prescription_item_id=item.prescription_item_id)\
                    .update({"dose_amount": item.dosage}, synchronize_session=False)

            db.session.commit()
            return item.to_dict(), None
        except SQLAlchemyError as exc:
            db.session.rollback()
            return None, f"Lỗi khi cập nhật thuốc trong đơn: {str(exc)}"

    @staticmethod
    def delete_prescription_item(item_id):
        """Xóa một loại thuốc khỏi đơn thuốc kèm lịch uống liên quan (CASCADE)"""
        item = db.session.get(PrescriptionItem, item_id)
        if not item:
            return False, "Không tìm thấy chi tiết thuốc trong đơn"

        try:
            db.session.delete(item)
            db.session.commit()
            return True, None
        except SQLAlchemyError as exc:
            db.session.rollback()
            return False, f"Lỗi khi xóa thuốc khỏi đơn: {str(exc)}"

    @staticmethod
    def update_medication_schedule(schedule_id, data):
        """Cập nhật lịch uống thuốc (Giờ uống, Trạng thái, Liều lượng, Ghi chú)"""
        sched = db.session.get(MedicineSchedule, schedule_id)
        if not sched:
            return None, "Không tìm thấy lịch uống thuốc"

        try:
            if "take_time" in data or "time" in data:
                t_str = data.get("take_time") or data.get("time")
                try:
                    sched.take_time = datetime.strptime(t_str.strip(), "%H:%M").time()
                except Exception:
                    pass
            if "status" in data:
                sched.status = str(data["status"]).strip()
            if "dose_amount" in data or "dosage" in data:
                sched.dose_amount = str(data.get("dose_amount") or data.get("dosage")).strip()
            if "note" in data:
                sched.note = data["note"]

            db.session.commit()
            return sched.to_dict(), None
        except SQLAlchemyError as exc:
            db.session.rollback()
            return None, f"Lỗi khi cập nhật lịch uống: {str(exc)}"

    @staticmethod
    def delete_medication_schedule(schedule_id):
        """Xóa một cữ uống thuốc"""
        sched = db.session.get(MedicineSchedule, schedule_id)
        if not sched:
            return False, "Không tìm thấy lịch uống thuốc"

        try:
            db.session.delete(sched)
            db.session.commit()
            return True, None
        except SQLAlchemyError as exc:
            db.session.rollback()
            return False, f"Lỗi khi xóa lịch uống: {str(exc)}"

    @staticmethod
    def record_medication_intake(schedule_id, user_id=None, status="Đã uống", taken_by="Bệnh nhân", note=None):
        """
        Ghi nhận bệnh nhân đã uống thuốc:
        - Cập nhật trạng thái trong MedicineSchedules
        - Ghi nhật ký vào MedicationHistory
        """
        sched = db.session.get(MedicineSchedule, schedule_id)
        if not sched:
            return None, "Không tìm thấy lịch uống thuốc"

        try:
            sched.status = status
            sched.taken_at = datetime.utcnow()
            if note:
                sched.note = note

            # Ghi vào MedicationHistory
            history = MedicationHistory(
                schedule_id=sched.schedule_id,
                prescription_item_id=sched.prescription_item_id,
                user_id=sched.user_id,
                scheduled_time=datetime.combine(sched.scheduled_date, sched.take_time),
                actual_taken_time=datetime.utcnow(),
                status="Đúng giờ" if status == "Đã uống" else status,
                taken_by=taken_by,
                note=note
            )
            db.session.add(history)
            db.session.commit()
            return sched.to_dict(), None

        except SQLAlchemyError as exc:
            db.session.rollback()
            return None, f"Lỗi khi cập nhật trạng thái uống thuốc: {str(exc)}"

    @staticmethod
    def toggle_prescription_item_intake(item_id, status="Đã uống", taken_by="Bệnh nhân", note=None):
        """
        Đánh dấu trạng thái uống thuốc của một PrescriptionItem cho ngày hôm nay.
        Tạo hoặc cập nhật MedicineSchedule và ghi nhật ký vào MedicationHistory.
        """
        item = db.session.get(PrescriptionItem, item_id)
        if not item:
            return None, "Không tìm thấy thuốc trong đơn"

        rx = db.session.get(Prescription, item.prescription_id)
        user_id = rx.user_id if rx else None
        today = date.today()

        try:
            sched = MedicineSchedule.query.filter_by(
                prescription_item_id=item.prescription_item_id,
                scheduled_date=today
            ).first()

            if not sched:
                sched = MedicineSchedule(
                    prescription_item_id=item.prescription_item_id,
                    medicine_id=item.medicine_id,
                    user_id=user_id,
                    scheduled_date=today,
                    take_time=datetime.now().time(),
                    dose_amount=item.dosage,
                    status=status,
                    note=note or item.instruction
                )
                db.session.add(sched)
                db.session.flush()
            else:
                sched.status = status
                sched.taken_at = datetime.utcnow() if status == "Đã uống" else None
                if note:
                    sched.note = note

            if status == "Đã uống":
                history = MedicationHistory(
                    schedule_id=sched.schedule_id,
                    prescription_item_id=item.prescription_item_id,
                    user_id=user_id,
                    scheduled_time=datetime.combine(today, sched.take_time or datetime.now().time()),
                    actual_taken_time=datetime.utcnow(),
                    status="Đúng giờ",
                    taken_by=taken_by,
                    note=note
                )
                db.session.add(history)

            db.session.commit()
            return sched.to_dict(), None
        except SQLAlchemyError as exc:
            db.session.rollback()
            return None, f"Lỗi khi cập nhật trạng thái uống thuốc: {str(exc)}"
