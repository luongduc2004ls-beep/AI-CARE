import React, { useState } from "react";
import { FaBell, FaGlobe, FaMoon, FaPalette, FaSun, FaDesktop, FaVolumeUp, FaCheckCircle } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

function PreferenceSettings() {
  const { themeMode, activeTheme, changeThemeMode } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [message, setMessage] = useState("");

  const handleThemeChange = (mode) => {
    changeThemeMode(mode);
    setMessage(`Đã chuyển giao diện sang: ${mode === "light" ? "Giao Diện Sáng" : mode === "dark" ? "Giao Diện Tối" : "Tự Động Theo Hệ Thống"}`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMessage("Đã lưu tất cả tùy chọn cấu hình hệ thống thành công!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <form onSubmit={handleSave}>
      <div className="card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-success bg-opacity-10 text-success rounded-4 p-3">
              <FaPalette className="fs-3" />
            </div>
            <div>
              <h2 className="h5 fw-bold mb-1">Tùy Chọn Giao Diện Sáng / Tối &amp; Hệ Thống</h2>
              <p className="text-muted small mb-0">Tùy chỉnh chế độ hiển thị phù hợp với điều kiện ánh sáng môi trường</p>
            </div>
          </div>

          {message && (
            <div className="alert alert-success rounded-3 p-3 mb-4 small d-flex align-items-center gap-2">
              <FaCheckCircle className="fs-5 flex-shrink-0 text-success" />
              <div>{message}</div>
            </div>
          )}

          {/* CHỌN CHẾ ĐỘ GIAO DIỆN */}
          <div className="mb-4">
            <label className="form-label fw-bold small text-uppercase text-muted mb-3">
              Chế Độ Hiển Thị Giao Diện (Theme Mode)
            </label>
            <div className="row g-3">
              {/* Op 1: Sáng */}
              <div className="col-12 col-md-4">
                <div
                  className={`card border-2 shadow-sm rounded-4 p-3 cursor-pointer text-center h-100 transition-all ${
                    themeMode === "light" ? "border-primary bg-primary bg-opacity-10" : "border-light-subtle bg-light"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleThemeChange("light")}
                >
                  <div className="d-inline-flex p-3 bg-warning text-dark rounded-circle mb-2 mx-auto shadow-sm align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <FaSun className="fs-3 text-dark" />
                  </div>
                  <h6 className="fw-bold mb-1 text-body">☀️ Giao Diện Sáng</h6>
                  <p className="text-muted small mb-0">Rõ ràng, trực quan cho ban ngày</p>
                  {themeMode === "light" && <span className="badge bg-primary rounded-pill mt-2">Đang chọn</span>}
                </div>
              </div>

              {/* Op 2: Tối */}
              <div className="col-12 col-md-4">
                <div
                  className={`card border-2 shadow-sm rounded-4 p-3 cursor-pointer text-center h-100 transition-all ${
                    themeMode === "dark" ? "border-info bg-dark text-white" : "border-light-subtle bg-light"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleThemeChange("dark")}
                >
                  <div className="d-inline-flex p-3 bg-info text-dark rounded-circle mb-2 mx-auto shadow-sm align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <FaMoon className="fs-3 text-dark" />
                  </div>
                  <h6 className="fw-bold mb-1 text-body">🌙 Giao Diện Tối (Dark)</h6>
                  <p className="text-muted small mb-0">Dịu mắt khi theo dõi camera đêm</p>
                  {themeMode === "dark" && <span className="badge bg-info rounded-pill mt-2">Đang chọn</span>}
                </div>
              </div>

              {/* Op 3: Theo Hệ Thống */}
              <div className="col-12 col-md-4">
                <div
                  className={`card border-2 shadow-sm rounded-4 p-3 cursor-pointer text-center h-100 transition-all ${
                    themeMode === "system" ? "border-success bg-success bg-opacity-10" : "border-light-subtle bg-light"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleThemeChange("system")}
                >
                  <div className="d-inline-flex p-3 bg-success text-white rounded-circle mb-2 mx-auto shadow-sm align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <FaDesktop className="fs-3 text-white" />
                  </div>
                  <h6 className="fw-bold mb-1 text-body">💻 Theo Hệ Thống (Auto OS)</h6>
                  <p className="text-muted small mb-0">Tự động đồng bộ chế độ Windows/Mac</p>
                  {themeMode === "system" && <span className="badge bg-success rounded-pill mt-2">Đang chọn (Chế độ: {activeTheme === "dark" ? "Tối" : "Sáng"})</span>}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4 text-secondary opacity-25" />

          {/* TÙY CHỌN ÂM THANH & THÔNG BÁO */}
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-2">
                <input
                  id="sound-notifications"
                  className="form-check-input"
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <label className="form-check-label fw-bold text-body" htmlFor="sound-notifications">
                  <FaVolumeUp className="me-2 text-warning" /> Âm thanh còi báo động té ngã
                </label>
              </div>
              <small className="text-muted d-block ms-4">Phát âm thanh còi hú khi AI phát hiện sự cố bất thường quá 10s.</small>
            </div>

            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-2">
                <input
                  id="email-notifications"
                  className="form-check-input"
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                />
                <label className="form-check-label fw-bold text-body" htmlFor="email-notifications">
                  <FaBell className="me-2 text-primary" /> Thông báo đẩy đến điện thoại &amp; Email
                </label>
              </div>
              <small className="text-muted d-block ms-4">Gửi email thông báo khẩn cấp khi người thân té ngã.</small>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">
              Lưu Tất Cả Tùy Chọn Cấu Hình
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default PreferenceSettings;
