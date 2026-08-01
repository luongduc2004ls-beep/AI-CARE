// ==========================================================
// ElderlyTable.jsx
// Bảng hiển thị danh sách người cao tuổi / bệnh nhân
// Tích hợp dữ liệu từ Backend API Flask (patient_id, full_name, medical_history...)
// ==========================================================

import { Button, Table } from "react-bootstrap";
import { FaEdit, FaEye, FaPhoneAlt, FaTrash } from "react-icons/fa";

function ElderlyTable({ elderlyPeople = [], onView, onEdit, onDelete }) {
  // ============================
  // Render Interface
  // ============================

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between gap-3 p-4 pb-3 flex-wrap">
          <div>
            <h2 className="h5 fw-bold mb-1">Danh sách người cao tuổi</h2>
            <p className="text-muted small mb-0">Tổng số hồ sơ: {elderlyPeople.length}</p>
          </div>
        </div>

        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Họ và tên</th>
              <th>Tuổi / Ngày sinh</th>
              <th>Giới tính</th>
              <th>Số điện thoại</th>
              <th>Bệnh nền</th>
              <th className="text-end pe-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {elderlyPeople.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  Chưa có hồ sơ người cao tuổi nào trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : (
              elderlyPeople.map((person) => {
                const personId = person.patient_id || person.id;
                const fullName = person.full_name || person.fullName || "Chưa có tên";
                const ageOrDob = person.age ? `${person.age} tuổi` : person.dateOfBirth || "N/A";
                const gender = person.gender || "Chưa rõ";
                const phone = person.phone || "N/A";
                const medicalHistory = person.medical_history || person.medicalConditions || "Không có";
                const image = person.image || "";

                return (
                  <tr key={personId}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={fullName}
                            width="42"
                            height="42"
                            className="rounded-circle object-fit-cover"
                          />
                        ) : (
                          <div
                            className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center fw-bold"
                            style={{ width: "42px", height: "42px" }}
                          >
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="fw-semibold">{fullName}</span>
                      </div>
                    </td>
                    <td>{ageOrDob}</td>
                    <td>{gender}</td>
                    <td>
                      <FaPhoneAlt className="text-muted me-2" />
                      {phone}
                    </td>
                    <td>{medicalHistory}</td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onView?.(person)}
                          aria-label={`Xem ${fullName}`}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => onEdit?.(person)}
                          aria-label={`Sửa ${fullName}`}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDelete?.(personId)}
                          aria-label={`Xóa ${fullName}`}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default ElderlyTable;
