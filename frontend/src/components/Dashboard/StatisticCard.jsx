function StatisticCard({ title, value, color, icon, subtitle }) {
  return (
    <div className="card stat-card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <h6 className="text-muted mb-2 fw-semibold">{title}</h6>
            <h2 className={`fw-bold text-${color} mb-0`}>{value}</h2>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>

          {/* Icon màu theo trạng thái giúp nhận biết nhanh từng chỉ số. */}
          <div className={`stat-icon-wrapper bg-${color} bg-opacity-10 text-${color} d-flex justify-content-center align-items-center`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticCard;
