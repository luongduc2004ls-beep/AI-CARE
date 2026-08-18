import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import {
  FaChartPie,
  FaVideo,
  FaHeartbeat,
  FaBell,
  FaUsers,
  FaPills,
  FaDesktop,
  FaCog,
  FaHistory,
  FaRobot,
  FaUserCircle,
  FaShieldAlt,
  FaSignOutAlt
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function AdminSidebar() {
  const { currentUser, logout } = useAuth();

  const adminMenuGroups = [
    {
      title: "TỔNG QUAN HỆ THỐNG",
      items: [
        { label: "Bảng điều hành", icon: <FaChartPie />, to: "/dashboard" },
      ],
    },
    {
      title: "GIÁM SÁT TOÀN VIỆN",
      items: [
        { label: "Camera AI", icon: <FaVideo />, to: "/camera" },
        { label: "Chỉ số sinh hiệu", icon: <FaHeartbeat />, to: "/health" },
        { label: "Cảnh báo khẩn", icon: <FaBell />, to: "/notification" },
      ],
    },
    {
      title: "QUẢN LÝ ĐIỀU TRỊ",
      items: [
        { label: "Hồ sơ bệnh nhân", icon: <FaUsers />, to: "/elderly" },
        { label: "Kho dược & Đơn thuốc", icon: <FaPills />, to: "/medicine" },
      ],
    },
    {
      title: "TRỢ LÝ AI QUẢN TRỊ",
      items: [
        { label: "Gemini AI Quản Trị", icon: <FaRobot />, to: "/admin/ai" },
      ],
    },
    {
      title: "HỆ THỐNG & CẤU HÌNH",
      items: [
        { label: "Thiết bị & Camera", icon: <FaDesktop />, to: "/settings" },
        { label: "Cấu hình AI", icon: <FaCog />, to: "/settings" },
        { label: "Nhật ký hệ thống", icon: <FaHistory />, to: "/alert" },
      ],
    },
  ];

  return (
    <aside className="sidebar-panel">
      <div className="p-3">
        {/* Brand Logo Header for Admin */}
        <div className="sidebar-brand mb-3">
          <div className="sidebar-brand-icon-wrapper">
            <FaShieldAlt className="sidebar-brand-icon" />
          </div>
          <div>
            <span className="sidebar-brand-title">ELDERLYCARE AI</span>
            <div className="extra-small-text text-danger fw-bold">QUẢN TRỊ VIỆN</div>
          </div>
        </div>

        {/* Minimalist Navigation Groups */}
        {adminMenuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-2">
            <div className="sidebar-category-header text-uppercase">
              {group.title}
            </div>
            <nav className="nav flex-column gap-1" aria-label={group.title}>
              {group.items.map((item) => (
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  key={item.label}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Admin Profile Card at Bottom */}
      <div className="sidebar-ai-card mt-auto">
        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <FaUserCircle className="text-danger fs-5 flex-shrink-0" />
            <div className="lh-sm overflow-hidden">
              <div className="fw-semibold text-white small text-truncate">
                {currentUser?.full_name || currentUser?.username || "Quản Trị Viên"}
              </div>
              <div className="extra-small-text text-muted">Quản Trị Hệ Thống</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-sm btn-outline-danger p-1 rounded-circle border-0" title="Đăng xuất">
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
