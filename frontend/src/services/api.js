// ==========================================================
// api.js
// Khởi tạo và cấu hình Axios Instance kết nối Backend Flask API
// ==========================================================

import axios from "axios";

// Đọc Base URL từ biến môi trường Vite hoặc mặc định tới Flask Server
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
// Request Interceptor: Tự động đính kèm Token xác thực nếu có
// ==========================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
// Response Interceptor: Chuẩn hóa dữ liệu phản hồi & Xử lý lỗi
// Backend Flask trả về: { success: boolean, message: string, data: any }
// ==========================================================
api.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp phần data chứa trong Response từ Backend
    return response.data;
  },
  (error) => {
    let errorMessage = "Đã xảy ra lỗi kết nối với máy chủ.";

    if (error.response) {
      // Backend phản hồi với mã lỗi HTTP (4xx, 5xx)
      const serverMessage = error.response.data?.message;
      if (serverMessage) {
        errorMessage = serverMessage;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = "Yêu cầu không hợp lệ (400).";
            break;
          case 401:
            errorMessage = "Phiên đăng nhập đã hết hạn (401).";
            break;
          case 403:
            errorMessage = "Bạn không có quyền thực hiện thao tác này (403).";
            break;
          case 404:
            errorMessage = "Không tìm thấy dữ liệu yêu cầu (404).";
            break;
          case 500:
            errorMessage = "Lỗi máy chủ nội bộ (500).";
            break;
          default:
            errorMessage = `Lỗi hệ thống (${error.response.status}).`;
        }
      }
    } else if (error.request) {
      // Đã gửi yêu cầu nhưng không nhận được phản hồi (Network Error / CORS)
      errorMessage = "Không thể kết nối đến máy chủ Flask. Vui lòng kiểm tra kết nối mạng hoặc CORS.";
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
