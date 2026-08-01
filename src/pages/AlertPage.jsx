import { useState } from "react";
import { Badge, Button, Card, Table } from "react-bootstrap";
import { FaBell, FaCheck, FaExclamationTriangle, FaTrash } from "react-icons/fa";
import { deleteAlert as deleteAlertService, getAlerts, markAlertResolved } from "../services/alertService";

function AlertPage() {
  const [alerts, setAlerts] = useState(() => getAlerts());

  const handleResolve = (id) => {
    const updated = markAlertResolved(id);
    setAlerts(updated);
  };

  const handleDelete = (id) => {
    const updated = deleteAlertService(id);
    setAlerts(updated);
  };

  return (
    <div className="container-fluid mt-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Cảnh báo hệ thống</h3>
          <p className="text-muted mb-0">Xem và quản lý các cảnh báo khẩn cấp từ thiết bị AI.</p>
        </div>
        <Badge bg="danger" className="p-2 fs-6">
          {alerts.filter(a => a.status === "Chưa xử lý").length} Cảnh báo mới
        </Badge>
      </div>

      <div className="row">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Table responsive hover align="middle" className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Loại</th>
                    <th>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">Không có cảnh báo nào.</td>
                    </tr>
                  ) : (
                    alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>
                          {alert.type === "critical" ? (
                            <span className="text-danger fs-5"><FaExclamationTriangle /></span>
                          ) : (
                            <span className="text-warning fs-5"><FaBell /></span>
                          )}
                        </td>
                        <td className="fw-bold">{alert.title}</td>
                        <td>{alert.content}</td>
                        <td>{alert.time}</td>
                        <td>
                          <Badge bg={alert.status === "Chưa xử lý" ? "danger" : "success"} className="px-3 py-2">
                            {alert.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {alert.status === "Chưa xử lý" && (
                              <Button variant="outline-success" size="sm" onClick={() => handleResolve(alert.id)}>
                                <FaCheck className="me-1" /> Xử lý
                              </Button>
                            )}
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(alert.id)}>
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AlertPage;
