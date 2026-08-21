import React, { useState } from "react";
import { FaUser, FaLock, FaShieldAlt, FaSignInAlt, FaEye, FaEyeSlash, FaCheckCircle, FaUserPlus, FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const { themeMode, changeThemeMode } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin1");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCycleTheme = () => {
    if (themeMode === "light") changeThemeMode("dark");
    else if (themeMode === "dark") changeThemeMode("system");
    else changeThemeMode("light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const res = await login(username, password);
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        navigate("/");
      }, 600);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleQuickLogin = async (usr, pwd) => {
    setUsername(usr);
    setPassword(pwd);
    setErrorMessage("");
    const res = await login(usr, pwd);
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        navigate("/");
      }, 600);
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

      <div className="card border-0 shadow-lg rounded-5 overflow-hidden bg-body-tertiary border text-body" style={{ maxWidth: "460px", width: "100%" }}>
        <div className="p-4 p-md-5">
          {/* Logo & Header */}
          <div className="text-center mb-4">
            <div className="bg-primary text-white rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: "64px", height: "64px" }}>
              <FaShieldAlt className="fs-2 text-white" />
            </div>
            <h3 className="fw-bold text-body mb-1">Đăng Nhập AI CARE</h3>
            <p className="text-body-secondary small mb-0">Hệ thống bảo mật dữ liệu sức khỏe &amp; báo động ngã cá nhân</p>
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
            {/* Username Input */}
            <div className="mb-3">
              <label className="form-label text-body-secondary small fw-bold">Tên Đăng Nhập / Email</label>
              <div className="input-group">
                <span className="input-group-text bg-body text-primary border border-end-0">
                  <FaUser />
                </span>
                <input
                  type="text"
                  className="form-control bg-body text-body border border-start-0"
                  placeholder="admin hoặc cunguyenana"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="form-label text-body-secondary small fw-bold">Mật Khẩu Bảo Mật</label>
              <div className="input-group">
                <span className="input-group-text bg-body text-primary border border-end-0">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control bg-body text-body border border-start-0 border-end-0"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-body border border-start-0 text-body-secondary px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash className="text-primary" /> : <FaEye className="text-primary" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm mb-4 text-white"
              disabled={loading}
            >
              <FaSignInAlt /> {loading ? "Đang xác thực bảo mật..." : "Đăng Nhập Vào Hệ Thống"}
            </button>
          </form>

          {/* Quick Login Presets */}
          <div className="pt-3 border-top">
            <span className="small text-body-secondary d-block mb-2 text-center fw-semibold">Đăng nhập nhanh tài khoản mẫu:</span>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-body border text-start p-2 px-3 rounded-pill shadow-sm d-flex align-items-center justify-content-between gap-2"
                onClick={() => handleQuickLogin("admin1", "password123")}
              >
                <span className="small text-body fw-bold">🔑 Quản Trị Viên (Admin)</span>
                <span className="badge bg-primary text-white font-monospace extra-small">admin1 / password123</span>
              </button>

              <button
                type="button"
                className="btn btn-body border text-start p-2 px-3 rounded-pill shadow-sm d-flex align-items-center justify-content-between gap-2"
                onClick={() => handleQuickLogin("user_pat10000", "password123")}
              >
                <span className="small text-body fw-bold">🔑 Người Dùng / Gia Đình</span>
                <span className="badge bg-success text-white font-monospace extra-small">user_pat10000 / password123</span>
              </button>
            </div>
            <small className="text-muted d-block text-center mt-2 extra-small">
              💡 Thử nghiệm: Đăng nhập được với mọi tài khoản <strong>admin1..admin5</strong> hoặc <strong>user1..user1000</strong> (mật khẩu: <code>password123</code>).
            </small>
          </div>

          {/* Register Redirect */}
          <div className="text-center mt-4 pt-2">
            <span className="text-body-secondary small">Chưa có tài khoản riêng? </span>
            <Link to="/register" className="text-primary fw-bold text-decoration-none small ms-1">
              <FaUserPlus className="me-1" /> Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
