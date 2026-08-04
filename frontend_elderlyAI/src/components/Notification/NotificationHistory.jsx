import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaFilter,
  FaHeartbeat,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPills,
  FaSearch,
  FaTrash,
  FaUserInjured
} from "react-icons/fa";

// Cấu hình loại cảnh báo
const typeConfig = {
  fall: {
    label: "Té Ngã",
    icon: <FaUserInjured />,
    bgClass: "bg-danger bg-opacity-10 text-danger border-danger-subtle",
    badgeClass: "bg-danger"
  },
  health: {
    label: "Sức Khỏe",
    icon: <FaHeartbeat />,
    bgClass: "bg-warning bg-opacity-10 text-warning-emphasis border-warning-subtle",
    badgeClass: "bg-warning text-dark"
  },
  medicine: {
    label: "Thuốc",
    icon: <FaPills />,
    bgClass: "bg-primary bg-opacity-10 text-primary border-primary-subtle",
    badgeClass: "bg-primary"
  },
  warning: {
    label: "Cảnh Báo",
    icon: <FaExclamationTriangle />,
    bgClass: "bg-secondary bg-opacity-10 text-secondary border-secondary-subtle",
    badgeClass: "bg-secondary"
  }
};

function NotificationHistory({ historyList = [], onMarkAsRead, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  // Lọc lịch sử theo tìm kiếm, loại cảnh báo, và trạng thái
  const filteredHistory = historyList.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = (item.content || "").toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = (item.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || contentMatch || locationMatch;

    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "read" && item.isRead) ||
      (filterStatus === "unread" && !item.isRead);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Tải file CSV báo cáo lịch sử cảnh báo
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      alert("Không có dữ liệu lịch sử cảnh báo để xuất!");
      return;
    }

    const headers = ["ID", "Tiêu đề", "Nội dung", "Phân loại", "Trạng thái", "Thời gian"];
    const csvRows = [headers.join(",")];

    filteredHistory.forEach((item) => {
      const row = [
        item.id || item.notification_id || "",
        `"${(item.title || "").replace(/"/g, '""')}"`,
        `"${(item.content || "").replace(/"/g, '""')}"`,
        item.type || "",
        item.isRead ? "Đã đọc/Đã xử lý" : "Chưa đọc",
        `"${item.time || item.created_at || ""}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lich_Su_Canh_Bao_ElderlyAI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1 text-dark">
              <FaClock className="text-primary me-2" />
              Lịch sử các cảnh báo đã xuất hiện
            </h2>
            <p className="text-muted small mb-0">
              Nhật ký lưu trữ toàn bộ các thông báo, sự cố và cảnh báo an toàn theo mốc thời gian.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold"
              onClick={handleExportCSV}
            >
              📥 Xuất File CSV Báo Cáo
            </button>
            <span className="badge text-bg-secondary px-3 py-2 rounded-pill">
              Tổng số: {filteredHistory.length} bản ghi
            </span>
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc nhanh */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Tìm theo nội dung, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tất cả phân loại</option>
              <option value="fall">🚨 Té ngã khẩn cấp</option>
              <option value="health">❤️ Chỉ số sức khỏe</option>
              <option value="medicine">💊 Uống thuốc</option>
              <option value="warning">⚠️ Cảnh báo chung</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select bg-light"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unread">Chưa xử lý / Chưa đọc</option>
              <option value="read">Đã xử lý / Đã đọc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-body p-4 pt-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaInfoCircle className="fs-3 mb-2 d-block mx-auto text-secondary" />
            Không tìm thấy lịch sử cảnh báo phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="timeline-list">
            {filteredHistory.map((item, index) => {
              const cfg = typeConfig[item.type] || typeConfig.warning;
              return (
                <div
                  key={item.id || item.notification_id || index}
                  className={`p-3 mb-3 rounded-3 border transition-all ${
                    item.isRead ? "bg-white" : "bg-light border-warning-subtle"
                  }`}
                  style={{ transition: "all 0.2s ease" }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className={`p-3 rounded-3 d-flex align-items-center justify-content-center fs-4 flex-shrink-0 ${cfg.bgClass}`}
                      style={{ width: "48px", height: "48px" }}
                    >
                      {cfg.icon}
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-1">
                        <div>
                          <span className={`badge ${cfg.badgeClass} me-2`}>{cfg.label}</span>
                          <h3 className="h6 fw-bold mb-0 d-inline text-dark">{item.title}</h3>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {item.isRead ? (
                            <span className="badge text-bg-light border text-success">
                              <FaCheck className="me-1" /> Đã ghi nhận
                            </span>
                          ) : (
                            <span className="badge text-bg-danger">Mới / Chưa đọc</span>
                          )}
                        </div>
                      </div>

                      <p className="text-secondary small mb-2">{item.content}</p>

                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top border-light">
                        <div className="d-flex align-items-center gap-3 text-muted small">
                          <span>
                            <FaCalendarAlt className="me-1 text-primary" />
                            {item.time || item.created_at || "Thời gian gần đây"}
                          </span>
                          {item.location && (
                            <span>
                              <FaMapMarkerAlt className="me-1 text-danger" />
                              {item.location}
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2"
                            onClick={() => setSelectedItem(item)}
                          >
                            Chi tiết
                          </button>

                          {!item.isRead && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-1 px-2"
                              onClick={() => onMarkAsRead?.(item.id || item.notification_id)}
                            >
                              <FaCheck className="me-1" /> Đã đọc
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2"
                            onClick={() => onDelete?.(item.id || item.notification_id)}
                            title="Xóa bản ghi"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Chi tiết Cảnh báo */}
      {selectedItem && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Chi tiết bản ghi cảnh báo</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedItem(null)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Tiêu đề:</span>
                  <p className="fw-bold text-dark mb-0">{selectedItem.title}</p>
                </div>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Nội dung chi tiết:</span>
                  <div className="p-3 bg-light rounded-3 text-secondary">
                    {selectedItem.content}
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <span className="text-muted small d-block">Phân loại:</span>
                    <span className="fw-semibold text-capitalize">{selectedItem.type}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted small d-block">Thời điểm xuất hiện:</span>
                    <span className="fw-semibold">{selectedItem.time || selectedItem.created_at}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary px-4 rounded-pill"
                  onClick={() => setSelectedItem(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationHistory;
