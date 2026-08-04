// ============================
// Imports
// ============================

import { useState } from "react";
import { FaKey, FaUserCircle } from "react-icons/fa";

function AccountSettings() {
  // ============================
  // State
  // ============================

  const [profile, setProfile] = useState({ fullName: "Admin AI CARE", email: "admin@aicare.vn" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");

  // ============================
  // Event Handlers
  // ============================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previousProfile) => ({ ...previousProfile, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previousPasswords) => ({ ...previousPasswords, [name]: value }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setMessage("Thông tin tài khoản đã được cập nhật trên giao diện.");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận mật khẩu chưa khớp.");
      return;
    }

    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage("Yêu cầu đổi mật khẩu đã được ghi nhận trên giao diện.");
  };

  // ============================
  // Render
  // ============================

  return (
    <div className="row g-4">
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3"><FaUserCircle className="fs-4" /></div>
              <div>
                <h2 className="h5 fw-bold mb-1">Thông tin tài khoản</h2>
                <p className="text-muted small mb-0">Cập nhật tên hiển thị và địa chỉ email.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="mb-3">
                <label htmlFor="full-name" className="form-label fw-semibold">Họ và tên</label>
                <input id="full-name" name="fullName" type="text" className="form-control" value={profile.fullName} onChange={handleProfileChange} />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-semibold">Email</label>
                <input id="email" name="email" type="email" className="form-control" value={profile.email} onChange={handleProfileChange} />
              </div>
              <button type="submit" className="btn btn-primary">Lưu thông tin</button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3"><FaKey className="fs-4" /></div>
              <div>
                <h2 className="h5 fw-bold mb-1">Đổi mật khẩu</h2>
                <p className="text-muted small mb-0">Tạo mật khẩu mới để bảo vệ tài khoản.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label htmlFor="current-password" className="form-label fw-semibold">Mật khẩu hiện tại</label>
                <input id="current-password" name="currentPassword" type="password" className="form-control" value={passwords.currentPassword} onChange={handlePasswordChange} />
              </div>
              <div className="mb-3">
                <label htmlFor="new-password" className="form-label fw-semibold">Mật khẩu mới</label>
                <input id="new-password" name="newPassword" type="password" className="form-control" value={passwords.newPassword} onChange={handlePasswordChange} />
              </div>
              <div className="mb-4">
                <label htmlFor="confirm-password" className="form-label fw-semibold">Xác nhận mật khẩu mới</label>
                <input id="confirm-password" name="confirmPassword" type="password" className="form-control" value={passwords.confirmPassword} onChange={handlePasswordChange} />
              </div>
              <button type="submit" className="btn btn-outline-primary">Cập nhật mật khẩu</button>
            </form>
          </div>
        </div>
      </div>

      {message && <div className="col-12"><div className="alert alert-info mb-0">{message}</div></div>}
    </div>
  );
}

export default AccountSettings;
