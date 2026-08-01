# ==========================================================
# health_routes.py
# Định nghĩa toàn bộ API Route cho quản lý chỉ số sức khỏe
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

from flask import Blueprint

from controllers.health_controller import (
    create_health_record,
    delete_health_record,
    get_all_health_records,
    get_health_record,
    get_latest_patient_health_record,
    get_patient_health_records,
    update_health_record,
)

# ==========================================================
# Khởi tạo Blueprint
# ==========================================================

health_bp = Blueprint(
    "health",
    __name__
)


# ==========================================================
# Khai báo các API Endpoints
# ==========================================================

@health_bp.route("/api/health-records", methods=["GET"])
def route_get_all_health_records():
    """
    Route lấy toàn bộ danh sách bản ghi chỉ số sức khỏe.
    """
    return get_all_health_records()


@health_bp.route("/api/health-records/<int:record_id>", methods=["GET"])
def route_get_health_record(record_id: int):
    """
    Route lấy chi tiết bản ghi chỉ số sức khỏe theo ID.
    """
    return get_health_record(record_id)


@health_bp.route("/api/patients/<int:patient_id>/health-records", methods=["GET"])
def route_get_patient_health_records(patient_id: int):
    """
    Route lấy lịch sử chỉ số sức khỏe của một bệnh nhân.
    """
    return get_patient_health_records(patient_id)


@health_bp.route("/api/patients/<int:patient_id>/health-records/latest", methods=["GET"])
def route_get_latest_patient_health_record(patient_id: int):
    """
    Route lấy bản ghi chỉ số sức khỏe mới nhất của một bệnh nhân.
    """
    return get_latest_patient_health_record(patient_id)


@health_bp.route("/api/health-records", methods=["POST"])
def route_create_health_record():
    """
    Route ghi nhận bản ghi chỉ số sức khỏe mới.
    """
    return create_health_record()


@health_bp.route("/api/health-records/<int:record_id>", methods=["PUT"])
def route_update_health_record(record_id: int):
    """
    Route cập nhật chỉ số sức khỏe theo ID.
    """
    return update_health_record(record_id)


@health_bp.route("/api/health-records/<int:record_id>", methods=["DELETE"])
def route_delete_health_record(record_id: int):
    """
    Route xóa bản ghi chỉ số sức khỏe theo ID.
    """
    return delete_health_record(record_id)
