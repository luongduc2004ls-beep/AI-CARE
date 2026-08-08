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
import { getMedicationLineChartData } from "../../services/dashboardService";
import { useTheme } from "../../context/ThemeContext";

// ============================
// Chart Registration
// ============================

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function MedicationLineChart() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === "dark";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

  const historyData = getMedicationLineChartData();

  const data = {
    labels: historyData.map((day) => day.label),
    datasets: [
      {
        label: "Đã uống",
        data: historyData.map((day) => day.taken),
        borderColor: "#198754",
        backgroundColor: "rgba(25, 135, 84, 0.15)",
        pointBackgroundColor: "#198754",
        pointBorderColor: isDark ? "#131b2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.35,
      },
      {
        label: "Chưa uống",
        data: historyData.map((day) => day.missed),
        borderColor: "#dc3545",
        backgroundColor: "rgba(220, 53, 69, 0.12)",
        pointBackgroundColor: "#dc3545",
        pointBorderColor: isDark ? "#131b2e" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 18, usePointStyle: true, color: textColor }
      },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw} lần` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1, color: textColor },
        grid: { color: gridColor },
        title: { display: true, text: "Số lần uống", color: textColor }
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor },
        title: { display: true, text: "7 ngày gần nhất", color: textColor }
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Lịch uống thuốc 7 ngày</h5>
          <span className="badge text-bg-light border text-secondary">Dữ liệu mô phỏng</span>
        </div>
        <div className="flex-grow-1" style={{ minHeight: "280px" }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default MedicationLineChart;

