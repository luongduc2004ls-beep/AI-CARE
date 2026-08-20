// ==============================================================================
// NotificationHistory.jsx
// Quản Trị Hệ Thống: Danh Sách Cảnh Báo & Phân Loại Bộ Lọc Theo Từng Bệnh Nhân
// Hiển thị đầy đủ thông tin bệnh nhân, phòng, người thân, mức độ và trạng thái xử lý
// ==============================================================================

import React, { useState, useMemo } from "react";
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
  FaUserInjured,
  FaUser,
  FaPhoneAlt,
  FaUserMd,
  FaCheckCircle,
  FaEye
} from "react-icons/fa";

// Cấu hình hiển thị theo loại cảnh báo
const typeConfig = {
  fall: {
    label: "Té Ngã AI",
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
  abnormal_movement: {
    label: "Bất Thường",
    icon: <FaExclamationTriangle />,
    bgClass: "bg-warning bg-opacity-10 text-warning-emphasis border-warning-subtle",
    badgeClass: "bg-warning text-dark"
  },
  warning: {
    label: "Cảnh Báo",
    icon: <FaExclamationTriangle />,
    bgClass: "bg-secondary bg-opacity-10 text-secondary border-secondary-subtle",
    badgeClass: "bg-secondary"
  }
};

export default function NotificationHistory({ notifications = [], historyList = [], onMarkAsRead, onDelete }) {
  // Hỗ trợ cả 2 tên props để đảm bảo 100% không bị rỗng
  const rawList = notifications.length > 0 ? notifications : (historyList || []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPatient, setFilterPatient] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Trích xuất danh sách bệnh nhân duy nhất từ danh sách cảnh báo để làm bộ lọc
  const uniquePatients = useMemo(() => {
    const map = new Map();
    rawList.forEach((item) => {
      const code = item.patient_code || item.patient_id;
      const name = item.patient_name || item.name || `Bệnh nhân ${code}`;
      if (code && !map.has(code)) {
        map.set(code, { code, name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [rawList]);

  // Bộ lọc đa tiêu chí (Bệnh nhân, Tìm kiếm, Loại cảnh báo, Mức độ, Trạng thái)
  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      const pCode = item.patient_code || item.patient_id || "";
      const pName = item.patient_name || "";
      const title = item.title || "";
      const content = item.content || item.message || item.resolution_note || "";
      const location = item.location || item.room_number || "";

      // 1. Lọc theo bệnh nhân
      if (filterPatient !== "all" && pCode !== filterPatient) {
        return false;
      }

      // 2. Tìm kiếm tự do theo từ khóa
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          pCode.toLowerCase().includes(q) ||
          pName.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q) ||
          content.toLowerCase().includes(q) ||
          location.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Lọc theo loại cảnh báo
      const itemType = (item.alert_type || item.type || "").toLowerCase();
      if (filterType !== "all" && itemType !== filterType.toLowerCase()) {
        return false;
      }

      // 4. Lọc theo mức độ nghiêm trọng
      const itemSev = (item.severity || "").toUpperCase();
      if (filterSeverity !== "all" && itemSev !== filterSeverity.toUpperCase()) {
        return false;
      }

      // 5. Lọc theo trạng thái xử lý
      if (filterStatus === "unread" && (item.isRead || item.status === "RESOLVED")) {
        return false;
      }
      if (filterStatus === "read" && !item.isRead && item.status !== "RESOLVED") {
        return false;
      }

      return true;
    });
  }, [rawList, filterPatient, searchQuery, filterType, filterSeverity, filterStatus]);

  // Xuất báo cáo CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("Không có dữ liệu lịch sử cảnh báo để xuất!");
      return;
    }

    const headers = ["ID", "Mã BN", "Tên Bệnh Nhân", "Tiêu đề", "Nội dung", "Mức độ", "Trạng thái", "Vị trí", "Thời gian"];
    const csvRows = [headers.join(",")];

    filteredList.forEach((item) => {
      const row = [
        item.alert_id || item.id || item.notification_id || "",
        `"${item.patient_code || item.patient_id || ""}"`,
        `"${(item.patient_name || "").replace(/"/g, '""')}"`,
        `"${(item.title || "").replace(/"/g, '""')}"`,
        `"${(item.content || item.message || "").replace(/"/g, '""')}"`,
        item.severity || "CRITICAL",
        item.status === "RESOLVED" || item.isRead ? "Đã xử lý" : "Chưa xử lý",
        `"${item.location || item.room_number || ""}"`,
        `"${item.time || item.alert_created_at || item.created_at || ""}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Canh_Bao_Benh_Nhan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-body border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1 text-body">
              <FaClock className="text-primary me-2" />
              Nhật Ký Cảnh Báo & Giám Sát Người Cao Tuổi
            </h2>
            <p className="text-body-secondary small mb-0">
              Quản lý toàn bộ sự cố an toàn, té ngã AI và chỉ số sinh hiệu phân loại chi tiết theo từng bệnh nhân.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1"
              onClick={handleExportCSV}
            >
              📥 Xuất File CSV
            </button>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold">
              Hiển thị: {filteredList.length} / {rawList.length} cảnh báo
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* BỘ LỌC PHÂN LOẠI CHI TIẾT (PATIENT + TYPE + SEVERITY + STATUS)    */}
        {/* ================================================================== */}
        <div className="p-3 mb-3 rounded-4 bg-body-tertiary border">
          <div className="row g-2 align-items-center">
            {/* 1. Bộ lọc Chọn Bệnh Nhân Cụ Thể */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-body-secondary mb-1 d-flex align-items-center gap-1">
                <FaUser className="text-primary" /> Phân loại theo Bệnh nhân:
              </label>
              <select
                className="form-select bg-body"
                value={filterPatient}
                onChange={(e) => setFilterPatient(e.target.value)}
              >
                <option value="all">🌐 Tất cả người cao tuổi ({uniquePatients.length} bệnh nhân)</option>
                {uniquePatients.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tìm kiếm tự do */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold text-body-secondary mb-1 d-flex align-items-center gap-1">
                <FaSearch className="text-secondary" /> Tìm kiếm từ khóa:
              </label>
              <input
                type="text"
                className="form-control bg-body"
                placeholder="Tên, phòng, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 3. Phân loại sự cố */}
            <div className="col-6 col-md-2">
              <label className="form-label small fw-bold text-body-secondary mb-1">Loại cảnh báo:</label>
              <select
                className="form-select bg-body"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="fall">🚨 Té ngã AI</option>
                <option value="health">❤️ Sinh hiệu</option>
                <option value="medicine">💊 Thuốc</option>
                <option value="abnormal_movement">⚠️ Bất thường</option>
              </select>
            </div>

            {/* 4. Mức độ nghiêm trọng */}
            <div className="col-6 col-md-1.5">
              <label className="form-label small fw-bold text-body-secondary mb-1">Mức độ:</label>
              <select
                className="form-select bg-body"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="CRITICAL">🚨 Khẩn cấp</option>
                <option value="WARNING">⚠️ Cảnh báo</option>
                <option value="INFO">ℹ️ Thông tin</option>
              </select>
            </div>

            {/* 5. Trạng thái xử lý */}
            <div className="col-12 col-md-1.5">
              <label className="form-label small fw-bold text-body-secondary mb-1">Trạng thái:</label>
              <select
                className="form-select bg-body"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="unread">🔴 Chưa xử lý</option>
                <option value="read">🟢 Đã xử lý</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags theo Bệnh Nhân Nổi Bật */}
          {uniquePatients.length > 0 && (
            <div className="d-flex align-items-center gap-1 flex-wrap mt-2 pt-2 border-top border-secondary border-opacity-25">
              <span className="small text-body-secondary me-1">Chọn nhanh:</span>
              <button
                className={`btn btn-xs rounded-pill px-2.5 py-0.5 small ${filterPatient === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setFilterPatient("all")}
              >
                Tất cả
              </button>
              {uniquePatients.slice(0, 6).map((p) => (
                <button
                  key={p.code}
                  className={`btn btn-xs rounded-pill px-2.5 py-0.5 small ${filterPatient === p.code ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setFilterPatient(p.code)}
                >
                  {p.name} ({p.code})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DANH SÁCH BẢN GHI CẢNH BÁO CHI TIẾT */}
      <div className="card-body p-4 pt-2">
        {filteredList.length === 0 ? (
          <div className="text-center py-5 text-body-secondary">
            <FaInfoCircle className="fs-3 mb-2 d-block mx-auto text-primary" />
            <h6 className="fw-bold">Không tìm thấy cảnh báo phù hợp với bộ lọc</h6>
            <p className="small mb-0">Vui lòng thay đổi bộ lọc bệnh nhân hoặc trạng thái để xem thêm dữ liệu.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredList.map((item, index) => {
              const itemType = (item.alert_type || item.type || "warning").toLowerCase();
              const cfg = typeConfig[itemType] || typeConfig.warning;
              const isResolved = item.status === "RESOLVED" || item.isRead;
              const alertId = item.alert_id || item.id || item.notification_id || index;

              return (
                <div
                  key={alertId}
                  className={`p-3 rounded-4 border transition-all ${
                    isResolved ? "bg-body" : "bg-body-tertiary border-warning-subtle"
                  }`}
                  style={{
                    borderLeft: `5px solid ${
                      item.severity === "CRITICAL" ? "#ef4444" : item.severity === "WARNING" ? "#f59e0b" : "#3b82f6"
                    }`,
                    transition: "all 0.2s ease"
                  }}
                >
                  <div className="d-flex align-items-start gap-3 flex-wrap flex-md-nowrap">
                    {/* Icon loại sự cố */}
                    <div
                      className={`p-3 rounded-4 d-flex align-items-center justify-content-center fs-3 flex-shrink-0 ${cfg.bgClass}`}
                      style={{ width: "52px", height: "52px" }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Nội dung chi tiết */}
                    <div className="flex-grow-1">
                      {/* Dòng Tiêu đề + Thẻ Bệnh Nhân */}
                      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-1">
                        <div>
                          {/* BADGE THÔNG TIN BỆNH NHÂN NỔI BẬT */}
                          <span className="badge bg-primary text-white me-2 px-2.5 py-1 rounded-pill">
                            <FaUser className="me-1" />
                            {item.patient_name || item.patient_id} ({item.patient_code || item.patient_id})
                          </span>

                          <span className={`badge ${cfg.badgeClass} me-2 px-2 py-1 rounded-pill`}>
                            {cfg.label}
                          </span>

                          {item.severity === "CRITICAL" && (
                            <span className="badge bg-danger me-2 px-2 py-1 rounded-pill">🚨 Khẩn cấp</span>
                          )}

                          <h3 className="h6 fw-bold mb-0 d-inline text-body align-middle">{item.title}</h3>
                        </div>

                        {/* Trạng thái xử lý */}
                        <div className="d-flex align-items-center gap-2">
                          {isResolved ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill">
                              <FaCheck className="me-1" /> Đã xử lý an toàn
                            </span>
                          ) : (
                            <span className="badge bg-danger text-white px-3 py-1.5 rounded-pill">
                              ⚡ Chưa xử lý
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chi tiết nội dung / Ghi chú xử lý */}
                      <p className="text-body-secondary small mb-2">
                        {item.content || item.message || item.resolution_note || "Hệ thống AI ghi nhận cảnh báo sự cố an toàn."}
                      </p>

                      {/* Dòng Thông Tin Người Thân + Bác Sĩ + Vị Trí Phòng + Thời Gian */}
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-10">
                        <div className="d-flex align-items-center gap-3 text-body-secondary small flex-wrap">
                          <span className="d-flex align-items-center gap-1">
                            <FaCalendarAlt className="text-primary" />
                            {item.time || item.alert_created_at || item.created_at || "Vừa xong"}
                          </span>

                          <span className="d-flex align-items-center gap-1">
                            <FaMapMarkerAlt className="text-danger" />
                            {item.location || item.room_number || "Phòng Chăm Sóc"}
                          </span>

                          {item.caregiver_name && (
                            <span className="d-flex align-items-center gap-1 text-secondary">
                              <FaPhoneAlt className="text-success" /> Người thân: {item.caregiver_name} ({item.caregiver_phone || "090..."})
                            </span>
                          )}
                        </div>

                        {/* Nút Hành Động Xử Lý */}
                        <div className="d-flex align-items-center gap-2">
                          {!isResolved && onMarkAsRead && (
                            <button
                              className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-flex align-items-center gap-1 fw-bold"
                              onClick={() => onMarkAsRead(alertId)}
                            >
                              <FaCheckCircle /> Xác nhận & Xử lý
                            </button>
                          )}

                          {onDelete && (
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1"
                              title="Xóa khỏi lịch sử"
                              onClick={() => onDelete(alertId)}
                            >
                              <FaTrash />
                            </button>
                          )}
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
    </div>
  );
}
