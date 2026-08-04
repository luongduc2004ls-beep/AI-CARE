// ============================
// Imports
// ============================

import { FaCalendarAlt } from "react-icons/fa";
import { Table } from "react-bootstrap";

function HealthHistoryTable({ records = [] }) {
  // ============================
  // Render
  // ============================

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between gap-3 p-4 pb-3 flex-wrap">
          <div>
            <h2 className="h5 fw-bold mb-1">Lịch sử theo dõi sức khỏe</h2>
            <p className="text-muted small mb-0">Dữ liệu đo gần đây của người cao tuổi.</p>
          </div>
          <span className="badge text-bg-light border text-secondary">{records.length} lần đo</span>
        </div>

        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Thời gian</th>
              <th>Nhịp tim</th>
              <th>Huyết áp</th>
              <th>SpO2</th>
              <th>Nhiệt độ</th>
              <th className="pe-4">Bước chân</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">Chưa có dữ liệu sức khỏe.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="ps-4"><FaCalendarAlt className="text-muted me-2" />{record.recordedAt}</td>
                  <td><span className="badge text-bg-danger">{record.heartRate} bpm</span></td>
                  <td>{record.bloodPressure} mmHg</td>
                  <td><span className="badge text-bg-success">{record.spo2}%</span></td>
                  <td>{record.temperature} °C</td>
                  <td className="pe-4">{record.steps.toLocaleString("vi-VN")} bước</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default HealthHistoryTable;
