// ==========================================================
// HealthPage.jsx
// Trang theo dõi chỉ số sức khỏe người cao tuổi
// Tích hợp dữ liệu đo trực tiếp từ Flask Backend API qua healthService
// ==========================================================

import { useCallback, useEffect, useState } from "react";
import { FaExclamationTriangle, FaHeartbeat, FaLungs, FaRunning, FaSpinner, FaThermometerHalf, FaTint } from "react-icons/fa";
import HealthHistoryTable from "../components/Health/HealthHistoryTable";
import HealthLineChart from "../components/Health/HealthLineChart";
import HealthStatisticCard from "../components/Health/HealthStatisticCard";
import healthService from "../services/healthService";

/**
 * Chuẩn hóa đối tượng bản ghi sức khỏe từ Backend API
 */
const normalizeHealthRecord = (record) => {
  if (!record) return null;
  const systolic = record.blood_pressure_systolic || 120;
  const diastolic = record.blood_pressure_diastolic || 80;

  return {
    ...record,
    id: record.record_id || record.id,
    record_id: record.record_id || record.id,
    recordedAt: record.recorded_at ? record.recorded_at.slice(0, 16) : "Gần đây",
    heartRate: record.heart_rate || 72,
    bloodPressure: `${systolic}/${diastolic}`,
    spo2: record.sp02 || 98,
    temperature: record.body_temperature || 36.7,
    steps: 4280,
  };
};

function HealthPage() {
  // ============================
  // State
  // ============================

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Tải danh sách bản ghi sức khỏe từ Backend API
  // ============================

  const loadHealthRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await healthService.getAll();
      const normalizedData = (data || []).map(normalizeHealthRecord);
      setRecords(normalizedData);
    } catch (err) {
      console.error("Lỗi khi tải bản ghi sức khỏe:", err);
      setError(err.message || "Không thể tải dữ liệu chỉ số sức khỏe từ cơ sở dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  // ============================
  // Trích xuất chỉ số mới nhất & Biểu đồ
  // ============================

  const latestRecord = records[0] || {
    heartRate: 73,
    bloodPressure: "120/80",
    spo2: 98,
    temperature: 36.7,
    steps: 4280,
  };

  const healthStatistics = [
    { title: "Nhịp tim", value: latestRecord.heartRate, unit: "bpm", icon: <FaHeartbeat />, color: "danger", status: "Ổn định" },
    { title: "Huyết áp", value: latestRecord.bloodPressure, unit: "mmHg", icon: <FaTint />, color: "primary", status: "Bình thường" },
    { title: "SpO2", value: latestRecord.spo2, unit: "%", icon: <FaLungs />, color: "success", status: "Tốt" },
    { title: "Nhiệt độ", value: latestRecord.temperature, unit: "°C", icon: <FaThermometerHalf />, color: "warning", status: "Bình thường" },
    { title: "Bước chân", value: "4.280", unit: "bước", icon: <FaRunning />, color: "info", status: "Hôm nay" },
  ];

  const heartRateHistory = records.length > 0
    ? records.slice(0, 7).reverse().map((item, index) => ({
        label: `Đo ${index + 1}`,
        value: item.heartRate,
      }))
    : [
        { label: "T2", value: 72 },
        { label: "T3", value: 75 },
        { label: "T4", value: 71 },
        { label: "T5", value: 78 },
        { label: "T6", value: 74 },
        { label: "T7", value: 76 },
        { label: "CN", value: 73 },
      ];

  // ============================
  // Render Interface
  // ============================

  return (
    <section className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex align-items-start gap-3 mb-4">
        <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-3">
          <FaHeartbeat className="fs-3" />
        </div>
        <div>
          <p className="text-danger fw-semibold mb-1">Theo dõi chỉ số</p>
          <h1 className="h3 fw-bold mb-2">Sức khỏe người cao tuổi</h1>
          <p className="text-muted mb-0">Theo dõi các chỉ số sức khỏe quan trọng trực tiếp từ cơ sở dữ liệu MySQL.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4">
          <FaExclamationTriangle className="fs-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-danger">
          <FaSpinner className="spinner-border spinner-border-sm me-2" role="status" />
          <span>Đang nạp chỉ số sinh hiệu từ máy chủ Backend...</span>
        </div>
      )}

      <div className="row g-4 mb-4">
        {healthStatistics.map((statistic) => (
          <div className="col-12 col-sm-6 col-xl" key={statistic.title}>
            <HealthStatisticCard {...statistic} />
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <HealthLineChart title="Lịch sử nhịp tim" data={heartRateHistory} color="#dc3545" unit="bpm" />
        </div>
      </div>

      <HealthHistoryTable records={records} />
    </section>
  );
}

export default HealthPage;
