import "./Sidebar.css";
import { FaBell, FaCog, FaHeartbeat, FaHome, FaPills, FaUsers } from "react-icons/fa";

function Sidebar({ activeTab, onTabChange }) {
  // Danh sách menu dùng chung định dạng để giao diện gọn và nhất quán.
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaHome /> },
    { id: "medicines", label: "Quản lý thuốc", icon: <FaPills /> },
    { id: "health", label: "Theo dõi sức khỏe", icon: <FaHeartbeat /> },
    { id: "patients", label: "Người cao tuổi", icon: <FaUsers /> },
    { id: "alerts", label: "Cảnh báo", icon: <FaBell /> },
    { id: "settings", label: "Cài đặt", icon: <FaCog /> },
  ];

  return (
    <div className="sidebar-panel bg-primary text-white shadow-sm">
      <div className="p-3 p-xl-4">
        <div className="sidebar-brand mb-4">
          <FaHeartbeat className="sidebar-brand-icon" />
          <span>AI CARE</span>
        </div>

        <p className="sidebar-label text-uppercase mb-2">Điều hướng</p>

        <nav className="nav flex-column gap-1" aria-label="Điều hướng chính">
          {menuItems.map((item) => (
            <a
              href="#"
              className={`nav-link sidebar-link ${activeTab === item.id ? "active" : ""}`}
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                onTabChange(item.id);
              }}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
