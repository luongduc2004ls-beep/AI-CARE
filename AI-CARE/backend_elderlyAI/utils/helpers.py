from datetime import datetime


def format_date(value):

    if value is None:
        return None

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    return value.strftime("%Y-%m-%d")