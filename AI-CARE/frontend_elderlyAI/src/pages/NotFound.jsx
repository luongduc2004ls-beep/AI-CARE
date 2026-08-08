// ======================================================
// Import thư viện
// ======================================================

import { Link } from "react-router-dom";

// ======================================================
// Component NotFound
// ======================================================
// Hiển thị khi người dùng truy cập một URL không tồn tại
// trong hệ thống Route của ứng dụng.

function NotFound() {
  // ======================================================
  // Render giao diện
  // ======================================================

  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
      <h1 className="display-3 fw-bold text-primary mb-2">404</h1>
      <p className="fs-5 text-secondary mb-4">Không tìm thấy trang</p>

      {/* Dùng Link để người dùng tự bấm quay về, không tự động redirect */}
      <Link to="/dashboard" className="btn btn-primary">
        Quay về Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
