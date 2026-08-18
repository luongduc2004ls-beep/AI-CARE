import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./Sidebar.css";
import {
  FaChartPie,
  FaVideo,
  FaHeartbeat,
  FaBell,
  FaUsers,
  FaPills,
  FaClock,
  FaDesktop,
  FaCog,
  FaHistory,
  FaRobot,
  FaUserCircle,
  FaShieldAlt
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { currentUser } = useAuth();

  const menuGroups = [
    {
      title: "TỔNG QUAN",
      items: [
        { label: "Dashboard", icon: <FaChartPie />, to: "/dashboard" },
      ],
    },
    {
      title: "GIÁM SÁT",
      items: [
        { label: "Camera AI", icon: <FaVideo />, to: "/camera" },
        { label: "Sinh hiệu", icon: <FaHeartbeat />, to: "/health" },
        { label: "Cảnh báo", icon: <FaBell />, to: "/notification" },
      ],
    },
    {
      title: "CHĂM SÓC",
      items: [
        { label: "Bệnh nhân", icon: <FaUsers />, to: "/elderly" },
        { label: "Đơn thuốc", icon: <FaPills />, to: "/medicine" },
        { label: "Nhắc nhở", icon: <FaClock />, to: "/reminder" },
      ],
    },
    {
      title: "HỆ THỐNG",
      items: [
        { label: "Thiết bị", icon: <FaDesktop />, to: "/settings" },
        { label: "Cấu hình", icon: <FaCog />, to: "/settings" },
        { label: "Nhật ký hệ thống", icon: <FaHistory />, to: "/alert" },
      ],
    },
  ];

  return (
    <aside className="sidebar-panel">
      <div className="p-3">
        {/* Brand Logo Header */}
        <div className="sidebar-brand mb-3">
          <div className="sidebar-brand-icon-wrapper">
            <FaShieldAlt className="sidebar-brand-icon" />
          </div>
          <div>
            <span className="sidebar-brand-title">ELDERLYCARE AI</span>
          </div>
        </div>

        {/* Minimalist Navigation Groups */}
        {menuGroups.map((group, groupIdx) => (
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

      {/* AI Assistant Separate Module at Bottom */}
      <div className="sidebar-ai-card">
        <div className="d-flex align-items-center gap-2 mb-2 px-1">
          <FaUserCircle className="text-primary fs-5" />
          <div className="lh-sm overflow-hidden">
            <div className="fw-semibold text-white small text-truncate">
              {currentUser?.full_name || currentUser?.username || "Admin User"}
            </div>
            <div className="extra-small-text text-muted">
              {currentUser?.role === "Admin" ? "Quản trị viên" : "Người thân"}
            </div>
          </div>
        </div>
        <Link to="/chatbot" className="sidebar-ai-button">
          <FaRobot />
          <span>✦ Hỏi trợ lý AI</span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
