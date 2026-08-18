import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AnalyticsChart() {
  const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Hiện tại"];

  const data = {
    labels,
    datasets: [
      {
        label: "Bình thường (Normal)",
        data: [12, 12, 11, 12, 10, 12, 12],
        borderColor: "#22C55E",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Cần chú ý (Warning)",
        data: [0, 1, 0, 2, 1, 0, 1],
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Khẩn cấp (Critical)",
        data: [0, 0, 0, 0, 1, 0, 0],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#94A3B8",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "#243044",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(36, 48, 68, 0.5)" },
        ticks: { color: "#94A3B8" },
      },
      y: {
        grid: { color: "rgba(36, 48, 68, 0.5)" },
        ticks: { color: "#94A3B8" },
      },
    },
  };

  return (
    <div className="card h-100 p-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="section-title fs-6 mb-3">Hoạt động AI trong 24 giờ</h3>
      <div style={{ height: "240px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default AnalyticsChart;
