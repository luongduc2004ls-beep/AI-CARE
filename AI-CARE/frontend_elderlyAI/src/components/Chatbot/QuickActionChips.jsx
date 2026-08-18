import React from "react";
import { FaHeartbeat, FaPills, FaExclamationTriangle, FaChartLine, FaVideo, FaShieldAlt } from "react-icons/fa";

function QuickActionChips({ onSelectAction, disabled, userRole = "Admin" }) {
  const isAdmin = userRole === "Admin";

  const adminActions = [
    { label: "Sức khỏe hệ thống", prompt: "Hệ thống hôm nay có vấn đề gì?", icon: <FaShieldAlt className="text-info" /> },
    { label: "Camera offline", prompt: "Camera nào đang offline?", icon: <FaVideo className="text-danger" /> },
    { label: "Cảnh báo khẩn cấp", prompt: "Có cảnh báo khẩn cấp nào chưa xử lý?", icon: <FaExclamationTriangle className="text-warning" /> },
    { label: "Nguy cơ té ngã", prompt: "Có ai đang có nguy cơ té ngã cao không?", icon: <FaHeartbeat className="text-danger" /> },
    { label: "Thuốc chưa uống", prompt: "Có ai đang quên uống thuốc không?", icon: <FaPills className="text-warning" /> },
  ];

  const userActions = [
    { label: "Sức khỏe hôm nay", prompt: "Tình trạng sức khỏe của tôi hôm nay thế nào?", icon: <FaHeartbeat className="text-danger" /> },
    { label: "Thuốc hôm nay", prompt: "Hôm nay tôi cần uống những loại thuốc gì?", icon: <FaPills className="text-warning" /> },
    { label: "Chỉ số 7 ngày", prompt: "Phân tích sức khỏe của tôi trong 7 ngày qua.", icon: <FaChartLine className="text-primary" /> },
    { label: "Cảnh báo an toàn", prompt: "Tôi có cảnh báo hoặc nguy cơ té ngã nào không?", icon: <FaExclamationTriangle className="text-warning" /> },
  ];

  const actions = isAdmin ? adminActions : userActions;

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap p-2 border-top border-secondary border-opacity-25" style={{ backgroundColor: "var(--bg-card)" }}>
      <span className="extra-small-text text-muted font-monospace me-1">GỢI Ý NHANH:</span>
      {actions.map((act, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          className="btn btn-sm btn-dark text-white rounded-pill px-3 py-1 extra-small-text d-flex align-items-center gap-1.5 border border-secondary border-opacity-40 hover-bg-primary"
          onClick={() => onSelectAction(act.prompt)}
        >
          {act.icon}
          <span>{act.label}</span>
        </button>
      ))}
    </div>
  );
}

export default QuickActionChips;
