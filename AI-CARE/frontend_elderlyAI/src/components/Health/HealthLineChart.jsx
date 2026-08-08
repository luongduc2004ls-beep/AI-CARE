import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "../../context/ThemeContext";

// ============================
// Chart Registration
// ============================

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// Dữ liệu tạm thời cho giao diện trước khi có Backend.
const defaultHistoryData = [
  { label: "T2", value: 72 },
  { label: "T3", value: 75 },
  { label: "T4", value: 71 },
  { label: "T5", value: 78 },
  { label: "T6", value: 74 },
  { label: "T7", value: 76 },
  { label: "CN", value: 73 },
];

function HealthLineChart({ title = "Lịch sử nhịp tim", data = defaultHistoryData, color = "#dc3545", unit = "bpm" }) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === "dark";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: title,
        data: data.map((item) => item.value),
        borderColor: color,
        backgroundColor: `${color}1f`,
        pointBackgroundColor: color,
        pointBorderColor: isDark ? "#131b2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} ${unit}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { precision: 0, color: textColor },
        grid: { color: gridColor },
        title: { display: true, text: unit, color: textColor },
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor },
        title: { display: true, text: "7 ngày gần nhất", color: textColor },
      },
    },
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
          <span className="badge text-bg-light border text-secondary">7 ngày</span>
        </div>
        <div style={{ height: "300px" }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

export default HealthLineChart;

