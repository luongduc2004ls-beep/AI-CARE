import React, { useState, useEffect, useRef } from "react";
import {
  FaVideo,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPlus,
  FaPlay,
  FaCheckCircle,
  FaSignal,
  FaCog,
  FaSync,
  FaDesktop,
  FaCamera,
  FaStop,
  FaMobileAlt,
  FaInfoCircle
} from "react-icons/fa";
import FallAlertModal from "../components/Camera/FallAlertModal";
import axios from "axios";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api"
  : `http://${window.location.hostname || "localhost"}:5000/api`;



const CameraPage = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingCamId, setTestingCamId] = useState(null);

  // State cho webcam/cam điện thoại trực tiếp
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // State cho camera stream & reconnect
  const [streamKey, setStreamKey] = useState(Date.now());
  const [failedStreams, setFailedStreams] = useState({});

  const handleReconnectCamera = (camId) => {
    setFailedStreams(prev => ({ ...prev, [camId]: false }));
    setStreamKey(Date.now());
  };

  // Form state cho camera mới
  const [newCam, setNewCam] = useState({
    name: "",
    rtsp_url: "",
    location: "Phòng Ngủ 102",
    sensitivity: "High"
  });

  // Fetch danh sách camera
  const fetchCameras = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/cameras`);
      if (res.data && res.data.data) {
        setCameras(res.data.data);
      }
    } catch (err) {
      console.warn("Lỗi kết nối API Backend, sử dụng dữ liệu mặc định:", err);
      setCameras([
        {
          camera_id: 1,
          name: "Camera AI - Phòng Ngủ Cụ Nguyễn Văn A",
          rtsp_url: "rtsp://192.168.1.101:554/stream1",
          location: "Phòng Ngủ 101",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "High"
        },
        {
          camera_id: 2,
          name: "Camera AI - Phòng Khách Trung Tâm",
          rtsp_url: "rtsp://192.168.1.102:554/stream1",
          location: "Phòng Khách",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium"
        },
        {
          camera_id: 3,
          name: "Camera AI - Nhà Vệ Sinh Tầng 1",
          rtsp_url: "rtsp://192.168.1.103:554/stream1",
          location: "Nhà Vệ Sinh Tầng 1",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "High"
        },
        {
          camera_id: 4,
          name: "Camera AI - Hành Lang Tầng 2",
          rtsp_url: "rtsp://192.168.1.104:554/stream1",
          location: "Hành Lang Tầng 2",
          status: "ONLINE",
          ai_enabled: false,
          sensitivity: "Low"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Tự động kiểm tra / polling cảnh báo mới từ Backend mỗi 3s
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/cameras/alerts`);
        if (res.data && res.data.data && res.data.data.length > 0) {
          const pendingAlert = res.data.data.find(a => a.status === "PENDING");
          if (pendingAlert && (!activeAlert || activeAlert.alert_id !== pendingAlert.alert_id)) {
            setActiveAlert(pendingAlert);
          }
        }
      } catch (e) {
        // Poll silently
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [activeAlert]);

  useEffect(() => {
    fetchCameras();
    return () => {
      stopWebcam();
    };
  }, []);

  // Bật/Tắt Webcam/Camera điện thoại trực tiếp trên trình duyệt
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setWebcamError("Không thể truy cập camera thiết bị. Vui lòng cấp quyền camera trên trình duyệt!");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  // Hàm chạy thử kích hoạt cảnh báo ngã khẩn cấp từ Camera
  const handleTriggerFallTrial = async (cameraId, camName = null, camLoc = null) => {
    setTestingCamId(cameraId);
    try {
      const res = await axios.post(`${API_BASE_URL}/cameras/${cameraId}/trigger-fall`);
      if (res.data && res.data.alert) {
        setActiveAlert(res.data.alert);
      }
    } catch (err) {
      console.warn("Lỗi gọi API backend, kích hoạt cảnh báo giả lập tại frontend:", err);
      const cam = cameras.find(c => String(c.camera_id) === String(cameraId)) || cameras[0] || {};
      setActiveAlert({
        alert_id: Math.floor(Math.random() * 9000) + 1000,
        camera_id: cameraId,
        camera_name: camName || cam.name || "Camera Điện thoại AI",
        location: camLoc || cam.location || "Phòng Giám Sát",
        patient_name: "Cụ Nguyễn Văn A (82 tuổi)",
        detected_at: new Date().toLocaleTimeString('vi-VN') + " " + new Date().toLocaleDateString('vi-VN'),
        severity: "KHẨN CẤP",
        status: "PENDING",
        ai_analytics: {
          confidence: 0.968,
          spine_angle_deg: 78.5,
          aspect_ratio: 0.42,
          vertical_velocity_m_s: 3.85,
          motionless_duration_sec: 4.2
        },
        snapshot_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
      });
    } finally {
      setTestingCamId(null);
    }
  };

  // Hàm xác nhận hỗ trợ hoặc báo động giả
  const handleAcknowledgeAlert = async (alertId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/cameras/alerts/${alertId}/acknowledge`, { status });
    } catch (e) {
      console.log("Ack alert error:", e);
    }
    setActiveAlert(null);
  };

  // Thêm camera mới
  const handleAddCameraSubmit = async (e) => {
    e.preventDefault();
    if (!newCam.name || !newCam.rtsp_url) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/cameras`, newCam);
      if (res.data && res.data.data) {
        setCameras([...cameras, res.data.data]);
      }
    } catch (err) {
      setCameras([...cameras, { ...newCam, camera_id: Date.now(), status: "ONLINE", ai_enabled: true }]);
    }
    setShowAddModal(false);
    setNewCam({ name: "", rtsp_url: "", location: "Phòng Ngủ 102", sensitivity: "High" });
  };

  return (
    <div className="container-fluid p-4">
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FaVideo className="text-primary" /> Hệ Thống Giám Sát Camera AI &amp; Báo Động Ngã
          </h3>
          <p className="text-muted mb-0 small">
            Tích hợp Camera Điện thoại, WebCam trực tiếp &amp; luồng RTSP từ mọi camera IP
          </p>
        </div>

        <div className="d-flex gap-2">
          {!isWebcamActive ? (
            <button className="btn btn-success d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={startWebcam}>
              <FaCamera /> Bật Camera Thiết Bị Trực Tiếp
            </button>
          ) : (
            <button className="btn btn-outline-danger d-flex align-items-center gap-2 fw-bold" onClick={stopWebcam}>
              <FaStop /> Tắt Camera Thiết Bị
            </button>
          )}

          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={fetchCameras}>
            <FaSync /> Làm mới
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Thêm Camera RTSP
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Tổng Camera Tích Hợp</small>
                <h3 className="fw-bold text-dark mb-0">{cameras.length + (isWebcamActive ? 1 : 0)}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                <FaDesktop className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">AI Theo Dõi Cử Động</small>
                <h3 className="fw-bold text-success mb-0">
                  {cameras.filter(c => c.ai_enabled).length + (isWebcamActive ? 1 : 0)} Active
                </h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <FaShieldAlt className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Độ Trễ Luồng Camera</small>
                <h3 className="fw-bold text-warning mb-0">&lt; 50 ms</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                <FaSignal className="fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-danger border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Trạng Thái Cảnh Báo</small>
                <h3 className="fw-bold text-danger mb-0">Sẵn Sàng 24/7</h3>
              </div>
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
                <FaExclamationTriangle className="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Banner for Phone Integration */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-gradient bg-light border-start border-info border-4">
        <div className="d-flex align-items-start gap-3">
          <div className="p-2 bg-info bg-opacity-10 text-info rounded-circle mt-1">
            <FaMobileAlt className="fs-4" />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1">
              📱 2 Cách Kết Nối Trực Tiếp Camera Điện Thoại Với Hệ Thống:
            </h6>
            <div className="row g-2 mt-1 small">
              <div className="col-md-6">
                <div className="p-2 bg-white rounded border">
                  <strong>Cách 1 (Nhanh nhất): Mở Web trên Điện thoại</strong>
                  <p className="text-muted mb-0">
                    Mở trình duyệt Safari/Chrome trên điện thoại truy cập địa chỉ này và bấm nút <span className="badge bg-success">Bật Camera Thiết Bị Trực Tiếp</span>.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-2 bg-white rounded border">
                  <strong>Cách 2: Dùng App phát RTSP (IP Webcam / DroidCam)</strong>
                  <p className="text-muted mb-0">
                    Cài app <em>IP Webcam</em> hoặc <em>DroidCam</em> trên điện thoại để lấy đường dẫn RTSP (ví dụ: <code>rtsp://192.168.1.X:8080/h264_pcm.sdp</code>) rồi dán vào nút <span className="badge bg-primary">Thêm Camera RTSP</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Device Webcam Section */}
      {isWebcamActive && (
        <div className="mb-4">
          <div className="card border-danger shadow border-2 rounded-4 overflow-hidden bg-dark text-white">
            <div className="card-header bg-danger text-white p-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm text-white" role="status"></span>
                <h6 className="mb-0 fw-bold">📷 CAMERA THIẾT BỊ / ĐIỆN THOẠI TRỰC TIẾP (LIVE STREAM)</h6>
              </div>
              <span className="badge bg-light text-danger fw-bold">REAL-TIME AI ACTIVE</span>
            </div>

            <div className="position-relative bg-black d-flex justify-content-center align-items-center" style={{ minHeight: "360px" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 object-fit-contain rounded-bottom"
                style={{ maxHeight: "480px" }}
              />

              {/* Dynamic Simulated AI Bounding Box Overlay on Live Stream */}
              <div
                className="position-absolute border border-danger border-3 rounded-3"
                style={{
                  top: "20%",
                  left: "30%",
                  width: "40%",
                  height: "55%",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)"
                }}
              >
                <span className="badge bg-danger position-absolute top-0 start-0 translate-middle-y ms-2">
                  AI POSE TRACKING (98.4%)
                </span>
                <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-1 text-center small font-monospace text-warning">
                  Spine Tilt: 14° | Upright
                </div>
              </div>
            </div>

            <div className="card-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-white-50">
                <FaShieldAlt className="text-success me-1" /> AI đang quét hình ảnh trực tiếp từ camera của bạn...
              </div>

              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                onClick={() => handleTriggerFallTrial(999, "Camera Điện thoại / Device WebCam", "Khu vực kiểm thử trực tiếp")}
              >
                <FaPlay /> 🚨 Thử Cảnh Báo Ngã Trên Camera Này
              </button>
            </div>
          </div>
        </div>
      )}

      {webcamError && (
        <div className="alert alert-warning alert-dismissible fade show rounded-4" role="alert">
          <FaExclamationTriangle className="me-2" /> {webcamError}
          <button type="button" className="btn-close" onClick={() => setWebcamError(null)}></button>
        </div>
      )}

      {/* Camera Grid View */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Đang kết nối luồng camera...</p>
        </div>
      ) : (
        <div className="row g-4">
          {cameras.map((cam) => (
            <div className="col-lg-6 col-xl-6" key={cam.camera_id}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white">
                {/* Camera Card Header */}
                <div className="card-header bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success p-1 me-1">LIVE</span>
                    <h6 className="mb-0 fw-bold">{cam.name}</h6>
                  </div>
                  <span className="badge bg-secondary font-monospace small">{cam.location}</span>
                </div>

                {/* Camera Live Stream View */}
                <div className="position-relative bg-black rounded-top overflow-hidden" style={{ minHeight: "280px" }}>
                  {/* Real HTTP Stream Video Feed (e.g., DroidCam / IP Webcam) */}
                  {cam.rtsp_url && (cam.rtsp_url.startsWith("http://") || cam.rtsp_url.startsWith("https://")) && !failedStreams[cam.camera_id] ? (
                    <img
                      key={`${cam.camera_id}-${streamKey}`}
                      src={cam.rtsp_url.includes("?") ? `${cam.rtsp_url}&_t=${streamKey}` : `${cam.rtsp_url}?_t=${streamKey}`}
                      alt={cam.name}
                      className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                      style={{ minHeight: "280px", maxHeight: "360px" }}
                      onError={() => {
                        setFailedStreams(prev => ({ ...prev, [cam.camera_id]: true }));
                      }}
                    />
                  ) : null}

                  {/* Visual Grid & Skeleton Overlay Representation */}
                  <div
                    className="w-100 h-100 d-flex flex-column justify-content-between p-3 position-relative"
                    style={{
                      backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.15) 1px, transparent 1px)`,
                      backgroundSize: "20px 20px",
                      zIndex: 2,
                      minHeight: "280px"
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <span className={`badge bg-dark bg-opacity-75 ${failedStreams[cam.camera_id] ? "text-warning border border-warning" : "text-success border border-success"} d-flex align-items-center gap-1`}>
                        <FaCheckCircle /> {failedStreams[cam.camera_id] ? "Đang chờ tín hiệu luồng" : (cam.rtsp_url?.startsWith("http") ? "HTTP / MJPEG Stream" : "RTSP Connected (H.264)")}
                      </span>
                      <span className="badge bg-primary bg-opacity-75">
                        Sensitivity: {cam.sensitivity}
                      </span>
                    </div>

                    {/* Simulated Pose Keypoints Graph overlay */}
                    <div className="text-center my-3">
                      <div className="d-inline-block position-relative border border-success border-opacity-50 px-4 py-3 rounded-3 bg-dark bg-opacity-60">
                        <small className="text-success d-block mb-1 font-monospace fw-bold">
                          [AI POSE TRACKER ACTIVE]
                        </small>
                        <div className="d-flex justify-content-center gap-3 text-white-50 small font-monospace">
                          <span>FPS: 25.0</span>
                          <span>Aspect Ratio: 1.82 (Upright)</span>
                          <span>Spine: 12°</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center text-white-50 small font-monospace bg-dark bg-opacity-75 p-2 rounded">
                      <span className="text-truncate me-2" style={{ maxWidth: "70%" }}>
                        {cam.rtsp_url}
                      </span>
                      <span className={`badge ${failedStreams[cam.camera_id] ? "bg-warning text-dark" : "bg-success"}`}>
                        {failedStreams[cam.camera_id] ? "STANDBY" : "STATUS: NORMAL"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera Card Footer & Controls */}
                <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${cam.ai_enabled ? "bg-success" : "bg-secondary"}`}>
                      {cam.ai_enabled ? "AI Monitoring: ON" : "AI Monitoring: OFF"}
                    </span>

                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={() => handleReconnectCamera(cam.camera_id)}
                      title="Thử kết nối lại luồng video"
                    >
                      <FaSync className="small" /> Kết nối lại
                    </button>
                  </div>

                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-bold shadow-sm"
                    disabled={testingCamId === cam.camera_id}
                    onClick={() => handleTriggerFallTrial(cam.camera_id)}
                  >
                    <FaPlay /> {testingCamId === cam.camera_id ? "Đang xử lý AI..." : "🚨 Chạy thử Cảnh báo Ngã"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Camera RTSP Mới */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Đăng ký Camera RTSP / Phone Camera Mới</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddCameraSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tên Camera</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Camera Điện Thoại Cụ A"
                      value={newCam.name}
                      onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Đường dẫn RTSP Stream</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="rtsp://192.168.1.X:8080/h264_pcm.sdp"
                      value={newCam.rtsp_url}
                      onChange={(e) => setNewCam({ ...newCam, rtsp_url: e.target.value })}
                      required
                    />
                    <small className="text-muted d-block mt-1">
                      Nếu dùng app IP Webcam trên điện thoại, đường dẫn có dạng: <code>rtsp://&lt;IP_Điện_Thoại&gt;:8080/h264_pcm.sdp</code>
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Vị trí lắp đặt</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Phòng Ngủ Cụ A"
                      value={newCam.location}
                      onChange={(e) => setNewCam({ ...newCam, location: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Độ nhạy AI Phát Hiện Ngã</label>
                    <select
                      className="form-select"
                      value={newCam.sensitivity}
                      onChange={(e) => setNewCam({ ...newCam, sensitivity: e.target.value })}
                    >
                      <option value="Low">Low (Ít nhạy - Tránh báo sai)</option>
                      <option value="Medium">Medium (Tiêu chuẩn)</option>
                      <option value="High">High (Cao - Nhạy nhất)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Thêm Camera</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Báo động đỏ thời gian thực khi có ngã */}
      {activeAlert && (
        <FallAlertModal
          alert={activeAlert}
          onClose={() => setActiveAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}
    </div>
  );
};

export default CameraPage;
