from flask import Blueprint

from controllers.dashboard_controller import *

dashboard_bp = Blueprint(

    "dashboard",

    __name__

)

dashboard_bp.route(

    "/dashboard",

    methods=["GET"]

)(dashboard)

dashboard_bp.route(

    "/dashboard/statistics",

    methods=["GET"]

)(statistics)

dashboard_bp.route(

    "/dashboard/chart",

    methods=["GET"]

)(medicine_chart)

dashboard_bp.route(

    "/dashboard/charts",

    methods=["GET"]

)(dashboard_charts)

dashboard_bp.route(

    "/dashboard/charts/bar",

    methods=["GET"]

)(medicine_bar_chart)

dashboard_bp.route(

    "/dashboard/charts/pie",

    methods=["GET"]

)(medicine_pie_chart)

dashboard_bp.route(

    "/dashboard/charts/line",

    methods=["GET"]

)(medicine_line_chart)
