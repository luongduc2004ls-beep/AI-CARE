// ==========================================================
// api.js
// Khởi tạo và cấu hình Axios Instance kết nối Backend Flask API
// ==========================================================

import axios from "axios";

// Đọc Base URL từ biến môi trường Vite hoặc mặc định tới /api (qua Vite Proxy cùng Origin)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Khởi tạo Axios Instance chính cho toàn bộ ứng dụng AI CARE
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==========================================================
// Request Interceptor: Tự động đính kèm Token Bearer
// ==========================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("elderly_ai_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================================
// Response Interceptor: Chuẩn hóa dữ liệu phản hồi & Xử lý lỗi chi tiết
// ==========================================================
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = "Đã xảy ra lỗi kết nối với máy chủ.";

    if (error.response) {
      const serverMessage = error.response.data?.message;
      if (serverMessage) {
        errorMessage = serverMessage;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = "Yêu cầu không hợp lệ (400 Bad Request).";
            break;
          case 401:
            errorMessage = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401 Unauthorized).";
            break;
          case 403:
            errorMessage = "Không có quyền truy cập dữ liệu bệnh nhân này (403 Forbidden).";
            break;
          case 404:
            errorMessage = "Không tìm thấy bệnh nhân hoặc dữ liệu yêu cầu (404 Not Found).";
            break;
          case 500:
            errorMessage = "Lỗi máy chủ Backend hoặc Cơ sở dữ liệu (500 Internal Server Error).";
            break;
          default:
            errorMessage = `Lỗi hệ thống (${error.response.status}).`;
        }
      }
    } else if (error.request) {
      errorMessage = "Không thể kết nối đến máy chủ Backend (http://127.0.0.1:5000). Vui lòng đảm bảo Flask server đang chạy.";
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
