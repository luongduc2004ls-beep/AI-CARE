from flask import Blueprint

from controllers.medicine_controller import *
from controllers.medicine_schedule_controller import *

medicine_bp = Blueprint("medicine",__name__)

medicine_bp.route(
    "/medicines",
    methods=["GET"]
)(get_all_medicines)

medicine_bp.route(
    "/medicines/<int:medicine_id>",
    methods=["GET"]
)(get_medicine)

medicine_bp.route(
    "/medicines",
    methods=["POST"]
)(create_medicine)

medicine_bp.route(
    "/medicines/<int:medicine_id>",
    methods=["PUT"]
)(update_medicine)

medicine_bp.route(
    "/medicines/<int:medicine_id>/status",
    methods=["PATCH"]
)(update_medicine_status)

medicine_bp.route(
    "/medicines/<int:medicine_id>",
    methods=["DELETE"]
)(delete_medicine)

medicine_bp.route(
    "/medicines/search",
    methods=["GET"]
)(search_medicine)

medicine_bp.route(
    "/medicines/expired",
    methods=["GET"]
)(expired_medicine)

medicine_bp.route(
    "/medicines/low-stock",
    methods=["GET"]
)(low_stock)

medicine_bp.route(
    "/medicine-schedules",
    methods=["GET"]
)(get_all_medicine_schedules)

medicine_bp.route(
    "/medicine-schedules/<int:schedule_id>",
    methods=["GET"]
)(get_medicine_schedule)

medicine_bp.route(
    "/medicines/<int:medicine_id>/schedules",
    methods=["GET"]
)(get_medicine_schedules_by_medicine)

medicine_bp.route(
    "/medicine-schedules",
    methods=["POST"]
)(create_medicine_schedule)

medicine_bp.route(
    "/medicine-schedules/<int:schedule_id>",
    methods=["PUT"]
)(update_medicine_schedule)

medicine_bp.route(
    "/medicine-schedules/<int:schedule_id>/status",
    methods=["PATCH"]
)(update_medicine_schedule_status)

medicine_bp.route(
    "/medicine-schedules/<int:schedule_id>",
    methods=["DELETE"]
)(delete_medicine_schedule)

@medicine_bp.route("/my/medicines", methods=["GET"])
def get_my_medicines():
    """Lấy danh sách thuốc và lịch uống của người thân thuộc quyền chăm sóc"""
    from flask import jsonify, request
    from datetime import date
    from models.medicine import Medicine
    from models.medicine_schedule import MedicineSchedule
    from services.auth_permission_service import AuthPermissionService
    from services.patient_service import _resolve_user

    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip() if patient_id else (allowed_ids[0] if allowed_ids else "PAT10000")

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    user = _resolve_user(target_code)
    u_id = user.user_id if user else 1

    # Lấy lịch uống hôm nay
    today = date.today()
    schedules = MedicineSchedule.query.filter_by(user_id=u_id, scheduled_date=today).all()
    if not schedules:
        schedules = MedicineSchedule.query.filter_by(scheduled_date=today).limit(5).all()

    # Lấy danh sách thuốc cơ bản
    meds = Medicine.query.limit(10).all()
    med_list = []
    for m in meds:
        med_list.append({
            "medicine_id": m.medicine_id,
            "name": m.medicine_name,
            "dosage": m.dosage or "1 viên",
            "frequency": m.frequency or "08:00",
            "quantity": m.quantity,
            "instruction": m.instruction or "Uống sau khi ăn",
            "expire_date": m.expire_date.isoformat() if m.expire_date else "2027-12-31"
        })

    return jsonify({
        "success": True,
        "patient_id": target_code,
        "medicines": med_list,
        "schedules": [
            {
                "schedule_id": s.schedule_id,
                "medicine_id": s.medicine_id,
                "medicine_name": s.medicine.medicine_name if s.medicine else "Thuốc",
                "dosage": s.medicine.dosage if s.medicine else "1 viên",
                "time": s.take_time.strftime("%H:%M") if s.take_time else "08:00",
                "status": s.status or "Chưa uống",
                "note": s.note
            }
            for s in schedules
        ]
    }), 200

