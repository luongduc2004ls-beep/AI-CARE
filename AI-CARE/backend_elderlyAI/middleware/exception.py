from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError


def register_error(app):

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "API Not Found"
        }), 404

    @app.errorhandler(SQLAlchemyError)
    def database_error(error):
        return jsonify({
            "success": False,
            "message": "Database unavailable",
            "detail": str(error.orig) if getattr(error, "orig", None) else str(error)
        }), 503

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            "success": False,
            "message": "Internal Server Error"
        }), 500
