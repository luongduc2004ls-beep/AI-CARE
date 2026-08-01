# ==========================================================
# patient_routes.py
# Định nghĩa các API Route cho quản lý Bệnh nhân (Patient)
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

from flask import Blueprint

from controllers.patient_controller import (
    create_patient,
    delete_patient,
    get_all_patients,
    get_patient,
    update_patient,
)

patient_bp = Blueprint("patient", __name__)


@patient_bp.route("/api/patients", methods=["GET"])
def route_get_all_patients():
    return get_all_patients()


@patient_bp.route("/api/patients/<string:patient_id>", methods=["GET"])
def route_get_patient(patient_id: str):
    return get_patient(patient_id)


@patient_bp.route("/api/patients", methods=["POST"])
def route_create_patient():
    return create_patient()


@patient_bp.route("/api/patients/<string:patient_id>", methods=["PUT"])
def route_update_patient(patient_id: str):
    return update_patient(patient_id)


@patient_bp.route("/api/patients/<string:patient_id>", methods=["DELETE"])
def route_delete_patient(patient_id: str):
    return delete_patient(patient_id)
