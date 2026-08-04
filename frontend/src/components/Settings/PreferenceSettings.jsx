// ============================
// Imports
// ============================

import { useState } from "react";
import { FaBell, FaGlobe, FaMoon, FaPalette, FaVolumeUp } from "react-icons/fa";

function PreferenceSettings() {
  // ============================
  // State
  // ============================

  const [preferences, setPreferences] = useState({
    language: "vi",
    theme: "light",
    notifications: true,
    emailNotifications: true,
    soundNotifications: true,
    darkMode: false,
  });

  const [message, setMessage] = useState("");

  // ============================
  // Event Handlers
  // ============================

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setPreferences((previousPreferences) => ({
      ...previousPreferences,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    setMessage("Tùy chọn đã được cập nhật trên giao diện.");
  };

  // ============================
  // Render
  // ============================

  return (
    <form onSubmit={handleSave}>
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-success bg-opacity-10 text-success rounded-3 p-3"><FaPalette className="fs-4" /></div>
            <div>
              <h2 className="h5 fw-bold mb-1">Tùy chọn hệ thống</h2>
              <p className="text-muted small mb-0">Thiết lập giao diện và cách nhận thông báo.</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-6">
              <label htmlFor="language" className="form-label fw-semibold"><FaGlobe className="me-2 text-primary" />Ngôn ngữ</label>
              <select id="language" name="language" className="form-select" value={preferences.language} onChange={handleChange}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="theme" className="form-label fw-semibold"><FaPalette className="me-2 text-success" />Theme</label>
              <select id="theme" name="theme" className="form-select" value={preferences.theme} onChange={handleChange}>
                <option value="light">Sáng</option>
                <option value="system">Theo hệ thống</option>
              </select>
            </div>

            <div className="col-12"><hr className="my-0" /></div>

            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-3">
                <input id="dark-mode" name="darkMode" className="form-check-input" type="checkbox" checked={preferences.darkMode} onChange={handleChange} />
                <label className="form-check-label fw-semibold" htmlFor="dark-mode"><FaMoon className="me-2" />Dark Mode</label>
              </div>
              <small className="text-muted">Tùy chọn giao diện tối hiện chỉ là bản xem trước.</small>
            </div>

            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-3">
                <input id="notifications" name="notifications" className="form-check-input" type="checkbox" checked={preferences.notifications} onChange={handleChange} />
                <label className="form-check-label fw-semibold" htmlFor="notifications"><FaBell className="me-2" />Bật thông báo</label>
              </div>
              <small className="text-muted">Nhận thông báo trực tiếp trên hệ thống.</small>
            </div>

            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-3">
                <input id="email-notifications" name="emailNotifications" className="form-check-input" type="checkbox" checked={preferences.emailNotifications} onChange={handleChange} />
                <label className="form-check-label fw-semibold" htmlFor="email-notifications">Gửi thông báo qua email</label>
              </div>
              <small className="text-muted">Tính năng sẽ hoạt động khi có Backend.</small>
            </div>

            <div className="col-12 col-lg-6">
              <div className="form-check form-switch mb-3">
                <input id="sound-notifications" name="soundNotifications" className="form-check-input" type="checkbox" checked={preferences.soundNotifications} onChange={handleChange} />
                <label className="form-check-label fw-semibold" htmlFor="sound-notifications"><FaVolumeUp className="me-2" />Âm thanh thông báo</label>
              </div>
              <small className="text-muted">Phát âm thanh khi có cảnh báo mới.</small>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-4">
            {message ? <span className="text-success small fw-semibold">{message}</span> : <span />}
            <button type="submit" className="btn btn-primary">Lưu tùy chọn</button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default PreferenceSettings;
