from flask import Blueprint, jsonify, request
from datetime import datetime
from database import db
from models.health_record import HealthRecord
from models.user import User

health_bp = Blueprint("health_bp", __name__)


@health_bp.route("/health-records", methods=["GET"])
def get_all_health_records():
    """Lấy danh sách tất cả các bản ghi sức khỏe từ CSDL"""
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    query = HealthRecord.query.order_by(HealthRecord.recorded_at.desc())
    records = query.offset((page - 1) * per_page).limit(per_page).all()
    total = HealthRecord.query.count()
    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "per_page": per_page,
        "data": [r.to_dict() for r in records]
    }), 200


@health_bp.route("/health-records/<int:record_id>", methods=["GET"])
def get_health_record(record_id):
    """Lấy chi tiết một bản ghi sức khỏe"""
    record = db.session.get(HealthRecord, record_id)
    if not record:
        return jsonify({"success": False, "message": "Không tìm thấy bản ghi sức khỏe"}), 404
    return jsonify({"success": True, "data": record.to_dict()}), 200


@health_bp.route("/patients/<patient_id>/health-records", methods=["GET"])
def get_patient_health_records(patient_id):
    """Lấy toàn bộ lịch sử bản ghi sức khỏe của một bệnh nhân theo ID hoặc mã định danh"""
    from services.patient_service import _resolve_user
    user = _resolve_user(patient_id)
    if not user:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    records = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).all()
    return jsonify({
        "success": True,
        "total": len(records),
        "data": [r.to_dict() for r in records]
    }), 200


@health_bp.route("/patients/<patient_id>/health-records/latest", methods=["GET"])
def get_patient_latest_health(patient_id):
    """Lấy bản ghi sức khỏe mới nhất của bệnh nhân"""
    from services.patient_service import _resolve_user
    user = _resolve_user(patient_id)
    if not user:
        return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân"}), 404

    record = HealthRecord.query.filter_by(user_id=user.user_id).order_by(HealthRecord.recorded_at.desc()).first()
    if not record:
        return jsonify({"success": False, "message": "Chưa có bản ghi sức khỏe cho bệnh nhân này"}), 404
    return jsonify({"success": True, "data": record.to_dict()}), 200


@health_bp.route("/my/health", methods=["GET"])
def get_my_health():
    """Lấy dữ liệu sinh hiệu của người thân thuộc quyền chăm sóc"""
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
    records = HealthRecord.query.filter_by(user_id=u_id).order_by(HealthRecord.recorded_at.desc()).limit(30).all()
    latest = records[0] if records else None

    return jsonify({
        "success": True,
        "patient_id": target_code,
        "latest": latest.to_dict() if latest else None,
        "history": [r.to_dict() for r in records]
    }), 200



@health_bp.route("/health-records", methods=["POST"])
def create_health_record():
    """Tạo mới bản ghi đo sinh hiệu và cập nhật vào CSDL"""
    data = request.get_json() or {}
    patient_id = data.get("patient_id") or data.get("user_id") or 1
    from services.patient_service import _resolve_user
    user = _resolve_user(patient_id)
    user_id = user.user_id if user else 1

    hr = HealthRecord(
        user_id=user_id,
        blood_pressure=data.get("blood_pressure", "120/80"),
        heart_rate=int(data.get("heart_rate", 75)),
        spo2=int(data.get("spo2", 98)),
        body_temperature=float(data.get("body_temperature") or data.get("temperature") or 36.8),
        blood_glucose=int(data.get("blood_glucose") or data.get("glucose") or 95),
        disease=data.get("disease", "Theo dõi định kỳ"),
        fall_risk_score=int(data.get("fall_risk_score", 15)),
        risk_level=data.get("risk_level", "Thấp"),
        recorded_at=datetime.utcnow()
    )
    db.session.add(hr)
    db.session.commit()
    return jsonify({"success": True, "data": hr.to_dict()}), 201
