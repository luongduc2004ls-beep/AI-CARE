import { useState, useEffect } from "react";
import { Badge, Button, Card, Col, Form, Modal, Row, Table, Spinner, Pagination, Alert } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaCheck,
  FaEdit,
  FaExclamationTriangle,
  FaHeartbeat,
  FaMapMarkerAlt,
  FaPhone,
  FaPlus,
  FaSearch,
  FaUser,
  FaUserNurse,
  FaUserMd,
  FaLungs,
  FaThermometerHalf
} from "react-icons/fa";
import { createPatient, getPatients, getPatientStatistics, updatePatient } from "../services/patientService";

function PatientPage() {
  const [loading, setLoading] = useState(true);
  const [patientsData, setPatientsData] = useState({ items: [], total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ totalPatients: 10000, highRiskPatients: 1509, fallRiskAIPredictions: 2518, totalFalls: 5092 });
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  // Edit / Detail Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fullName: "",
    age: 70,
    gender: "Nam",
    phone: "",
    emergencyContact: "",
    doctor_name: "BS. Huỳnh Thanh Trang",
    caregiver_name: "",
    caregiver_phone: "",
    blood_group: "O+",
    allergy: "Không"
  });

  const fetchPatientsList = async () => {
    setLoading(true);
    try {
      const data = await getPatients(page, perPage, search);
      if (data) {
        setPatientsData(data);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const data = await getPatientStatistics();
    if (data) setStats(data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPatientsList();
  }, [page, perPage, search]);

  const handleOpenDetail = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      fullName: patient.fullName || patient.full_name || "",
      age: patient.age || 70,
      gender: patient.gender || "Nam",
      phone: patient.phone || "",
      emergencyContact: patient.emergencyContact || patient.emergency_contact || "",
      doctor_name: patient.doctor_name || "",
      caregiver_name: patient.caregiver_name || "",
      address: patient.address || "",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient) return;
    const updated = await updatePatient(selectedPatient.id, formData);
    if (updated) {
      setAlertMsg("Cập nhật hồ sơ bệnh nhân thành công!");
      fetchPatientsList();
      setShowModal(false);
      setTimeout(() => setAlertMsg(""), 4000);
    }
  };

  const handleOpenAddModal = () => {
    setAddFormData({
      fullName: "",
      age: 70,
      gender: "Nam",
      phone: "",
      emergencyContact: "",
      doctor_name: "BS. Huỳnh Thanh Trang",
      caregiver_name: "",
      caregiver_phone: "",
      blood_group: "O+",
      allergy: "Không"
    });
    setShowAddModal(true);
  };

  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!addFormData.fullName.trim()) {
      alert("Vui lòng nhập Họ và tên bệnh nhân!");
      return;
    }

    const created = await createPatient({
      full_name: addFormData.fullName.trim(),
      fullName: addFormData.fullName.trim(),
      age: Number(addFormData.age),
      gender: addFormData.gender,
      phone: addFormData.phone.trim(),
      emergency_contact: addFormData.emergencyContact.trim(),
      emergencyContact: addFormData.emergencyContact.trim(),
      doctor_name: addFormData.doctor_name.trim(),
      caregiver_name: addFormData.caregiver_name.trim(),
      caregiver_phone: addFormData.caregiver_phone.trim(),
      blood_group: addFormData.blood_group,
      allergy: addFormData.allergy.trim()
    });

    if (created) {
      setAlertMsg(`Đã thêm mới thành công bệnh nhân: ${addFormData.fullName}!`);
      setShowAddModal(false);
      setPage(1);
      fetchStats();
      fetchPatientsList();
      setTimeout(() => setAlertMsg(""), 4000);
    }
  };

  const getRiskBadge = (patient) => {
    const risk = patient.health_record?.risk_level || "Bình thường";
    if (risk === "Cao") return <Badge bg="danger" className="px-3 py-2">Nguy cơ Cao</Badge>;
    if (risk === "Trung bình") return <Badge bg="warning" text="dark" className="px-3 py-2">Trung bình</Badge>;
    return <Badge bg="success" className="px-3 py-2">An toàn</Badge>;
  };

  return (
    <div className="container-fluid mt-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1">Thống kê & Hồ sơ Bệnh nhân</h3>
          <p className="text-muted mb-0">Quản lý toàn bộ <b>{stats.totalPatients.toLocaleString()}</b> hồ sơ người cao tuổi trong cơ sở dữ liệu.</p>
        </div>
        <Button variant="primary" size="lg" className="px-4 py-2 shadow-sm" onClick={handleOpenAddModal}>
          <FaPlus className="me-2" /> Thêm bệnh nhân mới
        </Button>
      </div>

      {alertMsg && (
        <Alert variant="success" onClose={() => setAlertMsg("")} dismissible className="mb-4">
          {alertMsg}
        </Alert>
      )}

      {/* Stats Cards Row */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <small className="text-muted d-block text-uppercase fw-semibold">Tổng số bệnh nhân</small>
                <h3 className="fw-bold mb-0 text-primary">{stats.totalPatients.toLocaleString()}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <FaUser />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <small className="text-muted d-block text-uppercase fw-semibold">Bệnh nhân nguy cơ cao</small>
                <h3 className="fw-bold mb-0 text-danger">{stats.highRiskPatients.toLocaleString()}</h3>
              </div>
              <div className="bg-danger-subtle text-danger p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <FaExclamationTriangle />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <small className="text-muted d-block text-uppercase fw-semibold">Cảnh báo té ngã (AI)</small>
                <h3 className="fw-bold mb-0 text-warning">{stats.fallRiskAIPredictions.toLocaleString()}</h3>
              </div>
              <div className="bg-warning-subtle text-warning p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <FaHeartbeat />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between p-3">
              <div>
                <small className="text-muted d-block text-uppercase fw-semibold">Tổng lịch sử té ngã</small>
                <h3 className="fw-bold mb-0 text-info">{stats.totalFalls.toLocaleString()}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle fs-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <FaUserNurse />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="input-group" style={{ maxWidth: "380px" }}>
              <span className="input-group-text bg-light border-end-0"><FaSearch className="text-muted" /></span>
              <Form.Control
                type="text"
                className="border-start-0 bg-light"
                placeholder="Tìm mã bệnh nhân, họ tên, sđt, bác sĩ..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Hiển thị:</span>
              <Form.Select size="sm" style={{ width: "80px" }} value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải dữ liệu bệnh nhân từ Database...</p>
            </div>
          ) : (
            <>
              <Table responsive hover align="middle" className="mb-0">
                <thead className="table-primary">
                  <tr>
                    <th>Mã BN</th>
                    <th>Họ và Tên</th>
                    <th>Tuổi / Giới</th>
                    <th>Số điện thoại</th>
                    <th>Bác sĩ phụ trách</th>
                    <th>Người chăm sóc</th>
                    <th>Chỉ số sinh hiệu</th>
                    <th>Đánh giá AI</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsData.items.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">Không tìm thấy bệnh nhân nào.</td>
                    </tr>
                  ) : (
                    patientsData.items.map((patient) => (
                      <tr key={patient.id}>
                        <td><Badge text-bg-light className="border font-monospace fs-6">{patient.patient_code}</Badge></td>
                        <td className="fw-bold text-dark">{patient.fullName || patient.full_name}</td>
                        <td>{patient.age ? `${patient.age} tuổi` : "N/A"} ({patient.gender})</td>
                        <td>{patient.phone || "Chưa có"}</td>
                        <td><small><FaUserMd className="me-1 text-primary" />{patient.doctor_name || "BS. Phụ trách"}</small></td>
                        <td><small><FaUserNurse className="me-1 text-success" />{patient.caregiver_name || "Người thân"}</small></td>
                        <td>
                          {patient.health_record ? (
                            <small className="d-block text-muted">
                              HA: <b>{patient.health_record.blood_pressure || "N/A"}</b> | Tim: <b>{patient.health_record.heart_rate || "N/A"} BPM</b>
                            </small>
                          ) : (
                            <small className="text-muted">Chưa ghi nhận</small>
                          )}
                        </td>
                        <td>{getRiskBadge(patient)}</td>
                        <td>
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenDetail(patient)}>
                            <FaEdit className="me-1" /> Chi tiết / Sửa
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {/* Pagination Controls */}
              <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                <small className="text-muted">
                  Hiển thị <b>{(patientsData.page - 1) * perPage + 1}</b> - <b>{Math.min(patientsData.page * perPage, patientsData.total)}</b> trong tổng số <b>{patientsData.total.toLocaleString()}</b> bệnh nhân
                </small>

                <Pagination className="mb-0">
                  <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                  <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />
                  <Pagination.Item active>{page}</Pagination.Item>
                  <Pagination.Next disabled={page >= patientsData.total_pages} onClick={() => setPage(p => Math.min(patientsData.total_pages, p + 1))} />
                  <Pagination.Last disabled={page >= patientsData.total_pages} onClick={() => setPage(patientsData.total_pages)} />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal Thêm Bệnh Nhân Mới */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
        <Form onSubmit={handleSaveCreate}>
          <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
            <Modal.Title className="fw-bold h5 text-primary">
              <FaPlus className="me-2" /> Thêm hồ sơ Bệnh nhân mới
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Họ và Tên <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Bình"
                  required
                  value={addFormData.fullName}
                  onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                />
              </Form.Group>
              <Form.Group as={Col} md={3}>
                <Form.Label className="fw-semibold">Tuổi</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="70"
                  value={addFormData.age}
                  onChange={(e) => setAddFormData({ ...addFormData, age: Number(e.target.value) })}
                />
              </Form.Group>
              <Form.Group as={Col} md={3}>
                <Form.Label className="fw-semibold">Giới tính</Form.Label>
                <Form.Select
                  value={addFormData.gender}
                  onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value })}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </Form.Select>
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="090XXXXXXX"
                  value={addFormData.phone}
                  onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                />
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Số điện thoại khẩn cấp</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="SĐT người thân nhận cảnh báo"
                  value={addFormData.emergencyContact}
                  onChange={(e) => setAddFormData({ ...addFormData, emergencyContact: e.target.value })}
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Bác sĩ phụ trách</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="BS. Huỳnh Thanh Trang"
                  value={addFormData.doctor_name}
                  onChange={(e) => setAddFormData({ ...addFormData, doctor_name: e.target.value })}
                />
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Tên người chăm sóc</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Phan Thị An (Con gái)"
                  value={addFormData.caregiver_name}
                  onChange={(e) => setAddFormData({ ...addFormData, caregiver_name: e.target.value })}
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Nhóm máu</Form.Label>
                <Form.Select
                  value={addFormData.blood_group}
                  onChange={(e) => setAddFormData({ ...addFormData, blood_group: e.target.value })}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label className="fw-semibold">Tiền sử dị ứng</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Phấn hoa, Penicillin..."
                  value={addFormData.allergy}
                  onChange={(e) => setAddFormData({ ...addFormData, allergy: e.target.value })}
                />
              </Form.Group>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowAddModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit"><FaCheck className="me-1" /> Lưu bệnh nhân</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Patient Detail & Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {isEditing ? "Chỉnh sửa hồ sơ bệnh nhân" : "Chi tiết hồ sơ bệnh nhân"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedPatient && (
            <>
              {!isEditing ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-2" style={{ width: "60px", height: "60px" }}>
                      <FaUser />
                    </div>
                    <div>
                      <h4 className="fw-bold mb-1">{selectedPatient.fullName || selectedPatient.full_name}</h4>
                      <p className="text-muted mb-0">{selectedPatient.gender}, {selectedPatient.age} tuổi | Mã: {selectedPatient.patient_code}</p>
                    </div>
                  </div>

                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-2"><FaPhone className="me-2 text-primary" /><b>Số điện thoại:</b> {selectedPatient.phone}</p>
                      <p className="mb-2"><FaUserMd className="me-2 text-info" /><b>Bác sĩ phụ trách:</b> {selectedPatient.doctor_name || "Chưa phân công"}</p>
                      <p className="mb-2"><FaUserNurse className="me-2 text-success" /><b>Người chăm sóc:</b> {selectedPatient.caregiver_name || "Chưa có"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2"><FaExclamationTriangle className="me-2 text-danger" /><b>Liên hệ khẩn cấp:</b> {selectedPatient.emergencyContact || selectedPatient.caregiver_phone}</p>
                      <p className="mb-2"><FaMapMarkerAlt className="me-2 text-warning" /><b>Thiết bị AI:</b> {selectedPatient.device_id || "Đồng hồ thông minh"}</p>
                    </Col>
                  </Row>

                  {selectedPatient.health_record && (
                    <Card className="border-primary-subtle bg-light mb-3">
                      <Card.Body>
                        <h6 className="fw-bold text-primary mb-3">Chỉ số sức khỏe AI thời gian thực</h6>
                        <Row>
                          <Col md={3} className="text-center border-end">
                            <small className="text-muted d-block"><FaLungs className="me-1" />Huyết áp</small>
                            <span className="fw-bold fs-5 text-dark">{selectedPatient.health_record.blood_pressure || "N/A"}</span>
                          </Col>
                          <Col md={3} className="text-center border-end">
                            <small className="text-muted d-block"><FaHeartbeat className="me-1" />Nhịp tim</small>
                            <span className="fw-bold fs-5 text-danger">{selectedPatient.health_record.heart_rate ? `${selectedPatient.health_record.heart_rate} BPM` : "N/A"}</span>
                          </Col>
                          <Col md={3} className="text-center border-end">
                            <small className="text-muted d-block"><FaThermometerHalf className="me-1" />Nhiệt độ</small>
                            <span className="fw-bold fs-5 text-warning">{selectedPatient.health_record.body_temperature ? `${selectedPatient.health_record.body_temperature} °C` : "N/A"}</span>
                          </Col>
                          <Col md={3} className="text-center">
                            <small className="text-muted d-block">Dự đoán AI</small>
                            <span className="fw-bold text-danger">{selectedPatient.health_record.ai_prediction || "An toàn"}</span>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              ) : (
                <Form>
                  <Row className="mb-3">
                    <Form.Group as={Col} md={6}>
                      <Form.Label>Họ và Tên</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group as={Col} md={3}>
                      <Form.Label>Tuổi</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      />
                    </Form.Group>
                    <Form.Group as={Col} md={3}>
                      <Form.Label>Giới tính</Form.Label>
                      <Form.Select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group as={Col} md={6}>
                      <Form.Label>Số điện thoại</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group as={Col} md={6}>
                      <Form.Label>Liên hệ khẩn cấp</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      />
                    </Form.Group>
                  </Row>

                  <Row className="mb-3">
                    <Form.Group as={Col} md={6}>
                      <Form.Label>Bác sĩ phụ trách</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.doctor_name}
                        onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group as={Col} md={6}>
                      <Form.Label>Người chăm sóc</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.caregiver_name}
                        onChange={(e) => setFormData({ ...formData, caregiver_name: e.target.value })}
                      />
                    </Form.Group>
                  </Row>
                </Form>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          {!isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
              <Button variant="primary" onClick={() => setIsEditing(true)}><FaEdit className="me-1" /> Chỉnh sửa</Button>
            </>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={() => setIsEditing(false)}>Hủy</Button>
              <Button variant="success" onClick={handleSaveEdit}><FaCheck className="me-1" /> Lưu thay đổi</Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PatientPage;
