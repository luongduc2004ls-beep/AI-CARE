// ============================
// Imports
// ============================

import { FaFilter } from "react-icons/fa";

function NotificationFilter({ selectedType, selectedStatus, onTypeChange, onStatusChange }) {
  // ============================
  // Render
  // ============================

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-3 p-md-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-auto">
            <div className="d-flex align-items-center gap-2 text-primary fw-semibold">
              <FaFilter />
              Bộ lọc cảnh báo
            </div>
          </div>

          <div className="col-12 col-md">
            <label htmlFor="alert-type" className="form-label small fw-semibold mb-1">Loại cảnh báo</label>
            <select id="alert-type" className="form-select" value={selectedType} onChange={(event) => onTypeChange?.(event.target.value)}>
              <option value="all">Tất cả loại cảnh báo</option>
              <option value="medicine">Thuốc</option>
              <option value="health">Sức khỏe</option>
              <option value="fall">Té ngã</option>
              <option value="warning">Cảnh báo chung</option>
            </select>
          </div>

          <div className="col-12 col-md">
            <label htmlFor="alert-status" className="form-label small fw-semibold mb-1">Trạng thái</label>
            <select id="alert-status" className="form-select" value={selectedStatus} onChange={(event) => onStatusChange?.(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationFilter;
