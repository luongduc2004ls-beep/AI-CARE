import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt, FaCog, FaCircle, FaChevronDown, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

function AdminHeader() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getHeaderInfo = () => {
    switch (location.pathname) {
      case "/camera":
        return { title: "Giám Sát Camera AI Toàn Viện", subtitle: "Trung tâm điều khiển camera đa luồng và phát hiện bất thường thời gian thực." };
      case "/health":
        return { title: "Chỉ Số Sinh Hiệu Bệnh Nhân", subtitle: "Theo dõi dữ liệu nhịp tim, huyết áp, SpO2 toàn bộ bệnh nhân." };
      case "/notification":
      case "/alert":
        return { title: "Trung Tâm Cảnh Báo Khẩn Cấp", subtitle: "Xử lý và xác nhận các sự cố té ngã và cảnh báo y tế toàn hệ thống." };
      case "/elderly":
        return { title: "Quản Lý Hồ Sơ Bệnh Nhân", subtitle: "Danh mục bệnh nhân, phân bổ giường bệnh và bác sĩ phụ trách." };
      case "/medicine":
        return { title: "Kho Dược & Quản Lý Đơn Thuốc", subtitle: "Danh mục thuốc y tế và phân bổ lịch uống thuốc toàn viện." };
      case "/admin/ai":
        return { title: "Trợ Lý AI Quản Trị Hệ Thống", subtitle: "Truy vấn dữ liệu CSDL toàn viện và đánh giá rủi ro y tế bằng AI." };
      case "/settings":
        return { title: "Cấu Hình Thiết Bị & Hệ Thống", subtitle: "Quản lý thiết bị kết nối, thông số AI và cấu hình máy chủ." };
      case "/dashboard":
      default:
        return { title: "Bảng Điều Hành Trung Tâm", subtitle: "Tổng quan các chỉ số an toàn, vận hành và telemetry toàn hệ thống." };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="px-4 py-3 sticky-top" style={{ zIndex: 1020 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        {/* Left Section */}
        <div>
          <h1 className="h4 mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text-heading)" }}>
            <FaShieldAlt className="text-danger fs-5" />
            {title}
          </h1>
          <p className="text-muted mb-0 small">{subtitle}</p>
        </div>

        {/* Right Section */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success bg-opacity-10 border border-success border-opacity-25">
            <FaCircle className="text-success" style={{ fontSize: "8px" }} />
            <span className="extra-small-text text-success fw-semibold">Hệ thống vận hành 24/7</span>
          </div>

          <Link to="/notification" className="btn btn-light rounded-circle position-relative p-2" title="Cảnh báo toàn viện">
            <FaBell className="text-warning" />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle"></span>
          </Link>

          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-light d-flex align-items-center gap-2 p-1 pe-3 rounded-pill"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FaUserCircle size={26} className="text-danger" />
              <span className="small fw-semibold" style={{ color: "var(--text-main)" }}>
                {currentUser?.full_name || currentUser?.username || "Quản Trị Viên"}
              </span>
              <FaChevronDown className="extra-small-text text-muted" />
            </button>

            {showDropdown && (
              <div className="card position-absolute end-0 mt-2 p-2 shadow-lg" style={{ width: "220px", zIndex: 1050 }}>
                <div className="p-2 mb-2 border-bottom text-center">
                  <div className="fw-semibold small" style={{ color: "var(--text-heading)" }}>{currentUser?.full_name || currentUser?.username}</div>
                  <div className="extra-small-text text-danger fw-bold">Quản Trị Hệ Thống</div>
                </div>
                <Link to="/settings" className="btn btn-light btn-sm text-start mb-1 border-0" onClick={() => setShowDropdown(false)}>
                  <FaCog className="me-2 text-primary" /> Cấu hình hệ thống
                </Link>
                <button type="button" className="btn btn-outline-danger btn-sm text-start fw-semibold w-100" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
