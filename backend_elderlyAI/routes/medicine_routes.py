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
