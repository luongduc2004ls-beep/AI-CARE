from flask import request
from services.patient_service import PatientService
from middleware.response import success, error

def get_all_patients():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        page = 1
        per_page = 20

    keyword = request.args.get("keyword") or request.args.get("search")
    result = PatientService.get_all(page=page, per_page=per_page, keyword=keyword)
    return success("Patient list", result)

def get_patient(patient_id):
    patient = PatientService.get_by_id(patient_id)
    if not patient:
        return error("Patient not found", 404)
    return success("Patient detail", patient)

def patient_statistics():
    stats = PatientService.statistics()
    return success("Patient statistics", stats)

def create_patient():
    data = request.get_json(silent=True) or {}
    try:
        patient = PatientService.create(data)
        return success("Patient created", patient, 201)
    except ValueError as exc:
        return error(str(exc), 400)

def update_patient(patient_id):
    data = request.get_json(silent=True) or {}
    patient = PatientService.update(patient_id, data)
    if not patient:
        return error("Patient not found", 404)
    return success("Patient updated", patient)

def delete_patient(patient_id):
    deleted = PatientService.delete(patient_id)
    if not deleted:
        return error("Patient not found", 404)
    return success("Patient deleted")

def count_patients():
    result = PatientService.get_all(page=1, per_page=1)
    total = result.get("total", 0)
    return success("Patient count", {"total_patients": total})

