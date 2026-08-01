import { Card, Row, Col, Table, Badge } from "react-bootstrap";
import { FaHeartbeat, FaThermometerHalf, FaLungs, FaRunning } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Đăng ký các thành phần biểu đồ Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ReminderPage() {
  // Dữ liệu giả lập đo sức khỏe theo thời gian
  const chartData = {
    labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    datasets: [
      {
        label: "Nhịp tim (BPM)",
        data: [72, 75, 80, 85, 78, 74, 76],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Huyết áp tâm thu (mmHg)",
        data: [120, 122, 125, 128, 124, 121, 120],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: true,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      }
    }
  };

  const healthMetrics = [
    { id: 1, name: "Nhịp tim", value: "76 BPM", status: "Bình thường", color: "danger", icon: <FaHeartbeat /> },
    { id: 2, name: "Huyết áp", value: "120/80 mmHg", status: "Bình thường", color: "primary", icon: <FaLungs /> },
    { id: 3, name: "Nhiệt độ", value: "36.6 °C", status: "Bình thường", color: "warning", icon: <FaThermometerHalf /> },
    { id: 4, name: "Vận động", value: "3,500 bước", status: "Tốt", color: "success", icon: <FaRunning /> },
  ];

  return (
    <div className="container-fluid mt-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Theo dõi sức khỏe liên tục</h3>
          <p className="text-muted mb-0">Các chỉ số sinh hiệu thời gian thực từ vòng đeo tay thông minh AI.</p>
        </div>
      </div>

      <Row>
        {healthMetrics.map((metric) => (
          <Col lg={3} md={6} className="mb-4" key={metric.id}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div>
                  <small className="text-muted d-block uppercase mb-1">{metric.name}</small>
                  <h3 className="fw-bold mb-1 text-dark">{metric.value}</h3>
                  <Badge bg={metric.color === "danger" ? "danger" : metric.color === "warning" ? "warning" : "success"}>
                    {metric.status}
                  </Badge>
                </div>
                <div className={`fs-1 text-${metric.color} bg-light p-3 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "65px", height: "65px" }}>
                  {metric.icon}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm p-4">
            <h5 className="fw-bold mb-4">Biểu đồ sinh hiệu trong ngày</h5>
            <div style={{ height: "300px", position: "relative" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-3">Lịch sử đo gần nhất</h5>
            <Table responsive hover borderless className="align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Thời gian</th>
                  <th>Nhịp tim</th>
                  <th>Huyết áp</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>20:00</td>
                  <td>76 BPM</td>
                  <td>120/80</td>
                </tr>
                <tr>
                  <td>18:00</td>
                  <td>74 BPM</td>
                  <td>121/81</td>
                </tr>
                <tr>
                  <td>16:00</td>
                  <td>78 BPM</td>
                  <td>124/82</td>
                </tr>
                <tr>
                  <td>14:00</td>
                  <td>85 BPM</td>
                  <td>128/85</td>
                </tr>
                <tr>
                  <td>12:00</td>
                  <td>80 BPM</td>
                  <td>125/83</td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ReminderPage;
