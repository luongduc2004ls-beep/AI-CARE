# ==========================================================
# Import thư viện
# ==========================================================
from __future__ import annotations

from typing import Any

from flask import jsonify


# ==========================================================
# Lớp chuẩn hóa Response JSON
# ==========================================================
class ResponseBuilder:
    """
    Lớp hỗ trợ tạo Response JSON thống nhất cho toàn bộ hệ thống.
    """

    @staticmethod
    def success(
        message: str = "Thành công",
        data: Any = None,
        status_code: int = 200,
    ):
        """
        Trả về Response thành công.

        Args:
            message: Thông điệp trả về.
            data: Dữ liệu trả về.
            status_code: HTTP Status Code.

        Returns:
            Response Flask dạng JSON.
        """
        response = {
            "success": True,
            "message": message,
            "data": data,
        }

        return jsonify(response), status_code

    @staticmethod
    def error(
        message: str = "Đã xảy ra lỗi",
        status_code: int = 400,
    ):
        """
        Trả về Response lỗi.

        Args:
            message: Thông điệp lỗi.
            status_code: HTTP Status Code.

        Returns:
            Response Flask dạng JSON.
        """
        response = {
            "success": False,
            "message": message,
        }

        return jsonify(response), status_code

    @staticmethod
    def created(
        message: str = "Tạo dữ liệu thành công",
        data: Any = None,
    ):
        """
        Trả về Response khi tạo dữ liệu thành công.

        Args:
            message: Thông điệp trả về.
            data: Dữ liệu vừa tạo.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.success(
            message=message,
            data=data,
            status_code=201,
        )

    @staticmethod
    def updated(
        message: str = "Cập nhật dữ liệu thành công",
        data: Any = None,
    ):
        """
        Trả về Response khi cập nhật dữ liệu thành công.

        Args:
            message: Thông điệp trả về.
            data: Dữ liệu sau cập nhật.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.success(
            message=message,
            data=data,
            status_code=200,
        )

    @staticmethod
    def deleted(
        message: str = "Xóa dữ liệu thành công",
    ):
        """
        Trả về Response khi xóa dữ liệu thành công.

        Args:
            message: Thông điệp trả về.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.success(
            message=message,
            data=None,
            status_code=200,
        )

    @staticmethod
    def bad_request(
        message: str = "Yêu cầu không hợp lệ",
    ):
        """
        Trả về Response lỗi 400.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=400,
        )

    @staticmethod
    def unauthorized(
        message: str = "Không có quyền truy cập",
    ):
        """
        Trả về Response lỗi 401.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=401,
        )

    @staticmethod
    def forbidden(
        message: str = "Truy cập bị từ chối",
    ):
        """
        Trả về Response lỗi 403.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=403,
        )

    @staticmethod
    def not_found(
        message: str = "Không tìm thấy dữ liệu",
    ):
        """
        Trả về Response lỗi 404.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=404,
        )

    @staticmethod
    def conflict(
        message: str = "Dữ liệu đã tồn tại",
    ):
        """
        Trả về Response lỗi 409.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=409,
        )

    @staticmethod
    def unprocessable_entity(
        message: str = "Dữ liệu không hợp lệ",
    ):
        """
        Trả về Response lỗi 422.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=422,
        )

    @staticmethod
    def internal_server_error(
        message: str = "Lỗi máy chủ",
    ):
        """
        Trả về Response lỗi 500.

        Args:
            message: Thông điệp lỗi.

        Returns:
            Response Flask dạng JSON.
        """
        return ResponseBuilder.error(
            message=message,
            status_code=500,
        )
# ==========================================================
# Hàm tương thích với controller cũ
# ==========================================================

def success(message="Thành công", data=None, status=200):
    return ResponseBuilder.success(
        message=message,
        data=data,
        status_code=status,
    )


def error(message="Có lỗi xảy ra", status=400):
    return ResponseBuilder.error(
        message=message,
        status_code=status,
    )    