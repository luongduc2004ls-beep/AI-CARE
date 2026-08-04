// ============================
// Imports
// ============================

import { FaCog } from "react-icons/fa";
import AccountSettings from "../components/Settings/AccountSettings";
import PreferenceSettings from "../components/Settings/PreferenceSettings";

function SettingsPage() {
  // ============================
  // Render
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex align-items-start gap-3 mb-4">
        <div className="bg-secondary bg-opacity-10 text-secondary rounded-3 p-3">
          <FaCog className="fs-3" />
        </div>
        <div>
          <p className="text-secondary fw-semibold mb-1">Thiết lập hệ thống</p>
          <h1 className="h3 fw-bold mb-2">Cài đặt</h1>
          <p className="text-muted mb-0">Quản lý thông tin tài khoản, tùy chọn thông báo và giao diện sử dụng.</p>
        </div>
      </div>

      <div className="mb-4">
        <AccountSettings />
      </div>

      <PreferenceSettings />
    </section>
  );
}

export default SettingsPage;
