from middleware.response import success
from services.dashboard_service import DashboardService


def dashboard():

    return success(

        "Dashboard",

        DashboardService.overview()

    )


def statistics():

    return success(

        "Dashboard Statistics",

        DashboardService.statistics()

    )


def medicine_chart():

    return success(

        "Medicine Chart",

        DashboardService.medicine_chart()

    )


def dashboard_charts():

    return success(

        "Dashboard Charts",

        DashboardService.all_charts()

    )


def medicine_bar_chart():

    return success(

        "Medicine Bar Chart",

        DashboardService.medicine_bar_chart()

    )


def medicine_pie_chart():

    return success(

        "Medicine Pie Chart",

        DashboardService.medicine_pie_chart()

    )


def medicine_line_chart():

    return success(

        "Medicine Line Chart",

        DashboardService.medicine_line_chart()

    )


def summary():

    return success(

        "Dashboard Summary",

        DashboardService.summary()

    )


def recent_activities():

    return success(

        "Recent Activities",

        DashboardService.recent_activities()

    )

