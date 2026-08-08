// ==============================================================================
// THANH ĐIỀU HƯỚNG BÊN TRÁI HỆ THỐNG (SIDEBAR.JSX)
// ==============================================================================
// Mô tả: Hiển thị các nhóm Menu điều hướng theo phân quyền (Admin / Người Thân).
//        Đã tích hợp mục "Trợ Lý AI Gemini" truy cập trực tiếp tới trang Chatbot.
// ==============================================================================

import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import {
  FaBell,
  FaCog,
  FaHeartbeat,
  FaHome,
  FaPills,
  FaUsers,
  FaVideo,
  FaUserInjured,
  FaChartPie,
  FaCircle,
  FaUserCircle,
  FaRobot
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  // Danh mục Menu dành cho Quản Trị Viên (Admin)
  const adminMenuGroups = [
    {
      title: "Hệ Thống Quản Trị",
      items: [
        { label: "Dashboard Quản Trị", icon: <FaChartPie />, to: "/dashboard" },
      ],
    },
    {
      title: "Giám Sát AI & An Toàn",
      items: [
        { label: "Trợ Lý AI Gemini", icon: <FaRobot />, to: "/chatbot", badge: "GEMINI", badgeColor: "bg-primary text-white" },
        { label: "Quản Lý Camera AI", icon: <FaVideo />, to: "/camera", badge: "AI ON", badgeColor: "bg-success text-white" },
        { label: "Nhật Ký Cảnh Báo", icon: <FaBell />, to: "/notification" },
      ],
    },
    {
      title: "Quản Lý Y Tế & Bệnh Nhân",
      items: [
        { label: "Quản Lý Đơn Thuốc", icon: <FaPills />, to: "/medicine" },
        { label: "Quản Lý Bệnh Nhân", icon: <FaUsers />, to: "/elderly" },
        { label: "Theo Dõi Sinh Hiệu", icon: <FaHeartbeat />, to: "/health" },
      ],
    },
    {
      title: "Cấu Hình Hệ Thống",
      items: [
        { label: "Cấu Hình Hệ Thống", icon: <FaCog />, to: "/settings" },
      ],
    },
  ];

  // Danh mục Menu dành cho Người Thân Gia Đình (User)
  const userMenuGroups = [
    {
      title: "Tổng Quan Gia Đình",
      items: [
        { label: "Tổng Quan Gia Đình", icon: <FaHome />, to: "/dashboard" },
      ],
    },
    {
      title: "Giám Sát An Toàn AI",
      items: [
        { label: "Trợ Lý AI Gemini", icon: <FaRobot />, to: "/chatbot", badge: "GEMINI", badgeColor: "bg-primary text-white" },
        { label: "Camera Giám Sát AI", icon: <FaVideo />, to: "/camera", badge: "AI ON", badgeColor: "bg-success text-white" },
        { label: "Nhật Ký & Cảnh Báo", icon: <FaBell />, to: "/notification" },
      ],
    },
    {
      title: "Chăm Sóc Y Tế Người Thân",
      items: [
        { label: "Lịch Uống Thuốc", icon: <FaPills />, to: "/medicine" },
        { label: "Chỉ Số Sinh Hiệu", icon: <FaHeartbeat />, to: "/health" },
        { label: "Hồ Sơ Y Tế Người Thân", icon: <FaUserInjured />, to: "/elderly" },
      ],
    },
    {
      title: "Tài Khoản & Cài Đặt",
      items: [
        { label: "Cài Đặt & Thông Báo", icon: <FaCog />, to: "/settings" },
      ],
    },
  ];

  const menuGroups = isAdmin ? adminMenuGroups : userMenuGroups;

  return (
    <div className="sidebar-panel text-white shadow-sm d-flex flex-column justify-content-between">
      <div className="p-3 p-xl-4">
        {/* Brand Logo */}
        <div className="sidebar-brand mb-3">
          <div className="sidebar-brand-icon-wrapper">
            <FaHeartbeat className="sidebar-brand-icon" />
          </div>
          <div className="lh-1">
            <span className="sidebar-brand-title">AI CARE</span>
            <small className="d-block text-white-50 extra-small fw-normal mt-1">Elderly Health AI System</small>
          </div>
        </div>

        {/* Role Badge Header */}
        <div className="mb-4">
          <div className={`p-2 px-3 rounded-4 d-flex align-items-center gap-2 shadow-sm ${isAdmin ? "bg-warning text-dark" : "bg-info text-dark"}`}>
            <span className="pulse-dot"></span>
            <div className="lh-sm text-truncate">
              <span className="fw-bold extra-small text-uppercase d-block mb-1 text-dark" style={{ letterSpacing: "0.5px" }}>Giao diện kết nối</span>
              <strong className="small text-truncate d-block text-dark fw-bold">{isAdmin ? "🛡️ Quản Trị Viên Hệ Thống" : "🏠 Người Thân Gia Đình"}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        {menuGroups.map((group, groupIdx) => (
          <div className="mb-3" key={groupIdx}>
            <p className="sidebar-category-header text-uppercase mb-2">
              {group.title}
            </p>
            <nav className="nav flex-column gap-1" aria-label={group.title}>
              {group.items.map((item) => (
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link sidebar-link ${isActive ? "active" : ""}`}
                  key={item.label}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badgeColor || "bg-primary"} rounded-pill sidebar-item-badge`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Profile Info Card in Sidebar */}
      <div className="p-3 mx-3 mb-3 rounded-4 sidebar-user-card border border-white border-opacity-10">
        <div className="d-flex align-items-center gap-2">
          <FaUserCircle className="fs-3 text-info flex-shrink-0" />
          <div className="lh-sm overflow-hidden flex-grow-1">
            <div className="fw-bold text-white text-truncate small">{currentUser?.full_name || currentUser?.username || "Người Thân"}</div>
            <div className="text-white-50 extra-small d-flex align-items-center gap-1 mt-1">
              <FaCircle className="text-success extra-small-icon" /> Trực tuyến &amp; Bảo mật
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
