from middleware.response import error


def validate_medicine(data):

    if not data:
        return error("Request body is empty")

    if not data.get("medicine_name"):
        return error("Medicine name is required")

    if not data.get("dosage"):
        return error("Dosage is required")

    if data.get("quantity") is None:
        return error("Quantity is required")

    try:
        quantity = int(data["quantity"])

        if quantity < 0:
            return error("Quantity must be greater than or equal to 0")

    except ValueError:
        return error("Quantity must be a number")

    return None