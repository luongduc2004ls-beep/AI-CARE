import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { FaLock, FaUser } from "react-icons/fa";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess();
      }
    } else {
      setError("Tài khoản hoặc mật khẩu không chính xác!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Card className="border-0 shadow-lg p-4" style={{ width: "400px", borderRadius: "15px" }}>
        <Card.Body>
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">AI CARE</h2>
            <p className="text-muted">Đăng nhập vào hệ thống giám sát sức khỏe</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label className="small fw-semibold">Tên đăng nhập</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaUser className="text-muted" />
                </span>
                <Form.Control 
                  type="text" 
                  className="border-start-0"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label className="small fw-semibold">Mật khẩu</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaLock className="text-muted" />
                </span>
                <Form.Control 
                  type="password" 
                  className="border-start-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-2 fs-5 fw-semibold" style={{ borderRadius: "10px" }}>
              Đăng nhập
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default LoginPage;
