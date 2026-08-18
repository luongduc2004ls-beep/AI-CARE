import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt, FaCircle, FaChevronDown, FaHeart, FaUser } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

function UserHeader() {
  const { currentUser, logout } = useAuth();
  const { selectedPatientId, selectedPatient, assignedPatients, setSelectedPatientId } = usePatient();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getHeaderInfo = () => {
    switch (location.pathname) {
      case "/camera":
        return { title: "Camera Giám Sát Người Thân", subtitle: "Theo dõi camera an toàn trực tiếp của người thân gia đình." };
      case "/health":
        return { title: "Chỉ Số Sinh Hiệu Người Thân", subtitle: "Theo dõi nhịp tim, huyết áp và SpO2 hàng ngày." };
      case "/notification":
      case "/alert":
        return { title: "Cảnh Báo & Nhắc Nhở An Toàn", subtitle: "Nhật ký cảnh báo té ngã và nhắc nhở uống thuốc của người thân." };
      case "/elderly":
        return { title: "Hồ Sơ Sức Khỏe Người Thân", subtitle: "Thông tin liên hệ, tiền sử bệnh án và người chăm sóc." };
      case "/medicine":
        return { title: "Lịch Uống Thuốc Người Thân", subtitle: "Theo dõi và nhắc nhở các cữ uống thuốc đúng giờ." };
      case "/chatbot":
        return { title: "Trợ Lý Y Tế AI Chăm Sóc", subtitle: "Tư vấn sức khỏe và hỏi đáp nhanh về tình trạng của người thân." };
      case "/dashboard":
      default:
        return { title: "Tổng Quan Chăm Sóc Gia Đình", subtitle: "Theo dõi sức khỏe và an toàn của người thân." };
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
    <header className="px-4 py-3 sticky-top bg-white border-bottom shadow-sm" style={{ zIndex: 1020 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        {/* Left Section */}
        <div>
          <h1 className="h4 mb-1 text-dark fw-bold d-flex align-items-center gap-2">
            <FaHeart className="text-primary fs-5" />
            {title}
          </h1>
          <p className="text-muted mb-0 small">{subtitle}</p>
        </div>

        {/* Right Section */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          {/* Patient Selector Dropdown */}
          <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border">
            <FaUser className="text-primary small" />
            <span className="extra-small-text text-muted fw-semibold">Người thân:</span>
            {assignedPatients && assignedPatients.length > 1 ? (
              <select
                className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark p-0 pe-4"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {assignedPatients.map((pat) => (
                  <option key={pat.patient_code || pat.patient_id || pat.id} value={pat.patient_code || pat.patient_id || pat.id}>
                    {pat.full_name || pat.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="small fw-bold text-dark">{selectedPatient?.full_name || "Cụ Hồ Thanh Khánh"}</span>
            )}
          </div>

          <Link to="/notification" className="btn btn-light rounded-circle position-relative p-2 border" title="Cảnh báo người thân">
            <FaBell className="text-warning" />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle"></span>
          </Link>

          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-light d-flex align-items-center gap-2 p-1 pe-3 rounded-pill border"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FaUserCircle size={26} className="text-primary" />
              <span className="small text-dark fw-semibold">
                {currentUser?.full_name || currentUser?.username || "Người Thân"}
              </span>
              <FaChevronDown className="extra-small-text text-muted" />
            </button>

            {showDropdown && (
              <div className="card position-absolute end-0 mt-2 p-2 shadow-lg bg-white border text-dark" style={{ width: "220px", zIndex: 1050 }}>
                <div className="p-2 mb-2 border-bottom text-center">
                  <div className="fw-semibold text-dark small">{currentUser?.full_name || currentUser?.username}</div>
                  <div className="extra-small-text text-primary">Người Chăm Sóc Gia Đình</div>
                </div>
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

export default UserHeader;
