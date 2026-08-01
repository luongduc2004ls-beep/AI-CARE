import { getData, saveData } from "./localStorageService";

const ALERTS_STORAGE_KEY = "ai-care-alerts";

const defaultAlerts = [
  { id: 1, title: "Cảnh báo ngã (Fall Alert)", content: "Phát hiện ngã tại Phòng Khách", type: "critical", time: "14:10", status: "Chưa xử lý" },
  { id: 2, title: "Quên uống thuốc", content: "Paracetamol 500mg chưa được uống lúc 08:00", type: "warning", time: "09:30", status: "Đã xử lý" },
  { id: 3, title: "Nhịp tim cao", content: "Nhịp tim đo được 105 BPM (Lúc nghỉ ngơi)", type: "warning", time: "07:15", status: "Chưa xử lý" },
  { id: 4, title: "Cảnh báo ngã (Fall Alert)", content: "Phát hiện ngã tại Phòng Ngủ", type: "critical", time: "Hôm qua", status: "Đã xử lý" },
];

const getAlerts = () => {
  const stored = getData(ALERTS_STORAGE_KEY);
  return Array.isArray(stored) ? stored : defaultAlerts;
};

const saveAlerts = (alerts) => {
  saveData(ALERTS_STORAGE_KEY, alerts);
  return alerts;
};

const markAlertResolved = (id) => {
  const current = getAlerts();
  const updated = current.map(alert => alert.id === id ? { ...alert, status: "Đã xử lý" } : alert);
  return saveAlerts(updated);
};

const deleteAlert = (id) => {
  const current = getAlerts();
  const updated = current.filter(alert => alert.id !== id);
  return saveAlerts(updated);
};

export { deleteAlert, getAlerts, markAlertResolved, saveAlerts };
