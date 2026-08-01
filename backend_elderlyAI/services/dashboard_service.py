from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import selectinload

from database import db

from models.user import User
from models.medicine import Medicine
from models.medicine_schedule import MedicineSchedule
from models.notification import Notification
from models.fall_history import FallHistory
from models.health_record import HealthRecord
from services.medicine_service import MedicineService


TAKEN_STATUS = "Đã uống"
PENDING_STATUS = "Chưa uống"
MISSED_STATUS = "Quên uống"


def _today_schedule_query():

    return MedicineSchedule.query.filter(
        MedicineSchedule.scheduled_date == date.today()
    )


def _schedule_query_for_charts():

    today_query = _today_schedule_query()

    if today_query.count() > 0:
        return today_query

    return MedicineSchedule.query


def _time_slot_label(take_time):

    if take_time is None:
        return "Tối"

    hour = take_time.hour

    if 5 <= hour <= 10:
        return "Sáng"

    if 11 <= hour <= 13:
        return "Trưa"

    if 14 <= hour <= 17:
        return "Chiều"

    return "Tối"


def _weekday_label(value):

    labels = {
        0: "T2",
        1: "T3",
        2: "T4",
        3: "T5",
        4: "T6",
        5: "T7",
        6: "CN"
    }

    return labels[value.weekday()]


class DashboardService:

    @staticmethod
    def program_statistics():

        medicines = Medicine.query.options(
            selectinload(Medicine.schedules)
        ).all()
        today = date.today()
        current_time = datetime.now().time()
        total_medicines = len(medicines)
        taken = 0
        pending = 0
        missed = 0
        overdue = 0

        for medicine in medicines:
            schedule = MedicineService.get_display_schedule(medicine)
            status = schedule.status if schedule is not None else PENDING_STATUS

            if status == TAKEN_STATUS:
                taken += 1
            elif status == MISSED_STATUS:
                missed += 1
            else:
                pending += 1

            if (
                status != TAKEN_STATUS
                and schedule is not None
                and schedule.scheduled_date <= today
                and schedule.take_time < current_time
            ):
                overdue += 1

        not_taken = total_medicines - taken

        return {
            "totalMedicines": total_medicines,
            "takenMedicines": taken,
            "notTakenMedicines": not_taken,
            "todaySchedules": total_medicines,
            "onTimeMedicines": taken,
            "overdueMedicines": overdue,
            "pendingSchedules": pending,
            "missedSchedules": missed
        }

    @staticmethod
    def overview():

        total_schedules = db.session.query(
            func.count(MedicineSchedule.schedule_id)
        ).scalar()

        return {
            "totalUsers": db.session.query(func.count(User.user_id)).scalar(),

            "totalMedicines": db.session.query(
                func.count(Medicine.medicine_id)
            ).scalar(),

            "totalMedicineSchedules": total_schedules,

            "totalMedicationHistory": total_schedules,

            "totalNotifications": db.session.query(
                func.count(Notification.notification_id)
            ).scalar(),

            "totalFalls": db.session.query(
                func.count(FallHistory.fall_id)
            ).scalar(),

            "totalHealthRecords": db.session.query(
                func.count(HealthRecord.record_id)
            ).scalar(),

            **DashboardService.program_statistics()
        }

    @staticmethod
    def statistics():

        total = Medicine.query.count()

        expired = Medicine.query.filter(
            Medicine.expire_date < date.today()
        ).count()

        low_stock = Medicine.query.filter(
            Medicine.quantity < 10
        ).count()

        return {

            "totalMedicine": total,

            "expiredMedicine": expired,

            "lowStock": low_stock,

            "availableMedicine": total - expired,

            "highRiskPatients": HealthRecord.query.filter(
                HealthRecord.risk_level == "Cao"
            ).count(),

            "fallRiskPredictions": HealthRecord.query.filter(
                HealthRecord.ai_prediction == "Nguy cơ té ngã"
            ).count(),

            "forgetMedicinePredictions": HealthRecord.query.filter(
                HealthRecord.ai_prediction == "Có nguy cơ quên thuốc"
            ).count(),

            **DashboardService.program_statistics()

        }

    @staticmethod
    def medicine_chart():

        medicines = Medicine.query.all()

        result = []

        for medicine in medicines:

            result.append({

                "label": medicine.medicine_name,

                "value": medicine.quantity

            })

        return result

    @staticmethod
    def medicine_bar_chart():

        time_slots = {
            "Sáng": 0,
            "Trưa": 0,
            "Chiều": 0,
            "Tối": 0
        }

        medicines = Medicine.query.options(
            selectinload(Medicine.schedules)
        ).all()

        for medicine in medicines:
            schedule = MedicineService.get_display_schedule(medicine)

            if schedule is None:
                time_slots[_time_slot_label(None)] += 1
                continue

            time_slots[_time_slot_label(schedule.take_time)] += 1

        return [
            {
                "label": label,
                "value": value
            }
            for label, value in time_slots.items()
        ]

    @staticmethod
    def medicine_pie_chart():

        statistics = DashboardService.program_statistics()

        return [
            {
                "label": TAKEN_STATUS,
                "value": statistics["takenMedicines"]
            },
            {
                "label": PENDING_STATUS,
                "value": statistics["notTakenMedicines"]
            }
        ]

    @staticmethod
    def medicine_line_chart():

        today = date.today()
        start_date = today - timedelta(days=6)
        schedules = MedicineSchedule.query.filter(
            MedicineSchedule.scheduled_date >= start_date,
            MedicineSchedule.scheduled_date <= today
        ).all()

        result = []

        for offset in range(7):
            day = start_date + timedelta(days=offset)
            day_schedules = [
                schedule
                for schedule in schedules
                if schedule.scheduled_date == day
            ]

            taken = len([
                schedule
                for schedule in day_schedules
                if schedule.status == TAKEN_STATUS
            ])
            missed = len(day_schedules) - taken

            result.append({
                "label": _weekday_label(day),
                "taken": taken,
                "missed": missed
            })

        return result

    @staticmethod
    def all_charts():

        return {
            "stock": DashboardService.medicine_chart(),
            "bar": DashboardService.medicine_bar_chart(),
            "pie": DashboardService.medicine_pie_chart(),
            "line": DashboardService.medicine_line_chart()
        }
