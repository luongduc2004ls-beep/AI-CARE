import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaSearch, FaUserCircle, FaSignOutAlt, FaUserShield, FaSignInAlt, FaCog, FaKey, FaChevronDown, FaUser, FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import storageSyncService from "../../services/storageSyncService";

function Header() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { themeMode, activeTheme, changeThemeMode } = useTheme();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Logic tự động ẩn/hiện Header linh hoạt khi cuộn chuột (Smart Autohide Header)
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 30) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleCycleTheme = () => {
    if (themeMode === "light") changeThemeMode("dark");
    else if (themeMode === "dark") changeThemeMode("system");
    else changeThemeMode("light");
  };

  // Đóng dropdown khi bấm ra ngoài
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={`px-3 px-md-4 py-3 sticky-top header-autohide ${showHeader ? "header-visible" : "header-hidden"}`} style={{ zIndex: 1020 }}>
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h2 className="h4 fw-bold mb-0 text-primary d-flex align-items-center gap-2">
              <FaUserShield className="text-info" /> AI CARE Dashboard
            </h2>
            <small className="text-muted">
              Hệ thống bảo mật dữ liệu chăm sóc &amp; báo động ngã cá nhân
            </small>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Thanh Tìm Kiếm Tức Thì Realtime */}
            <div className="position-relative d-none d-md-block" ref={searchRef} style={{ width: "260px" }}>
              <div className="input-group">
                <span className="input-group-text border-end-0 bg-body"><FaSearch className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-body"
                  placeholder="Tìm kiếm dữ liệu tức thì..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                />
              </div>

              {/* Popover Kết Quả Tìm Kiếm Tức Thì */}
              {showSearchDropdown && (
                <div
                  className="card border-0 shadow-lg rounded-4 position-absolute start-0 end-0 mt-2 p-2"
                  style={{ zIndex: 1060, backgroundColor: "var(--bg-card)", maxHeight: "320px", overflowY: "auto" }}
                >
                  <div className="extra-small text-uppercase fw-bold text-muted px-2 py-1 border-bottom">
                    ⚡ KẾT QUẢ TÌM KIẾM TỨC THÌ ({searchResults.length})
                  </div>
                  {searchResults.length > 0 ? (
                    searchResults.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.link}
                        className="d-block p-2 rounded-3 text-decoration-none border-bottom last-border-0 text-body hover-bg-light"
                        onClick={() => setShowSearchDropdown(false)}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <strong className="small text-primary">{item.title}</strong>
                          <span className="badge bg-primary bg-opacity-15 text-primary extra-small">{item.type}</span>
                        </div>
                        <div className="extra-small text-muted text-truncate">{item.subtitle}</div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-3 text-center small text-muted">Không tìm thấy dữ liệu khớp từ khóa "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Nút Đổi Chế Độ Giao Diện (Theme Switcher 1-click) */}
            <button
              type="button"
              className="btn btn-light rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
              title={`Giao diện: ${themeMode === "light" ? "Sáng" : themeMode === "dark" ? "Tối" : "Tự động hệ thống"}. Nhấp để đổi!`}
              onClick={handleCycleTheme}
            >
              {themeMode === "light" ? (
                <FaSun className="text-warning fs-5" />
              ) : themeMode === "dark" ? (
                <FaMoon className="text-info fs-5" />
              ) : (
                <FaDesktop className="text-success fs-5" />
              )}
            </button>

            <Link to="/alert" className="btn btn-light rounded-circle position-relative d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }} aria-label="Thông báo">
              <FaBell className="text-warning" />
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </Link>

            {/* Thông tin tài khoản đăng nhập & Menu Dropdown Cài đặt */}
            {isAuthenticated ? (
              <div className="position-relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="btn btn-light d-flex align-items-center gap-2 p-2 px-3 rounded-pill border shadow-sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                >
                  <FaUserCircle size={28} className="text-primary flex-shrink-0" />
                  <div className="d-none d-sm-block text-start lh-sm">
                    <span className="fw-bold d-block text-body small mb-1">{currentUser?.full_name || currentUser?.username || "Người Thân"}</span>
                    <span className="badge bg-primary text-white extra-small px-2 py-1 rounded-pill">
                      {currentUser?.role === "Admin" ? "Quản Trị Viên" : "Người Thân Gia Đình"}
                    </span>
                  </div>
                  <FaChevronDown className={`text-muted small ms-1 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu Cài Đặt & Tài Khoản */}
                {showDropdown && (
                  <div
                    className="card border-0 shadow-lg rounded-4 position-absolute end-0 mt-2 p-2"
                    style={{ width: "260px", zIndex: 1050, backgroundColor: "var(--bg-card)" }}
                  >
                    {/* Header thông tin người dùng */}
                    <div className="p-3 bg-light rounded-3 mb-2 text-center">
                      <div className="d-inline-flex p-2 bg-primary bg-opacity-10 text-primary rounded-circle mb-2">
                        <FaUser className="fs-4" />
                      </div>
                      <h6 className="fw-bold mb-0 text-body">{currentUser?.full_name || currentUser?.username}</h6>
                      <small className="text-muted d-block">{currentUser?.email || `${currentUser?.username}@elderlyai.vn`}</small>
                      <span className="badge bg-info bg-opacity-20 text-info-emphasis fw-semibold mt-2 rounded-pill px-3">
                        {currentUser?.role === "Admin" ? "🛡️ Quản Trị Viên Hệ Thống" : "🏠 Người Thân Gia Đình"}
                      </span>
                    </div>

                    {/* Menu Nút Chức Năng Cài Đặt */}
                    <div className="d-grid gap-1">
                      <Link
                        to="/settings"
                        className="btn btn-light text-start d-flex align-items-center gap-2 rounded-3 py-2 px-3 text-body text-decoration-none fw-semibold"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaCog className="text-primary" /> Cài Đặt Hồ Sơ &amp; Mật Khẩu
                      </Link>

                      <Link
                        to="/settings"
                        className="btn btn-light text-start d-flex align-items-center gap-2 rounded-3 py-2 px-3 text-body text-decoration-none fw-semibold"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaKey className="text-warning" /> Tự Đổi Mật Khẩu Bảo Mật
                      </Link>

                      <hr className="my-1 text-secondary opacity-25" />

                      <button
                        type="button"
                        className="btn btn-outline-danger text-start d-flex align-items-center gap-2 rounded-3 py-2 px-3 fw-bold"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt /> Đăng Xuất An Toàn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-2">
                <FaSignInAlt /> Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
