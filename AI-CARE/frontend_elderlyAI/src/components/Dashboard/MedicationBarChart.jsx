import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getMedicationBarChartData } from "../../services/dashboardService";
import { useTheme } from "../../context/ThemeContext";

// ============================
// Chart Registration
// ============================

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MedicationBarChart() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === "dark";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const titleColor = isDark ? "#f8fafc" : "#1e293b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

  const chartData = getMedicationBarChartData();

  const data = {
    labels: chartData.map((item) => item.label),
    datasets: [
      {
        label: "Số lượng thuốc",
        data: chartData.map((item) => item.value),
        backgroundColor: ["#0d6efd", "#20c997", "#fd7e14", "#6f42c1"],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Số lượng thuốc theo khung giờ", color: titleColor, font: { size: 16, weight: "600" } },
      tooltip: { callbacks: { label: (context) => `${context.raw} thuốc` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1, color: textColor },
        grid: { color: gridColor },
        title: { display: true, text: "Số lượng", color: textColor }
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor },
        title: { display: true, text: "Khung giờ uống", color: textColor }
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body" style={{ height: "320px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default MedicationBarChart;

