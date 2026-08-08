import React, { useState } from "react";
import { FaUserPlus, FaUser, FaLock, FaEnvelope, FaShieldAlt, FaPhone, FaCheckCircle, FaSignInAlt, FaUserShield, FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const { themeMode, changeThemeMode } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "Caregiver",
    phone: ""
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCycleTheme = () => {
    if (themeMode === "light") changeThemeMode("dark");
    else if (themeMode === "dark") changeThemeMode("system");
    else changeThemeMode("light");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp!");
      return;
    }

    const res = await register(formData);
    if (res.success) {
      setSuccessMessage(res.message + " Đang chuyển sang màn hình đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body py-5 px-3 position-relative">
      {/* Nút Đổi Chế Độ Giao Diện Góc Trên Phải */}
      <div className="position-absolute top-0 end-0 p-4">
        <button
          type="button"
          className="btn btn-body border rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
          style={{ width: "44px", height: "44px" }}
          title={`Giao diện: ${themeMode === "light" ? "Sáng" : "Tối"}. Nhấp để đổi!`}
          onClick={handleCycleTheme}
        >
          {themeMode === "light" ? (
            <FaSun className="text-warning fs-5" />
          ) : themeMode === "dark" ? (
            <FaMoon className="text-info fs-5" />
          ) : (
            <FaDesktop className="text-success fs-5" />
          )}
        </button>
      </div>

      <div className="card border-0 shadow-lg rounded-5 overflow-hidden bg-body-tertiary border text-body" style={{ maxWidth: "520px", width: "100%" }}>
        <div className="p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="bg-success text-white rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: "64px", height: "64px" }}>
              <FaUserPlus className="fs-2 text-white" />
            </div>
            <h3 className="fw-bold text-body mb-1">Đăng Ký Tài Khoản AI CARE</h3>
            <p className="text-body-secondary small mb-0">Tạo không gian dữ liệu riêng cho gia đình &amp; người thân</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger border-0 rounded-4 mb-3 small d-flex align-items-center gap-2">
              <FaShieldAlt className="fs-5 flex-shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success border-0 rounded-4 mb-3 small d-flex align-items-center gap-2">
              <FaCheckCircle className="fs-5 flex-shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label text-body-secondary small fw-bold">Họ Và Tên Của Bạn</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-control bg-body text-body border"
                  placeholder="Ví dụ: Nguyễn Văn B (Người Thân Cụ A)"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-body-secondary small fw-bold">Tên Đăng Nhập</label>
                <input
                  type="text"
                  name="username"
                  className="form-control bg-body text-body border font-monospace"
                  placeholder="nvb123"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-body-secondary small fw-bold">Số Điện Thoại</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control bg-body text-body border"
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-body-secondary small fw-bold">Địa Chỉ Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control bg-body text-body border"
                  placeholder="email@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-body-secondary small fw-bold">Mật Khẩu</label>
                <input
                  type="password"
                  name="password"
                  className="form-control bg-body text-body border"
                  placeholder="Ít nhất 6 ký tự..."
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-body-secondary small fw-bold">Xác Nhận Mật Khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control bg-body text-body border"
                  placeholder="Nhập lại mật khẩu..."
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label text-body-secondary small fw-bold">Vai Trò Người Dùng</label>
                <select
                  name="role"
                  className="form-select bg-body text-body border"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Caregiver">👨‍👩‍👧 Người Thân Gia Đình / Người Chăm Sóc</option>
                  <option value="Doctor">👨‍⚕️ Bác Sĩ Chuyên Khoa Gia Đình</option>
                  <option value="Nurse">👩‍⚕️ Y Tách Điều Dưỡng Giám Sát</option>
                  <option value="Admin">🛠️ Quản Trị Viên Hệ Thống</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 py-3 rounded-pill fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm mt-4 mb-3 text-white"
              disabled={loading}
            >
              <FaUserPlus /> {loading ? "Đang mã hóa &amp; tạo tài khoản..." : "Đăng Ký Tài Khoản Mới"}
            </button>
          </form>

          <div className="text-center mt-3 pt-2">
            <span className="text-body-secondary small">Đã có tài khoản? </span>
            <Link to="/login" className="text-success fw-bold text-decoration-none small ms-1">
              <FaSignInAlt className="me-1" /> Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
