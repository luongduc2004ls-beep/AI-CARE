// ============================
// Imports
// ============================

function HealthStatisticCard({ title, value, unit, icon, color = "primary", status }) {
  // ============================
  // Render
  // ============================

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <p className="text-muted fw-semibold mb-2">{title}</p>
            <div className="d-flex align-items-baseline gap-1">
              <h2 className={`fw-bold text-${color} mb-0`}>{value}</h2>
              {unit && <span className="text-muted small">{unit}</span>}
            </div>
            {status && <small className={`text-${color} fw-semibold d-block mt-2`}>{status}</small>}
          </div>

          <div className={`bg-${color} bg-opacity-10 text-${color} rounded-3 d-inline-flex align-items-center justify-content-center fs-4`} style={{ width: "52px", height: "52px" }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthStatisticCard;
