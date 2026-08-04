import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

function Header() {
  return (
    <header className="bg-white border-bottom shadow-sm px-3 px-md-4 py-3 sticky-top">
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h2 className="h4 fw-bold mb-0 text-primary">AI CARE Dashboard</h2>
            <small className="text-muted">Hệ thống hỗ trợ chăm sóc người cao tuổi</small>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            <div className="input-group d-none d-md-flex" style={{ width: "260px" }}>
              <span className="input-group-text bg-light border-end-0"><FaSearch /></span>
              <input type="text" className="form-control bg-light border-start-0" placeholder="Tìm kiếm..." />
            </div>

            <button type="button" className="btn btn-light rounded-circle" aria-label="Thông báo">
              <FaBell />
            </button>

            <div className="d-flex align-items-center gap-2">
              <FaUserCircle size={32} className="text-primary" />
              <span className="fw-semibold d-none d-sm-inline">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
