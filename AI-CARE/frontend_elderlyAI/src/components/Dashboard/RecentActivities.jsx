import { FaCheckCircle, FaEdit, FaPlusCircle, FaTrashAlt } from "react-icons/fa";
import { getActivities } from "../../services/activityService";

function RecentActivities() {
  // ============================
  // Activity Data
  // ============================

  // Service restores activity history from LocalStorage on every Dashboard render.
  const activities = getActivities();

  const activityConfig = {
    add: { icon: <FaPlusCircle />, color: "primary", text: "Đã thêm thuốc" },
    edit: { icon: <FaEdit />, color: "warning", text: "Đã cập nhật thuốc" },
    delete: { icon: <FaTrashAlt />, color: "danger", text: "Đã xóa thuốc" },
    taken: { icon: <FaCheckCircle />, color: "success", text: "Đã đánh dấu đã uống" },
  };

  const formatActivityTime = (createdAt) =>
    new Date(createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  // ============================
  // Render
  // ============================

  return (
    <div className="col-12">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Hoạt động gần đây</h5>
            <span className="badge text-bg-light border text-secondary">{activities.length} hoạt động</span>
          </div>
          {activities.length === 0 ? (
            <div className="text-center text-muted py-4">
              Chưa có hoạt động nào. Hãy thêm hoặc cập nhật thuốc để bắt đầu theo dõi.
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {activities.map((activity) => {
                const config = activityConfig[activity.type];

                return (
                  <li className="list-group-item px-0" key={activity.id}>
                    <div className="d-flex align-items-center gap-3">
                      <span className={`text-${config.color} fs-5`}>{config.icon}</span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{config.text}: {activity.medicineName}</div>
                        <small className="text-muted">{formatActivityTime(activity.createdAt)}</small>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentActivities;
