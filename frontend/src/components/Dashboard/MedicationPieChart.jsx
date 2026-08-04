import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { getMedicationPieChartData } from "../../services/dashboardService";

// ============================
// Chart Registration
// ============================

ChartJS.register(ArcElement, Tooltip, Legend);

function MedicationPieChart() {
  // ============================
  // Chart Data
  // ============================

  const chartData = getMedicationPieChartData();
  const totalMedicines = chartData.reduce((total, item) => total + item.value, 0);

  const data = {
    labels: chartData.map((item) => item.label),
    datasets: [
      {
        data: chartData.map((item) => item.value),
        backgroundColor: ["#198754", "#ffc107"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { padding: 18, usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage = totalMedicines === 0 ? 0 : Math.round((context.raw / totalMedicines) * 100);
            return `${context.label}: ${context.raw} thuốc (${percentage}%)`;
          },
        },
      },
    },
  };

  // ============================
  // Render
  // ============================

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Tình trạng uống thuốc</h5>
          <span className="badge text-bg-light border text-secondary">{totalMedicines} thuốc</span>
        </div>
        <div className="flex-grow-1" style={{ minHeight: "280px" }}>
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default MedicationPieChart;
