import { Button, Table, Pagination, Form } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight, FaEdit, FaEye, FaPhoneAlt, FaTrash } from "react-icons/fa";

function ElderlyTable({
  elderlyPeople = [],
  totalRecords = 0,
  page = 1,
  perPage = 20,
  totalPages = 1,
  onPageChange,
  onPerPageChange,
  onView,
  onEdit,
  onDelete,
}) {
  const displayTotal = totalRecords > 0 ? totalRecords.toLocaleString("vi-VN") : elderlyPeople.length;
  const startItem = totalRecords > 0 ? (page - 1) * perPage + 1 : 1;
  const endItem = totalRecords > 0 ? Math.min(page * perPage, totalRecords) : elderlyPeople.length;

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between gap-3 p-4 pb-3 flex-wrap">
          <div>
            <h2 className="h5 fw-bold mb-1">Danh sách người cao tuổi</h2>
            <p className="text-muted small mb-0">
              Tổng số hồ sơ: <strong className="text-primary">{displayTotal}</strong> bệnh nhân
              {totalRecords > 0 && ` (Hiển thị ${startItem} - ${endItem})`}
            </p>
          </div>

          {onPerPageChange && (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Hiển thị:</span>
              <Form.Select
                size="sm"
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                style={{ width: "90px" }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
            </div>
          )}
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
                const allergy = person.allergy || "";
                const hasAllergy = allergy &&
                  allergy.trim() !== "" &&
                  allergy.toLowerCase() !== "không" &&
                  allergy.toLowerCase() !== "không có" &&
                  allergy.toLowerCase() !== "none";

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
                        <div>
                          <div className="fw-semibold">{fullName}</div>
                          {hasAllergy && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 mt-1 small">
                              ⚠️ Dị ứng: {allergy}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{ageOrDob}</td>
                    <td>{gender}</td>
                    <td>
                      <FaPhoneAlt className="text-muted me-2" />
                      {phone}
                    </td>
                    <td>
                      <div>{medicalHistory}</div>
                    </td>

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

        {totalPages > 1 && onPageChange && (
          <div className="d-flex align-items-center justify-content-between p-3 border-top flex-wrap gap-2">
            <span className="small text-muted">
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng {displayTotal} kết quả)
            </span>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <FaChevronLeft className="me-1" /> Trước
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Trang sau <FaChevronRight className="ms-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ElderlyTable;

