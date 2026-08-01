import { useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { FaBell, FaSave, FaServer, FaShieldAlt } from "react-icons/fa";

function SettingsPage() {
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem("elderly-ai-backend-url") || "http://localhost:5000");
  const [enableAlerts, setEnableAlerts] = useState(() => localStorage.getItem("elderly-ai-enable-alerts") !== "false");
  const [alertPhone, setAlertPhone] = useState(() => localStorage.getItem("elderly-ai-alert-phone") || "0909876543");
  const [showAlert, setShowAlert] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("elderly-ai-backend-url", backendUrl);
    localStorage.setItem("elderly-ai-enable-alerts", enableAlerts);
    localStorage.setItem("elderly-ai-alert-phone", alertPhone);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="container-fluid mt-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Cài đặt hệ thống</h3>
          <p className="text-muted mb-0">Cấu hình kết nối mạng, thông báo khẩn cấp và bảo mật thiết bị.</p>
        </div>
      </div>

      {showAlert && (
        <Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
          Cập nhật cấu hình hệ thống thành công!
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Form onSubmit={handleSave}>
            <Card className="border-0 shadow-sm mb-4 p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaServer className="text-primary" /> Kết nối Backend Flask API
              </h5>
              <Form.Group className="mb-3" controlId="formBackendUrl">
                <Form.Label>Địa chỉ Backend Server URL</Form.Label>
                <Form.Control 
                  type="url" 
                  value={backendUrl} 
                  onChange={(e) => setBackendUrl(e.target.value)} 
                  placeholder="http://localhost:5000" 
                />
                <Form.Text className="text-muted">
                  Địa chỉ IP hoặc localhost nơi Flask Server đang lắng nghe các cuộc gọi API.
                </Form.Text>
              </Form.Group>
            </Card>

            <Card className="border-0 shadow-sm mb-4 p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaBell className="text-warning" /> Cấu hình Cảnh báo & Cuộc gọi Khẩn cấp
              </h5>
              <Form.Group className="mb-3" controlId="formEnableAlerts">
                <Form.Check 
                  type="switch"
                  id="custom-switch"
                  label="Bật cảnh báo ngã tự động"
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEmergencyPhone">
                <Form.Label>Số điện thoại nhận tin nhắn khẩn cấp (SMS/Zalo)</Form.Label>
                <Form.Control 
                  type="text" 
                  value={alertPhone} 
                  onChange={(e) => setAlertPhone(e.target.value)} 
                  disabled={!enableAlerts}
                />
                <Form.Text className="text-muted">
                  Hệ thống AI sẽ gửi tin nhắn trực tiếp đến số này khi phát hiện sự cố ngã.
                </Form.Text>
              </Form.Group>
            </Card>

            <Card className="border-0 shadow-sm mb-4 p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaShieldAlt className="text-success" /> Bảo mật và Tài khoản
              </h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formPass">
                    <Form.Label>Mật khẩu hiện tại</Form.Label>
                    <Form.Control type="password" placeholder="••••••••" disabled />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formNewPass">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control type="password" placeholder="••••••••" disabled />
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <div className="d-flex justify-content-end mb-4">
              <Button variant="primary" type="submit" size="lg" className="px-4 py-2">
                <FaSave className="me-2" /> Lưu cấu hình
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default SettingsPage;
