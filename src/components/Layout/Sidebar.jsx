// ======================================================
// Import thư viện
// ======================================================

import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import { FaBell, FaCog, FaHeartbeat, FaHome, FaPills, FaUsers, FaVideo } from "react-icons/fa";

function Sidebar() {
  // ======================================================
  // Khai báo dữ liệu menu
  // ======================================================

  // Danh sách menu dùng chung định dạng để giao diện gọn và nhất quán.
  // Mỗi mục gắn với đường dẫn "to" tương ứng route đã khai báo trong App.jsx.
  const menuItems = [
    { label: "Dashboard", icon: <FaHome />, to: "/dashboard" },
    { label: "Camera AI Báo Ngã", icon: <FaVideo />, to: "/camera" },
    { label: "Quản lý thuốc", icon: <FaPills />, to: "/medicine" },
    { label: "Theo dõi sức khỏe", icon: <FaHeartbeat />, to: "/health" },
    { label: "Người cao tuổi", icon: <FaUsers />, to: "/elderly" },
    { label: "Cảnh báo", icon: <FaBell />, to: "/notification" },
    { label: "Cài đặt", icon: <FaCog />, to: "/settings" },
  ];


  // ======================================================
  // Render giao diện
  // ======================================================

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
            <NavLink
              to={item.to}
              // Tự động thêm class "active" khi URL trùng với "to",
              // giữ nguyên tên class cũ để không đổi giao diện/hover.
              className={({ isActive }) => `nav-link sidebar-link ${isActive ? "active" : ""}`}
              key={item.label}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
