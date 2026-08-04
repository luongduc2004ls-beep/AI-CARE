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
              <th className="ps-4">Mã BN / Device ID</th>
              <th>Họ tên &amp; Thể trạng bệnh nhân</th>
              <th>Chỉ số y tế &amp; Dị ứng</th>
              <th>Thông tin người thân khẩn cấp</th>
              <th className="text-end pe-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {elderlyPeople.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted py-5">
                  Chưa có hồ sơ người cao tuổi nào trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : (
              elderlyPeople.map((person) => {
                const personId = person.patient_id || person.id || 1;
                const rawCode = person.patient_code || person.patient_id || person.id || 1;
                const formattedPatientId = String(rawCode).toUpperCase().startsWith("PAT")
                  ? String(rawCode).toUpperCase()
                  : `PAT${String(rawCode).padStart(5, "0")}`;

                const deviceId = person.device_id || `D${personId.toString().padStart(4, "0")}`;
                const fullName = person.name || person.full_name || person.fullName || "Chưa có tên";
                const age = person.age ? `${person.age} tuổi` : "N/A";
                const gender = person.gender || "Chưa rõ";
                const phone = person.phone || "N/A";
                const height = person.height_cm || person.height ? `${person.height_cm || person.height} cm` : "--";
                const weight = person.weight_kg || person.weight ? `${person.weight_kg || person.weight} kg` : "--";
                const bloodGroup = person.blood_group || person.bloodType || "O+";
                const image = person.image || "";
                const allergy = person.allergy || "Không có";
                const hasAllergy = allergy &&
                  allergy.trim() !== "" &&
                  allergy.toLowerCase() !== "không" &&
                  allergy.toLowerCase() !== "không có" &&
                  allergy.toLowerCase() !== "none";

                // Thông tin người thân bệnh nhân
                const relName = person.relativeName || person.caregiver_name || "Nguyễn Văn B";
                const relRelation = person.relativeRelation || person.caregiver_relation || "Con trai";
                const relAge = person.relativeAge || person.caregiver_age || 42;
                const relPhone = person.relativePhone || person.caregiver_phone || "0987654321";
                const relEmail = person.relativeEmail || person.caregiver_email || "nguyenvanb@gmail.com";

                return (
                  <tr key={personId}>
                    {/* Mã BN / Device ID */}
                    <td className="ps-4">
                      <div className="fw-bold text-primary font-monospace">{formattedPatientId}</div>
                      <span className="badge bg-secondary text-white font-monospace extra-small mt-1 px-2 py-1 shadow-sm">
                        📟 {deviceId}
                      </span>
                    </td>

                    {/* Họ tên & Thể trạng bệnh nhân */}
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={fullName}
                            width="44"
                            height="44"
                            className="rounded-circle object-fit-cover border shadow-sm"
                          />
                        ) : (
                          <div
                            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm"
                            style={{ width: "44px", height: "44px" }}
                          >
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="fw-bold text-body fs-6">{fullName}</div>
                          <div className="small text-body-secondary mt-1">
                            📞 <strong>{phone}</strong> | 📏 {height} - ⚖️ {weight}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chỉ số y tế & Dị ứng */}
                    <td>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary text-white px-2.5 py-1.5 fw-bold shadow-sm">
                          {age} • {gender}
                        </span>
                        <span className="badge bg-danger text-white px-2.5 py-1.5 fw-bold shadow-sm">
                          🩸 {bloodGroup}
                        </span>
                      </div>
                      {hasAllergy ? (
                        <span className="badge bg-warning text-dark border border-warning px-2 py-1 extra-small text-wrap d-inline-block fw-bold shadow-sm">
                          ⚠️ Dị ứng: {allergy}
                        </span>
                      ) : (
                        <span className="badge bg-success text-white px-2 py-1 extra-small fw-bold shadow-sm">
                          ✓ Không có dị ứng
                        </span>
                      )}
                    </td>

                    {/* THÔNG TIN NGƯỜI THÂN BỆNH NHÂN (Tên, Quan hệ, Tuổi, SĐT, Email) */}
                    <td>
                      <div className="p-2.5 rounded-3 bg-body-tertiary border text-body shadow-sm">
                        <div className="fw-bold text-body small d-flex align-items-center justify-content-between">
                          <span>👨‍👩‍👧 {relName}</span>
                          <span className="badge bg-info text-dark extra-small rounded-pill fw-bold ms-2">{relRelation}</span>
                        </div>
                        <div className="extra-small text-body-secondary mt-1">
                          🎂 Tuổi: <strong className="text-body">{relAge} tuổi</strong> | 📞 <strong className="text-body">{relPhone}</strong>
                        </div>
                        <div className="extra-small text-body-secondary text-truncate" style={{ maxWidth: "200px" }}>
                          ✉️ {relEmail}
                        </div>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onView?.(person)}
                          aria-label={`Xem ${fullName}`}
                          title="Xem chi tiết hồ sơ y tế & người thân"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => onEdit?.(person)}
                          aria-label={`Sửa ${fullName}`}
                          title="Sửa hồ sơ y tế & người thân"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDelete?.(personId)}
                          aria-label={`Xóa ${fullName}`}
                          title="Xóa hồ sơ"
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

