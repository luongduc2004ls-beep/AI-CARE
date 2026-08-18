import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt, FaCog, FaCircle, FaChevronDown, FaSearch, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import storageSyncService from "../../services/storageSyncService";

function Header() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " - " +
        now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine Title & Subtitle based on active path
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case "/camera":
        return {
          title: "Camera AI",
          subtitle: "Theo dõi camera và phát hiện bất thường theo thời gian thực."
        };
      case "/health":
        return {
          title: "Sinh hiệu",
          subtitle: "Theo dõi chỉ số sinh hiệu và sức khỏe người cao tuổi."
        };
      case "/notification":
      case "/alert":
        return {
          title: "Cảnh báo",
          subtitle: "Nhật ký cảnh báo an toàn và sự cố té ngã."
        };
      case "/elderly":
        return {
          title: "Bệnh nhân",
          subtitle: "Quản lý danh sách và hồ sơ theo dõi người cao tuổi."
        };
      case "/medicine":
        return {
          title: "Đơn thuốc",
          subtitle: "Quản lý danh mục và lịch sử uống thuốc y tế."
        };
      case "/settings":
        return {
          title: "Cấu hình",
          subtitle: "Quản lý thiết bị và cấu hình hệ thống."
        };
      case "/chatbot":
        return {
          title: "Trợ lý AI Gemini",
          subtitle: "Tư vấn và phân tích dữ liệu y tế bằng AI."
        };
      case "/dashboard":
      default:
        return {
          title: "Tổng quan Dashboard",
          subtitle: "Hệ thống AI giám sát an toàn và chăm sóc sức khỏe."
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const results = storageSyncService.instantSearch(val);
      setSearchResults(results);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="px-4 py-3 sticky-top" style={{ backgroundColor: "var(--bg-header-glass)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-color)", zIndex: 1020 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        {/* Left Section: Page Context */}
        <div>
          <h1 className="h4 page-title mb-1 d-flex align-items-center gap-2">
            {title}
          </h1>
          <p className="secondary-text mb-0">{subtitle}</p>
        </div>

        {/* Right Section: System Metrics & User Controls */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          {/* Instant Search Bar */}
          <div className="position-relative d-none d-xl-block" ref={searchRef} style={{ width: "220px" }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-muted"><FaSearch /></span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary small"
                placeholder="Tìm kiếm nhanh..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            {showSearchDropdown && (
              <div className="card position-absolute start-0 end-0 mt-2 p-2 shadow-lg" style={{ zIndex: 1060, maxHeight: "280px", overflowY: "auto" }}>
                <div className="extra-small-text text-uppercase fw-bold text-muted mb-2 px-1">Kết quả tìm kiếm ({searchResults.length})</div>
                {searchResults.length > 0 ? (
                  searchResults.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.link}
                      className="d-block p-2 rounded-2 text-decoration-none text-white hover-bg-dark"
                      onClick={() => setShowSearchDropdown(false)}
                    >
                      <div className="fw-semibold small text-primary">{item.title}</div>
                      <div className="extra-small-text text-muted">{item.subtitle}</div>
                    </Link>
                  ))
                ) : (
                  <div className="p-2 extra-small-text text-muted">Không tìm thấy dữ liệu</div>
                )}
              </div>
            )}
          </div>

          {/* System Active Status Indicator */}
          <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
            <FaCircle className="text-success" style={{ fontSize: "8px" }} />
            <span className="extra-small-text text-success fw-semibold">Hệ thống đang hoạt động</span>
          </div>

          {/* Online Camera Count Indicator */}
          <div className="d-none d-lg-block px-3 py-1 rounded-pill" style={{ backgroundColor: "var(--bg-card-subtle)", border: "1px solid var(--border-color)" }}>
            <span className="extra-small-text text-muted">12/12 camera trực tuyến</span>
          </div>

          {/* Current Time Display */}
          <div className="d-none d-md-block extra-small-text text-muted font-monospace">
            {currentTime}
          </div>

          {/* Notification Button */}
          <Link to="/notification" className="btn btn-dark rounded-circle position-relative p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px", border: "1px solid var(--border-color)" }} aria-label="Cảnh báo">
            <FaBell className="text-warning" />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle"></span>
          </Link>

          {/* User Profile / Admin Avatar */}
          {isAuthenticated ? (
            <div className="position-relative" ref={dropdownRef}>
              <button
                type="button"
                className="btn btn-dark d-flex align-items-center gap-2 p-1 pe-3 rounded-pill border"
                style={{ borderColor: "var(--border-color)" }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaUserCircle size={26} className="text-primary" />
                <span className="small text-white fw-semibold d-none d-sm-inline">
                  {currentUser?.full_name || currentUser?.username || "Admin"}
                </span>
                <FaChevronDown className="extra-small-text text-muted" />
              </button>

              {showDropdown && (
                <div className="card position-absolute end-0 mt-2 p-2 shadow-lg" style={{ width: "220px", zIndex: 1050 }}>
                  <div className="p-2 mb-2 border-bottom border-secondary text-center">
                    <div className="fw-semibold text-white small">{currentUser?.full_name || currentUser?.username}</div>
                    <div className="extra-small-text text-muted">{currentUser?.role || "Administrator"}</div>
                  </div>
                  <Link to="/settings" className="btn btn-dark btn-sm text-start mb-1 text-white border-0" onClick={() => setShowDropdown(false)}>
                    <FaCog className="me-2 text-primary" /> Cấu hình tài khoản
                  </Link>
                  <button type="button" className="btn btn-outline-danger btn-sm text-start fw-semibold" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm rounded-pill px-3 fw-semibold">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
