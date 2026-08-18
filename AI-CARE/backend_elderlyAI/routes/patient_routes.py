from flask import Blueprint, jsonify, request
from controllers.patient_controller import (
    get_all_patients,
    get_patient,
    patient_statistics,
    create_patient,
    update_patient,
    delete_patient,
    count_patients
)
from services.auth_permission_service import AuthPermissionService
from services.patient_service import PatientService, _resolve_user

patient_bp = Blueprint("patient", __name__)

patient_bp.route("/patients", methods=["GET"])(get_all_patients)
patient_bp.route("/patients/search", methods=["GET"])(get_all_patients)
patient_bp.route("/patients/count", methods=["GET"])(count_patients)
patient_bp.route("/patients/statistics", methods=["GET"])(patient_statistics)
patient_bp.route("/patients/<patient_id>", methods=["GET"])(get_patient)
patient_bp.route("/patients", methods=["POST"])(create_patient)
patient_bp.route("/patients/<patient_id>", methods=["PUT", "PATCH"])(update_patient)
patient_bp.route("/patients/<patient_id>", methods=["DELETE"])(delete_patient)

@patient_bp.route("/my/patients", methods=["GET"])
def get_my_patients():
    """Lấy danh sách người thân mà người dùng hiện tại được cấp quyền chăm sóc"""
    user_id = request.headers.get("X-User-Id", request.args.get("userId"))
    user_role = request.headers.get("X-User-Role", request.args.get("userRole", "User"))

    allowed_ids = AuthPermissionService.get_authorized_patient_ids(user_id, user_role)
    patients = []
    for pid in allowed_ids:
        p = PatientService.get_by_id(pid)
        if p:
            patients.append(p)

    return jsonify({
        "success": True,
        "total": len(patients),
        "data": patients
    }), 200
