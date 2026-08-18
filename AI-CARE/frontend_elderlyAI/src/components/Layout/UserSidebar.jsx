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
  FaRobot,
  FaUserCircle,
  FaHeart,
  FaSignOutAlt
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function UserSidebar() {
  const { currentUser, logout } = useAuth();

  const userMenuGroups = [
    {
      title: "TỔNG QUAN",
      items: [
        { label: "Tổng quan", icon: <FaChartPie />, to: "/dashboard" },
      ],
    },
    {
      title: "CHĂM SÓC NGƯỜI THÂN",
      items: [
        { label: "Hồ sơ người thân", icon: <FaUsers />, to: "/elderly" },
        { label: "Camera người thân", icon: <FaVideo />, to: "/camera" },
        { label: "Chỉ số sinh hiệu", icon: <FaHeartbeat />, to: "/health" },
        { label: "Lịch uống thuốc", icon: <FaPills />, to: "/medicine" },
        { label: "Cảnh báo an toàn", icon: <FaBell />, to: "/notification" },
      ],
    },
    {
      title: "TRỢ LÝ CHĂM SÓC",
      items: [
        { label: "Trợ lý AI Chăm Sóc", icon: <FaRobot />, to: "/user/ai" },
      ],
    },
  ];

  return (
    <aside className="sidebar-panel">
      <div className="p-3">
        {/* Brand Logo Header for Family Care */}
        <div className="sidebar-brand mb-3">
          <div className="sidebar-brand-icon-wrapper" style={{ background: "linear-gradient(135deg, #0d6efd 0%, #00b4d8 100%)" }}>
            <FaHeart className="sidebar-brand-icon text-white" />
          </div>
          <div>
            <span className="sidebar-brand-title">ELDERLYCARE</span>
            <div className="extra-small-text text-primary fw-bold">CHĂM SÓC GIA ĐÌNH</div>
          </div>
        </div>

        {/* Minimalist Navigation Groups */}
        {userMenuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-3">
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

      {/* User Profile Card at Bottom */}
      <div className="sidebar-ai-card mt-auto">
        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <FaUserCircle className="text-primary fs-5 flex-shrink-0" />
            <div className="lh-sm overflow-hidden">
              <div className="fw-semibold text-white small text-truncate">
                {currentUser?.full_name || currentUser?.username || "Người Thân Gia Đình"}
              </div>
              <div className="extra-small-text text-muted">Người Chăm Sóc</div>
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

export default UserSidebar;
