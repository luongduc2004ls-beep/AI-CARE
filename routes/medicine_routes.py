# ==========================================================
# medicine_routes.py
# Định nghĩa toàn bộ API Route cho quản lý thuốc
# Quy tắc: Chỉ khai báo Route, không xử lý logic tại đây
# ==========================================================

# ==========================================================
# Import thư viện
# ==========================================================

from flask import Blueprint

from controllers.medicine_controller import (
    create_medicine,
    delete_medicine,
    expired_medicines,
    get_all_medicines,
    get_medicine,
    low_stock,
    search_medicine,
    update_medicine,
)

# ==========================================================
# Khởi tạo Blueprint
# ==========================================================

medicine_bp = Blueprint(
    "medicine",
    __name__
)


# ==========================================================
# Khai báo các API Endpoints
# ==========================================================

@medicine_bp.route("/api/medicines", methods=["GET"])
def route_get_all_medicines():
    """
    Route lấy toàn bộ danh sách thuốc.
    """
    return get_all_medicines()


@medicine_bp.route("/api/medicines/search", methods=["GET"])
def route_search_medicine():
    """
    Route tìm kiếm thuốc theo từ khóa.
    """
    return search_medicine()


@medicine_bp.route("/api/medicines/low-stock", methods=["GET"])
def route_low_stock_medicines():
    """
    Route lấy danh sách thuốc sắp hết.
    """
    return low_stock()


@medicine_bp.route("/api/medicines/expired", methods=["GET"])
def route_expired_medicines():
    """
    Route lấy danh sách thuốc hết hạn.
    """
    return expired_medicines()


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["GET"])
def route_get_medicine(medicine_id: int):
    """
    Route lấy chi tiết thông tin thuốc theo ID.
    """
    return get_medicine(medicine_id)


@medicine_bp.route("/api/medicines", methods=["POST"])
def route_create_medicine():
    """
    Route thêm mới thuốc.
    """
    return create_medicine()


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["PUT"])
def route_update_medicine(medicine_id: int):
    """
    Route cập nhật thông tin thuốc theo ID.
    """
    return update_medicine(medicine_id)


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["DELETE"])
def route_delete_medicine(medicine_id: int):
    """
    Route xóa thuốc theo ID.
    """
    return delete_medicine(medicine_id)