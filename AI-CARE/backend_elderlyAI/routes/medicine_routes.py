from flask import Blueprint, request, jsonify
from datetime import date

from controllers.medicine_controller import (
    get_all_medicines,
    get_medicine,
    create_medicine,
    update_medicine,
    update_medicine_status,
    delete_medicine,
    search_medicine,
    expired_medicine,
    low_stock
)
from controllers.medicine_schedule_controller import (
    get_all_medicine_schedules,
    get_medicine_schedule,
    get_medicine_schedules_by_medicine,
    create_medicine_schedule,
    update_medicine_schedule,
    update_medicine_schedule_status,
    delete_medicine_schedule
)
from services.patient_medication_service import PatientMedicationService
from services.auth_permission_service import AuthPermissionService
from services.patient_service import _resolve_user

medicine_bp = Blueprint("medicine", __name__)

# ==============================================================================
# 1. MASTER MEDICINE CATALOG (Dành cho Quản lý Dược / Admin)
# ==============================================================================
medicine_bp.route("/medicines", methods=["GET"])(get_all_medicines)
medicine_bp.route("/medicines/<int:medicine_id>", methods=["GET"])(get_medicine)
medicine_bp.route("/medicines", methods=["POST"])(create_medicine)
medicine_bp.route("/medicines/<int:medicine_id>", methods=["PUT"])(update_medicine)
medicine_bp.route("/medicines/<int:medicine_id>/status", methods=["PATCH"])(update_medicine_status)
medicine_bp.route("/medicines/<int:medicine_id>", methods=["DELETE"])(delete_medicine)
medicine_bp.route("/medicines/search", methods=["GET"])(search_medicine)
medicine_bp.route("/medicines/expired", methods=["GET"])(expired_medicine)
medicine_bp.route("/medicines/low-stock", methods=["GET"])(low_stock)

# ==============================================================================
# 2. MEDICINE SCHEDULES RAW CRUD
# ==============================================================================
medicine_bp.route("/medicine-schedules", methods=["GET"])(get_all_medicine_schedules)
medicine_bp.route("/medicine-schedules/<int:schedule_id>", methods=["GET"])(get_medicine_schedule)
medicine_bp.route("/medicines/<int:medicine_id>/schedules", methods=["GET"])(get_medicine_schedules_by_medicine)
medicine_bp.route("/medicine-schedules", methods=["POST"])(create_medicine_schedule)
medicine_bp.route("/medicine-schedules/<int:schedule_id>", methods=["PUT"])(update_medicine_schedule)
medicine_bp.route("/medicine-schedules/<int:schedule_id>/status", methods=["PATCH"])(update_medicine_schedule_status)
medicine_bp.route("/medicine-schedules/<int:schedule_id>", methods=["DELETE"])(delete_medicine_schedule)

# ==============================================================================
# 3. PATIENT-SPECIFIC ISOLATED MEDICATION & PRESCRIPTION ENDPOINTS
# ==============================================================================

@medicine_bp.route("/patients/<patient_id>/prescriptions", methods=["GET"])
def get_patient_prescriptions_endpoint(patient_id):
    """Lấy toàn bộ đơn thuốc của một bệnh nhân (Patient Isolation)"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip()

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        user = _resolve_user(target_code)
        if not user or user.patient_code not in allowed_ids:
            return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    result = PatientMedicationService.get_patient_prescriptions(target_code)
    if not result:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    return jsonify({"success": True, **result}), 200


@medicine_bp.route("/patients/<patient_id>/prescriptions", methods=["POST"])
def create_patient_prescription_endpoint(patient_id):
    """Tạo đơn thuốc mới cho bệnh nhân (Atomic Transaction)"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip()

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        user = _resolve_user(target_code)
        if not user or user.patient_code not in allowed_ids:
            return jsonify({"success": False, "message": "403 Forbidden: Không có quyền tạo đơn thuốc cho bệnh nhân này"}), 403

    data = request.get_json() or {}
    rx_data, err = PatientMedicationService.create_patient_prescription(target_code, data)
    if err:
        return jsonify({"success": False, "message": err}), 400

    return jsonify({"success": True, "prescription": rx_data, "message": "Tạo đơn thuốc thành công"}), 201


@medicine_bp.route("/patients/<patient_id>/medications", methods=["GET"])
def get_patient_medications_endpoint(patient_id):
    """Lấy danh sách thuốc kê đơn thực tế của một bệnh nhân"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip()

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        user = _resolve_user(target_code)
        if not user or user.patient_code not in allowed_ids:
            return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    result = PatientMedicationService.get_patient_medications(target_code)
    if not result:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    return jsonify({"success": True, **result}), 200


@medicine_bp.route("/patients/<patient_id>/medications/schedule", methods=["GET"])
@medicine_bp.route("/patients/<patient_id>/medication-schedule", methods=["GET"])
def get_patient_medication_schedule_endpoint(patient_id):
    """Lấy lịch uống thuốc phân lập của một bệnh nhân theo ngày"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    target_date = request.args.get("date")

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip()

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        user = _resolve_user(target_code)
        if not user or user.patient_code not in allowed_ids:
            return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    result = PatientMedicationService.get_patient_medication_schedule(target_code, target_date)
    if not result:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    return jsonify({"success": True, **result}), 200


@medicine_bp.route("/patients/<patient_id>/medication-history", methods=["GET"])
def get_patient_medication_history_endpoint(patient_id):
    """Lấy nhật ký lịch sử uống thuốc của một bệnh nhân"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip()

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        user = _resolve_user(target_code)
        if not user or user.patient_code not in allowed_ids:
            return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    result = PatientMedicationService.get_patient_medication_history(target_code)
    if not result:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    return jsonify({"success": True, **result}), 200


@medicine_bp.route("/prescription-items/<int:item_id>", methods=["PUT"])
def update_prescription_item_endpoint(item_id):
    """Cập nhật chi tiết thuốc trong đơn (Liều lượng, Tần suất, Hướng dẫn)"""
    data = request.get_json() or {}
    updated, err = PatientMedicationService.update_prescription_item(item_id, data)
    if err:
        return jsonify({"success": False, "message": err}), 400
    return jsonify({"success": True, "item": updated, "message": "Cập nhật thuốc thành công"}), 200


@medicine_bp.route("/prescription-items/<int:item_id>", methods=["DELETE"])
def delete_prescription_item_endpoint(item_id):
    """Xóa thuốc khỏi đơn thuốc kèm lịch liên quan"""
    ok, err = PatientMedicationService.delete_prescription_item(item_id)
    if err:
        return jsonify({"success": False, "message": err}), 400
    return jsonify({"success": True, "message": "Đã xóa thuốc khỏi đơn thành công"}), 200


@medicine_bp.route("/medication-schedules/<int:schedule_id>", methods=["PUT"])
def update_medication_schedule_endpoint(schedule_id):
    """Cập nhật giờ uống, trạng thái của cữ thuốc"""
    data = request.get_json() or {}
    updated, err = PatientMedicationService.update_medication_schedule(schedule_id, data)
    if err:
        return jsonify({"success": False, "message": err}), 400
    return jsonify({"success": True, "schedule": updated, "message": "Cập nhật lịch uống thành công"}), 200


@medicine_bp.route("/medication-schedules/<int:schedule_id>", methods=["DELETE"])
def delete_medication_schedule_endpoint(schedule_id):
    """Xóa một cữ uống thuốc"""
    ok, err = PatientMedicationService.delete_medication_schedule(schedule_id)
    if err:
        return jsonify({"success": False, "message": err}), 400
    return jsonify({"success": True, "message": "Đã xóa lịch uống thành công"}), 200


@medicine_bp.route("/patients/<patient_id>/medications/schedule/<int:schedule_id>/take", methods=["POST"])
@medicine_bp.route("/patients/<patient_id>/medication-schedule/<int:schedule_id>/take", methods=["POST"])
def record_patient_medication_take(patient_id, schedule_id):
    """Ghi nhận bệnh nhân đã uống thuốc và lưu MedicationHistory"""
    data = request.get_json() or {}
    status = data.get("status", "Đã uống")
    taken_by = data.get("taken_by", "Bệnh nhân")
    note = data.get("note")

    sched_data, err = PatientMedicationService.record_medication_intake(
        schedule_id=schedule_id,
        user_id=None,
        status=status,
        taken_by=taken_by,
        note=note
    )
    if err:
        return jsonify({"success": False, "message": err}), 400

    return jsonify({"success": True, "schedule": sched_data, "message": "Ghi nhận uống thuốc thành công"}), 200


@medicine_bp.route("/prescription-items/<int:item_id>/take", methods=["POST", "PATCH"])
@medicine_bp.route("/prescription-items/<int:item_id>/status", methods=["PATCH", "POST"])
@medicine_bp.route("/patients/<patient_id>/items/<int:item_id>/take", methods=["POST"])
def record_prescription_item_take(item_id, patient_id=None):
    """Ghi nhận uống thuốc hoặc đổi trạng thái cữ thuốc của một loại thuốc kê đơn"""
    data = request.get_json() or {}
    status = data.get("status", "Đã uống")
    taken_by = data.get("taken_by", "Bệnh nhân")
    note = data.get("note")

    sched_data, err = PatientMedicationService.toggle_prescription_item_intake(
        item_id=item_id,
        status=status,
        taken_by=taken_by,
        note=note
    )
    if err:
        return jsonify({"success": False, "message": err}), 400

    return jsonify({"success": True, "schedule": sched_data, "message": f"Cập nhật trạng thái '{status}' thành công"}), 200


@medicine_bp.route("/my/medicines", methods=["GET"])
def get_my_medicines():
    """
    Endpoint chuẩn cho Người thân / Gia đình.
    Chỉ trả về thuốc và lịch uống của đúng bệnh nhân được cấp quyền, 100% không rò rỉ dữ liệu.
    """
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))
    patient_id = request.args.get("patient_id") or request.args.get("patientId")

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    target_code = str(patient_id).strip() if patient_id else (allowed_ids[0] if allowed_ids else "PAT10000")

    if (user_role or "").upper() != "ADMIN" and target_code not in allowed_ids:
        return jsonify({"success": False, "message": "403 Forbidden: Không có quyền truy cập bệnh nhân này"}), 403

    med_result = PatientMedicationService.get_patient_medications(target_code)
    sched_result = PatientMedicationService.get_patient_medication_schedule(target_code, date.today())

    if not med_result:
        return jsonify({"success": False, "message": "Không tìm thấy hồ sơ người thân"}), 404

    return jsonify({
        "success": True,
        "patient_id": target_code,
        "patient": med_result["patient"],
        "medicines": med_result["medications"],
        "schedules": sched_result["schedules"] if sched_result else []
    }), 200
