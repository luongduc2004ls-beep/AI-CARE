from flask import Blueprint
from controllers.patient_controller import (
    get_all_patients,
    get_patient,
    patient_statistics,
    create_patient,
    update_patient,
    delete_patient
)

patient_bp = Blueprint("patient", __name__)

patient_bp.route("/patients", methods=["GET"])(get_all_patients)
patient_bp.route("/patients/statistics", methods=["GET"])(patient_statistics)
patient_bp.route("/patients/<int:patient_id>", methods=["GET"])(get_patient)
patient_bp.route("/patients", methods=["POST"])(create_patient)
patient_bp.route("/patients/<int:patient_id>", methods=["PUT"])(update_patient)
patient_bp.route("/patients/<int:patient_id>", methods=["DELETE"])(delete_patient)
