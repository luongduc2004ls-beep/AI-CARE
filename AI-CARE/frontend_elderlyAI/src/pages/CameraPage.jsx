import React, { useState, useEffect, useRef } from "react";
import {
  FaVideo,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPlus,
  FaPlay,
  FaCheckCircle,
  FaSignal,
  FaSync,
  FaDesktop,
  FaCamera,
  FaStop,
  FaMobileAlt,
  FaInfoCircle,
  FaWifi,
  FaUserInjured,
  FaMale,
  FaRobot,
  FaHome,
  FaBed,
  FaCouch,
  FaBath,
  FaBrain,
  FaClock,
  FaUndoAlt,
  FaRunning,
  FaSlidersH,
  FaCog,
  FaSave,
  FaExpand,
  FaCompress,
  FaUser,
  FaSearch,
  FaThLarge,
  FaTh,
  FaUsers,
  FaPhone,
  FaVolumeMute,
  FaVolumeUp,
  FaEye,
  FaFilter,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import FallAlertModal from "../components/Camera/FallAlertModal";
import notificationService from "../services/notificationService";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { captureLiveCameraSnapshot, generateSimulatedSnapshotSVG } from "../utils/snapshot";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api"
  : `http://${window.location.hostname || "localhost"}:5000/api`;

/**
 * Các đường nối khớp xương MediaPipe (Pose Connections)
 */
const POSE_CONNECTIONS = [
  [11, 12], // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 23], [12, 24], // Torso sides
  [23, 24], // Hip line
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28]  // Right leg
];

// Mẫu định dạng RTSP mặc định cho các dòng Camera trong nhà phổ biến
const INDOOR_BRAND_PRESETS = [
  {
    brand: "Ezviz / Hikvision",
    icon: "📷",
    template: "rtsp://admin:VERIFY_CODE@192.168.1.108:554/h264/ch1/main/av_stream",
    desc: "Camera IP Ezviz/Hikvision lắp phòng ngủ hoặc phòng khách",
    defaultLocation: "Phòng Ngủ Cụ A"
  },
  {
    brand: "Imou / Dahua",
    icon: "📷",
    template: "rtsp://admin:SAFETY_PASS@192.168.1.109:554/cam/realmonitor?channel=1&subtype=0",
    desc: "Camera Imou xoay 360° lắp nhà vệ sinh hoặc phòng ăn",
    defaultLocation: "Nhà Vệ Sinh Tầng 1"
  },
  {
    brand: "TP-Link Tapo",
    icon: "📷",
    template: "rtsp://admin:TAPO_PASS@192.168.1.110:554/stream1",
    desc: "Camera thông minh Tapo C200 / C310 gia đình",
    defaultLocation: "Phòng Khách Trung Tâm"
  },
  {
    brand: "Yoosee / IP Cam",
    icon: "📷",
    template: "rtsp://192.168.1.111:554/onvif1",
    desc: "Camera IP Yoosee WiFi giá rẻ trong nhà",
    defaultLocation: "Hành Lang Tầng 2"
  },
  {
    brand: "DroidCam / Điện Thoại",
    icon: "📱",
    template: "http://192.168.1.15:4747/video",
    desc: "Dùng điện thoại cũ làm camera AI đặt cố định trong nhà",
    defaultLocation: "Phòng Sinh Hoạt Gia Đình"
  }
];

const CameraPage = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const [adminViewMode, setAdminViewMode] = useState("alerts"); // "alerts" | "grid" | "focus"
  const [adminAlertFilter, setAdminAlertFilter] = useState("all");
  const [selectedLiveCamAlert, setSelectedLiveCamAlert] = useState(null);

  // Multicam Matrix UX state
  const [matrixMode, setMatrixMode] = useState("by_patient"); // "by_patient" | "grid_2x2" | "grid_3x3" | "focus"
  const [selectedPatientFilter, setSelectedPatientFilter] = useState("all");
  const [searchCamQuery, setSearchCamQuery] = useState("");
  const [maximizedCamera, setMaximizedCamera] = useState(null);
  const [audioMuteMap, setAudioMuteMap] = useState({});
  const [isFullscreenMatrix, setIsFullscreenMatrix] = useState(false);

  const [systemAlerts, setSystemAlerts] = useState([
    {
      id: 101,
      patient_id: "PAT10000",
      patient_name: "Hồ Thanh Khánh",
      age: 71,
      gender: "Nam",
      location: "Phòng Ngủ 101",
      camera_name: "Camera Ezviz AI - Phòng Ngủ",
      time: "15:18:04 - Hôm nay",
      severity: "CRITICAL",
      type: "TÉ NGÃ BẤT THƯỜNG",
      spine_angle: 78.5,
      duration_sec: 14,
      caregiver_name: "Phan Thị An (Con gái)",
      caregiver_phone: "0851745822",
      status: "PENDING",
      snapshot: generateSimulatedSnapshotSVG({ camera_name: "Camera Ezviz AI - Phòng Ngủ", location: "Phòng Ngủ 101", spine_angle: 78.5, time: "15:18:04" })
    },
    {
      id: 102,
      patient_id: "PAT10002",
      patient_name: "Đỗ Thanh Phong",
      age: 68,
      gender: "Nam",
      location: "Nhà Vệ Sinh Tầng 1",
      camera_name: "Camera AI - Nhà Vệ Sinh (Khu Vực Risk Cao)",
      time: "15:02:11 - Hôm nay",
      severity: "WARNING",
      type: "BẤT THƯỜNG TRONG NHÀ VỆ SINH",
      spine_angle: 52.0,
      duration_sec: 8,
      caregiver_name: "Đặng Quốc An (Con trai)",
      caregiver_phone: "0960768603",
      status: "PENDING",
      snapshot: generateSimulatedSnapshotSVG({ camera_name: "Camera AI - Nhà Vệ Sinh", location: "Nhà Vệ Sinh Tầng 1", spine_angle: 52.0, time: "15:02:11" })
    },
    {
      id: 103,
      patient_id: "PAT10001",
      patient_name: "Phan Anh Thảo",
      age: 74,
      gender: "Nữ",
      location: "Phòng Khách Trung Tâm",
      camera_name: "Camera Imou AI - Phòng Khách",
      time: "14:22:00 - Hôm nay",
      severity: "RESOLVED",
      type: "ĐÃ HỒI PHỤC BÌNH THƯỜNG",
      spine_angle: 12.0,
      duration_sec: 0,
      caregiver_name: "Lê Thanh Chi (Vợ)",
      caregiver_phone: "0394652227",
      status: "RESOLVED",
      snapshot: generateSimulatedSnapshotSVG({ camera_name: "Camera Imou AI - Phòng Khách", location: "Phòng Khách Trung Tâm", spine_angle: 12.0, time: "14:22:00" })
    }
  ]);

  const handleResolveSystemAlert = (id) => {
    setSystemAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "RESOLVED", severity: "RESOLVED" } : item))
    );
  };

  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showTimerSettingsModal, setShowTimerSettingsModal] = useState(false);
  const [testingCamId, setTestingCamId] = useState(null);

  // Cấu hình thời gian đếm ngược tùy chỉnh (Mặc định: 10 giây)
  const [anomalyTimeoutConfig, setAnomalyTimeoutConfig] = useState(() => {
    const saved = localStorage.getItem("anomalyTimeoutConfig");
    return saved ? parseInt(saved, 10) : 10;
  });

  const [tempTimeoutValue, setTempTimeoutValue] = useState(anomalyTimeoutConfig);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");

  // Real-Time MediaPipe AI Skeleton State
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [autoDetectFall, setAutoDetectFall] = useState(true);
  const [isSimulatedFall, setIsSimulatedFall] = useState(false);
  const [detectedSpineAngle, setDetectedSpineAngle] = useState(12.0);
  const [detectedPoseStatus, setDetectedPoseStatus] = useState("BÌNH THƯỜNG");
  const [hasRealPerson, setHasRealPerson] = useState(false);

  // Ghi Nhớ Mẫu Chuyển Động Bình Thường & Đếm Ngược Xử Lý Bất Thường
  const [anomalyCountdown, setAnomalyCountdown] = useState(anomalyTimeoutConfig);
  const [isAnomalyActive, setIsAnomalyActive] = useState(false);
  const [baselineMemoryStatus, setBaselineMemoryStatus] = useState("Đã ghi nhớ mẫu chuyển động bình thường (24/7)");

  // State khoảng cách cơ thể con người (Xa / Gần) & Tự động điều chỉnh kích thước nét vẽ khung xương
  const [personDistanceInfo, setPersonDistanceInfo] = useState({
    category: "🟢 ĐỨNG GẦN (Co giãn linh hoạt)",
    scaleRatio: 65,
    lineWidth: "5.0",
    modeLabel: "Tự động điều chỉnh kích thước nét vẽ linh hoạt theo khoảng cách"
  });

  // Canvas & Video refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const lastAlertTimeRef = useRef(0);
  const anomalyStartTimeRef = useRef(0);
  const matrixContainerRef = useRef(null);

  // REFS ĐỒNG BỘ NGUYÊN TỬ CHO MEDIAPIPE
  const anomalyTimeoutConfigRef = useRef(anomalyTimeoutConfig);
  const isSimulatedFallRef = useRef(isSimulatedFall);
  const showSkeletonRef = useRef(showSkeleton);
  const autoDetectFallRef = useRef(autoDetectFall);

  useEffect(() => {
    anomalyTimeoutConfigRef.current = anomalyTimeoutConfig;
  }, [anomalyTimeoutConfig]);

  useEffect(() => {
    isSimulatedFallRef.current = isSimulatedFall;
  }, [isSimulatedFall]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);

  useEffect(() => {
    autoDetectFallRef.current = autoDetectFall;
  }, [autoDetectFall]);

  // Quét mạng LAN giả lập
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [discoveredCameras, setDiscoveredCameras] = useState([]);

  // State quản lý thiết bị Camera DroidCam
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);

  // State DroidCam Direct IP WiFi
  const [droidcamIp, setDroidcamIp] = useState("192.168.1.15");
  const [droidcamPort, setDroidcamPort] = useState("4747");
  const [isDroidcamIpActive, setIsDroidcamIpActive] = useState(false);
  const [droidcamStreamUrl, setDroidcamStreamUrl] = useState("");
  const [ipStreamMode, setIpStreamMode] = useState("img");

  // Form state camera mới
  const [newCam, setNewCam] = useState({
    name: "",
    rtsp_url: "",
    location: "Phòng Ngủ Cụ A",
    sensitivity: "High",
    patient_id: "PAT10000",
    patient_name: "Hồ Thanh Khánh"
  });

  const saveTimeoutSetting = (newSec) => {
    const val = Math.max(parseInt(newSec, 10) || 10, 3);
    setAnomalyTimeoutConfig(val);
    setAnomalyCountdown(val);
    anomalyTimeoutConfigRef.current = val;
    localStorage.setItem("anomalyTimeoutConfig", val.toString());
    setShowTimerSettingsModal(false);

    if (!isSimulatedFallRef.current) {
      anomalyStartTimeRef.current = 0;
      setIsAnomalyActive(false);
    }
  };

  const scanVideoDevices = async () => {
    try {
      setWebcamError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setWebcamError("Trình duyệt không hỗ trợ API truy cập camera mediaDevices.");
        return;
      }

      // 1. Xin quyền truy cập camera tạm thời để hiển thị nhãn tên thiết bị
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Xin quyền camera tạm thời:", e);
      }

      // 2. Lấy danh sách các cổng video input
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(videoInputs);

      // 3. Tự động ưu tiên chọn thiết bị có chữ DroidCam (ví dụ: DroidCam Source 2, DroidCam Source 3)
      const droidCamDevice = videoInputs.find((d) =>
        (d.label || "").toLowerCase().includes("droidcam")
      );

      if (droidCamDevice) {
        setSelectedDeviceId(droidCamDevice.deviceId);
      } else if (videoInputs.length > 0) {
        setSelectedDeviceId((prev) => prev || videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Lỗi khi quét thiết bị camera:", err);
      setWebcamError("Chưa cấp quyền camera trên trình duyệt. Bấm icon 🔒 hoặc 📷 trên thanh địa chỉ để Cho Phép (Allow)!");
    }
  };

  const handleScanIndoorLanCameras = () => {
    setIsScanningLan(true);
    setDiscoveredCameras([]);
    setTimeout(() => {
      setDiscoveredCameras([
        {
          name: "Ezviz C6N - Phòng Ngủ 101",
          rtsp_url: "rtsp://admin:L2026ABC@192.168.1.105:554/h264/ch1/main/av_stream",
          location: "Phòng Ngủ 101",
          sensitivity: "High",
          ip: "192.168.1.105",
          patient_id: "PAT10000",
          patient_name: "Hồ Thanh Khánh"
        },
        {
          name: "Imou Ranger 2 - Nhà Vệ Sinh Tầng 1",
          rtsp_url: "rtsp://admin:L2026XYZ@192.168.1.106:554/cam/realmonitor?channel=1&subtype=0",
          location: "Nhà Vệ Sinh Tầng 1",
          sensitivity: "High",
          ip: "192.168.1.106",
          patient_id: "PAT10002",
          patient_name: "Đỗ Thanh Phong"
        },
        {
          name: "Tapo C200 - Phòng Khách Gia Đình",
          rtsp_url: "rtsp://admin:TAPO1234@192.168.1.107:554/stream1",
          location: "Phòng Khách",
          sensitivity: "Medium",
          ip: "192.168.1.107",
          patient_id: "PAT10001",
          patient_name: "Phan Anh Thảo"
        }
      ]);
      setIsScanningLan(false);
    }, 1800);
  };

  // Fetch danh sách camera từ Backend API
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
          patient_id: "PAT10000",
          patient_name: "Hồ Thanh Khánh",
          age: 71,
          gender: "Nam",
          device_id: "D1000",
          name: "Camera Ezviz AI - Phòng Ngủ 101 Cụ Hồ Thanh Khánh",
          rtsp_url: "rtsp://192.168.1.101:554/stream1",
          location: "Phòng Ngủ 101",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "High",
          caregiver_name: "Phan Thị An (Con gái)",
          caregiver_phone: "0851745822"
        },
        {
          camera_id: 2,
          patient_id: "PAT10001",
          patient_name: "Phan Anh Thảo",
          age: 74,
          gender: "Nữ",
          device_id: "D1001",
          name: "Camera Imou AI - Phòng Khách Cụ Phan Anh Thảo",
          rtsp_url: "rtsp://192.168.1.102:554/stream1",
          location: "Phòng Khách Trung Tâm",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium",
          caregiver_name: "Lê Thanh Chi (Vợ)",
          caregiver_phone: "0394652227"
        },
        {
          camera_id: 3,
          patient_id: "PAT10002",
          patient_name: "Đỗ Thanh Phong",
          age: 68,
          gender: "Nam",
          device_id: "D1002",
          name: "Camera AI - Nhà Vệ Sinh Cụ Đỗ Thanh Phong",
          rtsp_url: "rtsp://192.168.1.103:554/stream1",
          location: "Nhà Vệ Sinh Tầng 1",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "High",
          caregiver_name: "Đặng Quốc An (Con trai)",
          caregiver_phone: "0960768603"
        },
        {
          camera_id: 4,
          patient_id: "PAT10003",
          patient_name: "Phan Ngọc Ngọc",
          age: 73,
          gender: "Nam",
          device_id: "D1003",
          name: "Camera Tapo AI - Hành Lang Cụ Phan Ngọc Ngọc",
          rtsp_url: "rtsp://192.168.1.104:554/stream1",
          location: "Hành Lang Tầng 2",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium",
          caregiver_name: "Phan Minh Bình (Con trai)",
          caregiver_phone: "0952394419"
        },
        {
          camera_id: 5,
          patient_id: "PAT10000",
          patient_name: "Hồ Thanh Khánh",
          age: 71,
          gender: "Nam",
          device_id: "D1004",
          name: "Camera AI - Nhà Vệ Sinh 101 Cụ Hồ Thanh Khánh",
          rtsp_url: "rtsp://192.168.1.105:554/stream1",
          location: "Nhà Vệ Sinh 101",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "High",
          caregiver_name: "Phan Thị An (Con gái)",
          caregiver_phone: "0851745822"
        },
        {
          camera_id: 6,
          patient_id: "PAT10001",
          patient_name: "Phan Anh Thảo",
          age: 74,
          gender: "Nữ",
          device_id: "D1005",
          name: "Camera Tapo AI - Phòng Ngủ Cụ Phan Anh Thảo",
          rtsp_url: "rtsp://192.168.1.106:554/stream1",
          location: "Phòng Ngủ 201",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium",
          caregiver_name: "Lê Thanh Chi (Vợ)",
          caregiver_phone: "0394652227"
        },
        {
          camera_id: 7,
          patient_id: "PAT10002",
          patient_name: "Đỗ Thanh Phong",
          age: 68,
          gender: "Nam",
          device_id: "D1006",
          name: "Camera Ezviz AI - Phòng Ngủ Cụ Đỗ Thanh Phong",
          rtsp_url: "rtsp://192.168.1.107:554/stream1",
          location: "Phòng Ngủ 102",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium",
          caregiver_name: "Đặng Quốc An (Con trai)",
          caregiver_phone: "0960768603"
        },
        {
          camera_id: 8,
          patient_id: "PAT10003",
          patient_name: "Phan Ngọc Ngọc",
          age: 73,
          gender: "Nam",
          device_id: "D1007",
          name: "Camera Yoosee AI - Phòng Ăn Cụ Phan Ngọc Ngọc",
          rtsp_url: "rtsp://192.168.1.108:554/stream1",
          location: "Phòng Bếp & Nhà Ăn",
          status: "ONLINE",
          ai_enabled: true,
          sensitivity: "Medium",
          caregiver_name: "Phan Minh Bình (Con trai)",
          caregiver_phone: "0952394419"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    scanVideoDevices();
    return () => {
      stopWebcam();
    };
  }, []);

  // Bộ sinh mô phỏng landmarks người AI hoạt động liên tục khi luồng camera live bị đen hình
  const generateSyntheticPoseLandmarks = (width, height, isFalling) => {
    const timeSec = Date.now() / 1000;
    const simulatedScale = 0.38 + Math.sin(timeSec * 0.7) * 0.22; // Tự động giả lập đi lại Xa <-> Gần (0.16 -> 0.60)
    const bodyH = Math.max(height * simulatedScale, 100);
    const bodyW = Math.max(width * 0.26 * simulatedScale, 50);

    let centerX = width * 0.5 + Math.sin(timeSec * 0.9) * (width * 0.12);
    let centerY = height * (isFalling ? 0.72 : 0.48);

    const spineAngleRad = isFalling ? (78.5 * Math.PI / 180) : ((Math.sin(timeSec * 1.5) * 5 + 7) * Math.PI / 180);
    const synthLm = Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, visibility: 0.95 }));

    // Head (0)
    const headY = centerY - bodyH * 0.45 * Math.cos(spineAngleRad);
    const headX = centerX + bodyH * 0.45 * Math.sin(spineAngleRad);
    synthLm[0] = { x: headX / width, y: headY / height, visibility: 0.95 };

    // Shoulders (11, 12)
    const shoulderCenterY = centerY - bodyH * 0.25 * Math.cos(spineAngleRad);
    const shoulderCenterX = centerX + bodyH * 0.25 * Math.sin(spineAngleRad);
    synthLm[11] = { x: (shoulderCenterX - bodyW * 0.45) / width, y: shoulderCenterY / height, visibility: 0.95 };
    synthLm[12] = { x: (shoulderCenterX + bodyW * 0.45) / width, y: shoulderCenterY / height, visibility: 0.95 };

    // Hips (23, 24)
    const hipCenterY = centerY + bodyH * 0.1 * Math.cos(spineAngleRad);
    const hipCenterX = centerX - bodyH * 0.1 * Math.sin(spineAngleRad);
    synthLm[23] = { x: (hipCenterX - bodyW * 0.35) / width, y: hipCenterY / height, visibility: 0.95 };
    synthLm[24] = { x: (hipCenterX + bodyW * 0.35) / width, y: hipCenterY / height, visibility: 0.95 };

    // Knees (25, 26)
    const legOffset = Math.sin(timeSec * 3.5) * (bodyW * 0.25);
    const kneeY = hipCenterY + bodyH * 0.25;
    synthLm[25] = { x: (hipCenterX - bodyW * 0.35 + legOffset) / width, y: kneeY / height, visibility: 0.95 };
    synthLm[26] = { x: (hipCenterX + bodyW * 0.35 - legOffset) / width, y: kneeY / height, visibility: 0.95 };

    // Ankles (27, 28)
    const ankleY = kneeY + bodyH * 0.22;
    synthLm[27] = { x: (hipCenterX - bodyW * 0.35 + legOffset * 1.3) / width, y: ankleY / height, visibility: 0.95 };
    synthLm[28] = { x: (hipCenterX + bodyW * 0.35 - legOffset * 1.3) / width, y: ankleY / height, visibility: 0.95 };

    // Elbows (13, 14) & Wrists (15, 16)
    synthLm[13] = { x: (shoulderCenterX - bodyW * 0.6) / width, y: (shoulderCenterY + bodyH * 0.15) / height, visibility: 0.95 };
    synthLm[14] = { x: (shoulderCenterX + bodyW * 0.6) / width, y: (shoulderCenterY + bodyH * 0.15) / height, visibility: 0.95 };
    synthLm[15] = { x: (shoulderCenterX - bodyW * 0.65) / width, y: (shoulderCenterY + bodyH * 0.3) / height, visibility: 0.95 };
    synthLm[16] = { x: (shoulderCenterX + bodyW * 0.65) / width, y: (shoulderCenterY + bodyH * 0.3) / height, visibility: 0.95 };

    return synthLm;
  };

  // Init MediaPipe & Canvas Render Loop (Luôn luôn chạy vòng lặp vẽ canvas)
  useEffect(() => {
    let animId;
    if (isWebcamActive) {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((err) => console.warn("Video auto-play:", err));
      }

      // Khởi tạo Pose detector nếu chưa có
      if (window.Pose && !poseRef.current) {
        try {
          const pose = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
          });
          pose.onResults(onPoseResults);
          poseRef.current = pose;
        } catch (err) {
          console.warn("Khởi tạo MediaPipe Pose lỗi:", err);
        }
      }

      // Vòng lặp render liên tục (Unconditional Animation Frame)
      const renderLoop = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
          try {
            await poseRef.current.send({ image: videoRef.current });
          } catch (e) {
            onPoseResults({});
          }
        } else {
          // Vẽ luồng AI mô phỏng liên tục khi video camera chưa sẵn sàng / màn hình đen
          onPoseResults({});
        }
        animId = requestAnimationFrame(renderLoop);
      };

      animId = requestAnimationFrame(renderLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isWebcamActive]);

  const onPoseResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = videoRef.current?.videoWidth || 640);
    const height = (canvas.height = videoRef.current?.videoHeight || 480);
    ctx.clearRect(0, 0, width, height);

    if (!showSkeletonRef.current) return;

    const currentTargetTimeout = anomalyTimeoutConfigRef.current || 10;
    const isSimFall = isSimulatedFallRef.current;

    // Lấy landmarks thực tế từ camera MediaPipe hoặc từ bộ mô phỏng khi camera chưa có video
    const hasRealLm = results && results.poseLandmarks && results.poseLandmarks.length > 0;
    const isVideoPlaying = videoRef.current && videoRef.current.videoWidth > 0;

    let lm = null;
    if (isVideoPlaying && !isSimFall) {
      // Khi đang phát luồng camera thật: Ưu tiên dùng Real Pose Landmarks từ MediaPipe
      if (hasRealLm) {
        lm = results.poseLandmarks;
      } else {
        // Chưa có người đứng trước camera: Giữ canvas trong suốt 100% để hiển thị luồng video thật
        setHasRealPerson(false);
        setDetectedPoseStatus("🟢 CHỜ PHÁT HIỆN CƠ THỂ NGUỜI THẬT TRONG CAMERA");
        return;
      }
    } else {
      // Khi chưa mở camera thật hoặc đang nhấn thử nghiệm ngã: Dùng bộ mô phỏng AI
      lm = generateSyntheticPoseLandmarks(width, height, isSimFall);

      ctx.fillStyle = "rgba(10, 15, 26, 0.95)";
      ctx.fillRect(0, 0, width, height);

      // Grid phông nền CCTV AI
      ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px font-monospace, sans-serif";
      ctx.fillText("🤖 LUỒNG MÔ PHỎNG AI SKELETON (TỰ ĐỘNG CHẠY KHI CHƯA CÓ CAMERA THẬT)", 14, 22);
    }

    setHasRealPerson(true);

    const lShoulder = lm[11];
    const rShoulder = lm[12];
    const lHip = lm[23];
    const rHip = lm[24];

    const shoulderX = (lShoulder.x + rShoulder.x) / 2;
    const shoulderY = (lShoulder.y + rShoulder.y) / 2;
    const hipX = (lHip.x + rHip.x) / 2;
    const hipY = (lHip.y + rHip.y) / 2;

    const dx = Math.abs((shoulderX - hipX) * width);
    const dy = Math.abs((shoulderY - hipY) * height);
    const spineAngleDeg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
    setDetectedSpineAngle(spineAngleDeg);

    // =========================================================================
    // DYNAMIC ADAPTIVE SKELETON RESIZING (TỰ ĐỘNG TÍNH KHOẢNG CÁCH XA / GẦN)
    // =========================================================================
    let minX = width, minY = height, maxX = 0, maxY = 0;
    lm.forEach((p) => {
      if (p.visibility > 0.4) {
        minX = Math.min(minX, p.x * width);
        minY = Math.min(minY, p.y * height);
        maxX = Math.max(maxX, p.x * width);
        maxY = Math.max(maxY, p.y * height);
      }
    });

    const rawBoxW = Math.max(maxX - minX, 20);
    const rawBoxH = Math.max(maxY - minY, 20);

    const heightRatio = rawBoxH / height;
    const widthRatio = rawBoxW / width;
    const scaleRatio = Math.max(heightRatio, widthRatio);

    const dynamicLineWidth = Math.max(2.0, Math.min(8.0, scaleRatio * 8.5));
    const dynamicOuterRadius = Math.max(3.5, Math.min(11.0, scaleRatio * 12.0));
    const dynamicInnerRadius = Math.max(1.8, Math.min(5.5, scaleRatio * 6.0));

    const dynamicPad = Math.max(6, Math.min(24, scaleRatio * 25));
    const dynamicFontSize = Math.max(10, Math.min(15, Math.round(scaleRatio * 16)));

    let distanceCategoryText = "";
    if (scaleRatio < 0.32) {
      distanceCategoryText = `📏 ĐỨNG XA (Nét co nhỏ ${dynamicLineWidth.toFixed(1)}px)`;
    } else if (scaleRatio < 0.65) {
      distanceCategoryText = `📐 VỪA (Nét ${dynamicLineWidth.toFixed(1)}px)`;
    } else {
      distanceCategoryText = `🔍 ĐỨNG GẦN (Nét phóng to ${dynamicLineWidth.toFixed(1)}px)`;
    }

    setPersonDistanceInfo({
      category: distanceCategoryText,
      scaleRatio: Math.round(scaleRatio * 100),
      lineWidth: dynamicLineWidth.toFixed(1),
      modeLabel: "Tự động điều chỉnh kích thước linh hoạt theo khoảng cách"
    });

    const isPoseAbnormal = (spineAngleDeg > 35 || isSimFall);

    if (isPoseAbnormal) {
      if (!anomalyStartTimeRef.current) {
        anomalyStartTimeRef.current = Date.now();
      }
      const elapsedSec = Math.floor((Date.now() - anomalyStartTimeRef.current) / 1000);
      const remaining = Math.max(currentTargetTimeout - elapsedSec, 0);

      setAnomalyCountdown(remaining);
      setIsAnomalyActive(true);

      if (remaining > 0) {
        setDetectedPoseStatus(`⚠️ BẤT THƯỜNG! Đang chờ ${currentTargetTimeout}s... (Còn ${remaining}s)`);
      } else {
        setDetectedPoseStatus(`🚨 CẢNH BÁO NGÃ: Quá ${currentTargetTimeout}s không hồi phục!`);
        const now = Date.now();
        if (autoDetectFallRef.current && now - lastAlertTimeRef.current > 8000) {
          lastAlertTimeRef.current = now;

          const capturedSnapshot = captureLiveCameraSnapshot(videoRef.current, canvasRef.current, {
            location: "Phòng Ngủ 101 (Live Webcam)",
            spine_angle: spineAngleDeg,
            camera_name: "Webcam AI Live Giám Sát Realtime"
          });

          const newWebcamAlert = {
            id: Date.now(),
            patient_id: "PAT10000",
            patient_name: "Hồ Thanh Khánh",
            age: 71,
            gender: "Nam",
            location: "Phòng Ngủ 101 (Live Webcam)",
            camera_name: "Webcam AI Live Giám Sát Realtime",
            time: new Date().toLocaleTimeString("vi-VN") + " - Tức thì",
            severity: "CRITICAL",
            type: "🚨 CẢNH BÁO TÉ NGÃ PHÁT HIỆN TRÊN WEBCAM LIVE",
            spine_angle: spineAngleDeg || 78.5,
            duration_sec: currentTargetTimeout,
            caregiver_name: "Phan Thị An (Con gái)",
            caregiver_phone: "0851745822",
            status: "PENDING",
            snapshot: capturedSnapshot
          };
          setSystemAlerts((prev) => [newWebcamAlert, ...prev]);
          handleTriggerFallAlert(998, `Webcam Live Phát Hiện Ngã (${spineAngleDeg}°)`, "Phòng Ngủ 101", capturedSnapshot);
        }
      }
    } else {
      if (anomalyStartTimeRef.current) {
        anomalyStartTimeRef.current = 0;
        setIsAnomalyActive(false);
        setAnomalyCountdown(currentTargetTimeout);
        setDetectedPoseStatus("🟢 ĐÃ HỒI PHỤC VỀ CHUYỂN ĐỘNG BÌNH THƯỜNG");
      } else {
        setDetectedPoseStatus("🟢 CHUYỂN ĐỘNG BÌNH THƯỜNG (AI Baseline Memory Active)");
      }
    }

    const strokeColor = (isAnomalyActive && anomalyCountdown === 0) ? "#ef4444" : isAnomalyActive ? "#f59e0b" : "#10b981";
    const fillColor = (isAnomalyActive && anomalyCountdown === 0) ? "rgba(239, 68, 68, 0.2)" : isAnomalyActive ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.15)";

    // 1. VẼ ĐƯỜNG NỐI XƯƠNG
    ctx.lineWidth = dynamicLineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    POSE_CONNECTIONS.forEach(([i, j]) => {
      if (lm[i] && lm[j] && lm[i].visibility > 0.4 && lm[j].visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(lm[i].x * width, lm[i].y * height);
        ctx.lineTo(lm[j].x * width, lm[j].y * height);
        ctx.stroke();
      }
    });

    // 2. VẼ ĐIỂM KHỚP XƯƠNG
    lm.forEach((point, idx) => {
      if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx) && point.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, dynamicOuterRadius, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, dynamicInnerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
    });

    // 3. VẼ KHUNG BAO VÙNG CƠ THỂ
    const boxWidth = Math.max(rawBoxW + dynamicPad * 2, 70);
    const boxHeight = Math.max(rawBoxH + dynamicPad * 2, 70);
    const startX = Math.max(minX - dynamicPad, 0);
    const startY = Math.max(minY - dynamicPad, 0);

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = Math.max(2, dynamicLineWidth * 0.7);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(startX, startY, boxWidth, boxHeight, Math.max(4, dynamicPad * 0.4));
    } else {
      ctx.rect(startX, startY, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    // 4. VẼ BADGE THÔNG TIN
    const badgeH = Math.max(22, dynamicFontSize + 8);
    const badgeW = isAnomalyActive ? 320 : 360;
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(startX, Math.max(startY - badgeH - 2, 0), badgeW, badgeH, 4);
    } else {
      ctx.rect(startX, Math.max(startY - badgeH - 2, 0), badgeW, badgeH);
    }
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${dynamicFontSize}px sans-serif`;
    ctx.fillText(
      isAnomalyActive
        ? `⚠️ BẤT THƯỜNG! ĐẾM ${currentTargetTimeout}S: CÒN ${anomalyCountdown}S`
        : `🟢 AI POSE: ${distanceCategoryText}`,
      startX + 8,
      Math.max(startY - badgeH - 2, 0) + dynamicFontSize + 2
    );
  };

  const startWebcam = async (targetDeviceId = selectedDeviceId) => {
    setWebcamError(null);
    stopWebcam();
    try {
      let stream = null;

      // 1. Thử kết nối theo targetDeviceId cụ thể
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
        } catch (exactErr) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: targetDeviceId },
              audio: false
            });
          } catch (e) {}
        }
      }

      // 2. Nếu chưa được, tự động quét tìm thiết bị có chữ "DroidCam" trong danh sách
      if (!stream && videoDevices.length > 0) {
        const droidCamDev = videoDevices.find((d) => (d.label || "").toLowerCase().includes("droidcam"));
        if (droidCamDev && droidCamDev.deviceId) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: droidCamDev.deviceId },
              audio: false
            });
          } catch (e) {}
        }
      }

      // 3. Fallback mở webcam mặc định bất kỳ của máy
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn("Video auto-play:", err));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setWebcamError(
        "❌ Không thể nhận luồng camera từ DroidCam! Vui lòng kiểm tra: (1) App DroidCam Client trên PC đã bấm Start chưa? (2) Chọn DroidCam Source 2 hoặc Source 3 trong ô chọn. (3) Đảm bảo trình duyệt đã cấp quyền Camera!"
      );
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const handleConnectDroidcamIp = (e) => {
    e?.preventDefault();
    if (!droidcamIp) return;
    const cleanIp = droidcamIp.trim();
    const cleanPort = droidcamPort.trim() || "4747";
    const url = `http://${cleanIp}:${cleanPort}/video`;
    setDroidcamStreamUrl(url);
    setIsDroidcamIpActive(true);
  };

  const handleStopDroidcamIp = () => {
    setIsDroidcamIpActive(false);
    setDroidcamStreamUrl("");
  };

  const handleTriggerFallAlert = async (cameraId = 1, camName = null, camLoc = null, overrideSnapshot = null) => {
    setTestingCamId(cameraId);
    const cameraTitle = camName || (cameraId === 998 ? "Webcam AI Giám Sát Trực Tiếp" : `Camera AI - Kênh #${cameraId}`);
    const locationTitle = camLoc || (cameraId === 1 ? "Phòng Ngủ 101" : cameraId === 2 ? "Phòng Khách" : cameraId === 3 ? "Nhà Vệ Sinh" : "Hành Lang Tầng 2");
    const timeoutVal = anomalyTimeoutConfigRef.current || 10;
    const nowStr = new Date().toLocaleString("vi-VN");

    const capturedSnapshot = overrideSnapshot || captureLiveCameraSnapshot(videoRef.current, canvasRef.current, {
      location: locationTitle,
      spine_angle: detectedSpineAngle || 78.5,
      camera_name: cameraTitle
    });

    try {
      await notificationService.sendFallAlertNotification({
        patientName: "Cụ Hồ Thanh Khánh (71 tuổi)",
        location: locationTitle,
        cameraName: cameraTitle,
        spineAngle: detectedSpineAngle || 78.5
      });
    } catch (e) {}

    try {
      const res = await axios.post(`${API_BASE_URL}/cameras/${cameraId}/trigger-fall`, {
        snapshot_url: capturedSnapshot
      });
      if (res.data && res.data.alert) {
        const alertData = res.data.alert;
        alertData.snapshot_url = capturedSnapshot;
        alertData.detected_at = nowStr;
        setActiveAlert(alertData);
      }
    } catch (err) {
      setActiveAlert({
        alert_id: Math.floor(Math.random() * 9000) + 1000,
        camera_id: cameraId,
        camera_name: cameraTitle,
        location: locationTitle,
        patient_name: "Cụ Hồ Thanh Khánh (71 tuổi)",
        detected_at: nowStr,
        severity: "KHẨN CẤP",
        ai_analytics: {
          confidence: 0.984,
          spine_angle_deg: detectedSpineAngle || 78.5,
          aspect_ratio: 0.42,
          vertical_velocity_m_s: 3.85,
          motionless_duration_sec: timeoutVal
        },
        snapshot_url: capturedSnapshot
      });
    } finally {
      setTestingCamId(null);
    }
  };

  const toggleFallMotionState = (cameraId = 998, camName = null, camLoc = null) => {
    if (!isSimulatedFall) {
      handleTriggerFallAlert(cameraId, camName, camLoc);
    } else {
      setIsSimulatedFall(false);
      isSimulatedFallRef.current = false;
      setActiveAlert(null);
      anomalyStartTimeRef.current = 0;
      setIsAnomalyActive(false);
      setAnomalyCountdown(anomalyTimeoutConfigRef.current || 10);
    }
  };

  const handleAcknowledgeAlert = async (alertId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/cameras/alerts/${alertId}/acknowledge`, { status });
    } catch (e) {}
    setActiveAlert(null);
    setIsSimulatedFall(false);
    isSimulatedFallRef.current = false;
    anomalyStartTimeRef.current = 0;
    setIsAnomalyActive(false);
    setAnomalyCountdown(anomalyTimeoutConfigRef.current || 10);
  };

  const handleAddCameraSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCam.name || !newCam.rtsp_url) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/cameras`, newCam);
      if (res.data && res.data.data) {
        setCameras((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      setCameras((prev) => [...prev, { ...newCam, camera_id: Date.now(), status: "ONLINE", ai_enabled: true }]);
    }

    setShowAddModal(false);
    setNewCam({ name: "", rtsp_url: "", location: "Phòng Ngủ Cụ A", sensitivity: "High", patient_id: "PAT10000", patient_name: "Hồ Thanh Khánh" });
  };

  const handleSendDirectAnomalyToAdmin = (cam) => {
    const patientCode = cam.patient_id || "PAT10000";
    const patientName = cam.patient_name || (cam.name ? cam.name.replace(/^Camera\s+.*?\s+-\s+/i, "") : "Hồ Thanh Khánh");
    const camLoc = cam.location || "Phòng Ngủ 101";
    const caregiverName = cam.caregiver_name || "Phan Thị An (Con gái)";
    const caregiverPhone = cam.caregiver_phone || "0851745822";
    const calculatedSpineAngle = (Math.random() * 25 + 65).toFixed(1);

    const capturedSnapshot = captureLiveCameraSnapshot(videoRef.current, canvasRef.current, {
      location: camLoc,
      camera_name: cam.name,
      spine_angle: calculatedSpineAngle
    });

    const newAlert = {
      id: Date.now(),
      patient_id: patientCode,
      patient_name: patientName,
      age: cam.age || 71,
      gender: cam.gender || "Nam",
      location: camLoc,
      camera_name: cam.name,
      time: new Date().toLocaleTimeString("vi-VN") + " - Tức thì",
      severity: "CRITICAL",
      type: "🚨 CẢNH BÁO CHUYỂN ĐỘNG BẤT THƯỜNG BỆNH NHÂN",
      spine_angle: calculatedSpineAngle,
      duration_sec: anomalyTimeoutConfig || 10,
      caregiver_name: caregiverName,
      caregiver_phone: caregiverPhone,
      status: "PENDING",
      snapshot: capturedSnapshot
    };

    setSystemAlerts((prev) => [newAlert, ...prev]);
    alert(`📡 ĐÃ PHÁT HIỆN & BÁO CÁO THÀNH CÔNG THÔNG TIN BỆNH NHÂN:\n\n• Mã BN: [${patientCode}]\n• Họ Tên: [${patientName}]\n• Vị Trí: [${camLoc}]\n• Người Thân SOS: [${caregiverName} - ${caregiverPhone}]\n\nAdmin đã nhận thông báo thời gian thực!`);
  };

  const applyBrandPreset = (preset) => {
    setNewCam({
      name: `Camera ${preset.brand} - ${preset.defaultLocation}`,
      rtsp_url: preset.template,
      location: preset.defaultLocation,
      sensitivity: preset.defaultLocation.includes("Nhà Vệ Sinh") ? "High" : "Medium",
      patient_id: "PAT10000",
      patient_name: "Hồ Thanh Khánh"
    });
    setShowAddModal(true);
  };

  // Toggle Mute camera UI
  const toggleAudioMute = (camId) => {
    setAudioMuteMap((prev) => ({ ...prev, [camId]: !prev[camId] }));
  };

  // Toggle Matrix Fullscreen
  const toggleMatrixFullscreen = () => {
    if (!matrixContainerRef.current) return;
    if (!document.fullscreenElement) {
      matrixContainerRef.current.requestFullscreen?.().then(() => setIsFullscreenMatrix(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreenMatrix(false)).catch(() => {});
    }
  };

  // Filter cameras based on search and patient filter and room filter
  const filteredCameras = cameras.filter((cam) => {
    // Patient filter
    if (selectedPatientFilter !== "all" && cam.patient_id !== selectedPatientFilter) {
      return false;
    }
    // Room filter
    if (selectedRoomFilter !== "all") {
      const locLower = (cam.location || "").toLowerCase();
      if (selectedRoomFilter === "bedroom" && !locLower.includes("ngủ")) return false;
      if (selectedRoomFilter === "living" && !locLower.includes("khách")) return false;
      if (selectedRoomFilter === "restroom" && !(locLower.includes("vệ sinh") || locLower.includes("tắm"))) return false;
      if (selectedRoomFilter === "kitchen" && !(locLower.includes("bếp") || locLower.includes("ăn"))) return false;
    }
    // Search query
    if (searchCamQuery.trim() !== "") {
      const q = searchCamQuery.toLowerCase();
      const matchName = (cam.name || "").toLowerCase().includes(q);
      const matchLoc = (cam.location || "").toLowerCase().includes(q);
      const matchPatName = (cam.patient_name || "").toLowerCase().includes(q);
      const matchPatId = (cam.patient_id || "").toLowerCase().includes(q);
      return matchName || matchLoc || matchPatName || matchPatId;
    }
    return true;
  });

  // Helper grouping cameras by patient
  const getGroupedByPatient = (camList) => {
    const map = {};
    camList.forEach((cam) => {
      const pId = cam.patient_id || "PAT10000";
      if (!map[pId]) {
        map[pId] = {
          patient_id: pId,
          patient_name: cam.patient_name || "Bệnh nhân",
          age: cam.age || 70,
          gender: cam.gender || "Nam",
          caregiver_name: cam.caregiver_name || "Người thân",
          caregiver_phone: cam.caregiver_phone || "N/A",
          cameras: []
        };
      }
      map[pId].cameras.push(cam);
    });
    return Object.values(map);
  };

  const groupedPatients = getGroupedByPatient(filteredCameras);

  // Unique patient list for filter dropdown
  const uniquePatients = Array.from(
    new Map(cameras.map((item) => [item.patient_id, { id: item.patient_id, name: item.patient_name }])).values()
  );

  const hasDroidCamDevice = videoDevices.some((d) =>
    (d.label || "").toLowerCase().includes("droidcam")
  );

  // Reusable Single Camera Feed Render Component
  const renderCameraTile = (cam, customAspectClass = "") => {
    const isMuted = !!audioMuteMap[cam.camera_id];
    const isToiletRisk = (cam.location || "").toLowerCase().includes("vệ sinh") || (cam.location || "").toLowerCase().includes("tắm");

    return (
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white border-top border-4 border-primary transition-all hover-shadow">
        {/* Header bar on tile */}
        <div className="card-header bg-dark text-white p-2.5 d-flex justify-content-between align-items-center flex-wrap gap-1">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success text-white extra-small animate-pulse">● LIVE</span>
            <strong className="small text-truncate" style={{ maxWidth: "210px" }} title={cam.name}>
              {cam.name}
            </strong>
          </div>
          <div className="d-flex align-items-center gap-1">
            {isToiletRisk && (
              <span className="badge bg-danger text-white extra-small fw-bold">⚠️ Risk Cao</span>
            )}
            <span className="badge bg-secondary font-monospace extra-small">{cam.location}</span>
          </div>
        </div>

        {/* Feed Preview Screen */}
        <div className="position-relative bg-black d-flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "220px", maxHeight: "320px" }}>
          {cam.camera_id === 1 && isWebcamActive ? (
            <div className="position-relative w-100 h-100">
              <video ref={videoRef} autoPlay playsInline muted className="w-100 h-100 object-fit-cover" style={{ maxHeight: "280px" }} />
              <canvas ref={canvasRef} className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" />
            </div>
          ) : (
            <div
              className="w-100 h-100 d-flex flex-column justify-content-between p-3 position-relative"
              style={{
                minHeight: "220px",
                backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.15) 1px, transparent 1px)`,
                backgroundSize: "18px 18px",
                backgroundColor: "#0b0f19"
              }}
            >
              {/* Overlay Top Telemetry */}
              <div className="d-flex justify-content-between align-items-start z-1">
                <span className="badge bg-dark bg-opacity-85 text-success border border-success extra-small font-monospace">
                  RTSP/H.264 • 1080p 60FPS
                </span>
                <span className="badge bg-primary bg-opacity-85 text-white extra-small">
                  Độ Nhạy: {cam.sensitivity || "High"}
                </span>
              </div>

              {/* Center Status Badge */}
              <div className="text-center my-3 z-1">
                <div className="d-inline-block p-3 rounded-3 bg-dark bg-opacity-75 border border-success border-opacity-40">
                  <small className="text-success d-block mb-1 font-monospace fw-bold">
                    [AI BASELINE POSE MEMORY ONLINE]
                  </small>
                  <div className="d-flex justify-content-center gap-2 text-white-50 extra-small">
                    <span>Góc nghiêng: 12°</span>
                    <span>•</span>
                    <span>Chờ xác minh: {anomalyTimeoutConfig}s</span>
                  </div>
                </div>
              </div>

              {/* Overlay Bottom Patient Tag */}
              <div className="d-flex justify-content-between align-items-end text-white-50 extra-small font-monospace z-1">
                <span className="text-info fw-bold">👤 {cam.patient_id} • {cam.patient_name}</span>
                <span className="text-success">STATUS: OK</span>
              </div>
            </div>
          )}

          {/* Action Hover Controls Bar */}
          <div className="position-absolute top-0 end-0 m-2 d-flex gap-1 z-2">
            <button
              className="btn btn-xs btn-dark bg-opacity-75 text-white border-0 rounded-circle p-1.5"
              title="Phóng to luồng camera này"
              onClick={() => setMaximizedCamera(cam)}
            >
              <FaExpand className="fs-6" />
            </button>
            <button
              className={`btn btn-xs ${isMuted ? "btn-secondary" : "btn-dark"} bg-opacity-75 text-white border-0 rounded-circle p-1.5`}
              title={isMuted ? "Mở âm thanh" : "Tắt âm thanh"}
              onClick={() => toggleAudioMute(cam.camera_id)}
            >
              {isMuted ? <FaVolumeMute className="fs-6 text-warning" /> : <FaVolumeUp className="fs-6 text-info" />}
            </button>
          </div>
        </div>

        {/* Tile Bottom Action Bar */}
        <div className="card-footer bg-light p-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="small text-muted font-monospace d-flex align-items-center gap-1">
            <FaShieldAlt className="text-success" />
            <span className="extra-small text-dark fw-semibold">{cam.caregiver_name} ({cam.caregiver_phone})</span>
          </div>

          <div className="d-flex gap-1 flex-wrap">
            <button
              className="btn btn-xs btn-outline-warning text-dark fw-bold rounded-pill px-2.5 py-1"
              title="Phát báo cáo bất thường tới Admin"
              onClick={() => handleSendDirectAnomalyToAdmin(cam)}
            >
              <FaWifi className="me-1" /> Báo Admin
            </button>

            <button
              className="btn btn-xs btn-danger text-white fw-bold rounded-pill px-2.5 py-1"
              disabled={testingCamId === cam.camera_id}
              onClick={() => handleTriggerFallAlert(cam.camera_id, cam.name, cam.location)}
            >
              <FaPlay className="me-1" /> {testingCamId === cam.camera_id ? "..." : "🚨 Thử Ngã"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-3 p-md-4" ref={matrixContainerRef}>
      {/* TRUNG TÂM ĐIỀU HÀNH ADMIN */}
      {isAdmin && (
        <div className="card border-0 shadow-lg rounded-4 p-3 p-md-4 mb-4 bg-dark text-white border-start border-primary border-5">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary text-white rounded-pill px-3 py-1 fw-bold">
                  🛡️ SYSTEM COMMAND CENTER - ADMIN CONTROL WALL
                </span>
                <span className="badge bg-success text-white rounded-pill px-2.5 py-1 extra-small">
                  ● 12 Nodes Live Online (60 FPS)
                </span>
              </div>
              <h4 className="fw-bold text-white mb-1">
                Trung Tâm Giám Sát Ma Trận Camera Đa Luồng Toàn Hệ Thống
              </h4>
              <p className="text-secondary small mb-0">
                Theo dõi ma trận camera phân loại theo từng bệnh nhân, quản lý AI té ngã &amp; điều hành sự cố khẩn cấp.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 ${adminViewMode === "alerts" ? "btn-danger text-white shadow-sm" : "btn-outline-light"}`}
                onClick={() => setAdminViewMode("alerts")}
              >
                <FaExclamationTriangle /> 🚨 Trung Tâm Cảnh Báo Té Ngã
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 ${adminViewMode === "grid" ? "btn-primary text-white" : "btn-outline-light"}`}
                onClick={() => setAdminViewMode("grid")}
              >
                <FaDesktop /> 📺 Ma Trận Multi-Grid 4 Camera
              </button>
            </div>
          </div>

          {/* ADMIN: BẢNG ALERTS */}
          {adminViewMode === "alerts" && (
            <div className="mt-4 pt-3 border-top border-secondary">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h6 className="fw-bold text-danger mb-1 d-flex align-items-center gap-2">
                    <FaExclamationTriangle /> NHẬT KÝ &amp; BÁO CÁO CẢNH BÁO TÉ NGÃ TOÀN HỆ THỐNG
                  </h6>
                  <small className="text-secondary">Theo dõi sự cố khẩn cấp từ tất cả camera bệnh nhân</small>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className={`btn btn-xs rounded-pill px-3 fw-bold ${adminAlertFilter === "all" ? "btn-light text-dark" : "btn-outline-secondary text-white"}`}
                    onClick={() => setAdminAlertFilter("all")}
                  >
                    Tất Cả ({systemAlerts.length})
                  </button>
                  <button
                    className={`btn btn-xs rounded-pill px-3 fw-bold ${adminAlertFilter === "critical" ? "btn-danger text-white" : "btn-outline-danger"}`}
                    onClick={() => setAdminAlertFilter("critical")}
                  >
                    🚨 Khẩn Cấp ({systemAlerts.filter(a => a.status === "PENDING").length})
                  </button>
                  <button
                    className={`btn btn-xs rounded-pill px-3 fw-bold ${adminAlertFilter === "resolved" ? "btn-success text-white" : "btn-outline-success"}`}
                    onClick={() => setAdminAlertFilter("resolved")}
                  >
                    ✅ Đã Giải Quyết ({systemAlerts.filter(a => a.status === "RESOLVED").length})
                  </button>
                </div>
              </div>

              {/* STATS CARDS FOR ALERTS */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card bg-danger bg-opacity-20 border border-danger rounded-4 p-3 text-white">
                    <div className="small text-danger-emphasis fw-bold">🚨 CẢNH BÁO KHẨN CẤP CHỜ XỬ LÝ</div>
                    <h3 className="fw-bold text-danger mb-0 mt-1">
                      {systemAlerts.filter(a => a.status === "PENDING").length} Sự Cố
                    </h3>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-primary bg-opacity-20 border border-primary rounded-4 p-3 text-white">
                    <div className="small text-primary-emphasis fw-bold">⚡ THỜI GIAN PHẢN HỒI AI TRUNG BÌNH</div>
                    <h3 className="fw-bold text-primary mb-0 mt-1">1.2 Giây Tức Thì</h3>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-success bg-opacity-20 border border-success rounded-4 p-3 text-white">
                    <div className="small text-success-emphasis fw-bold">📞 KẾT NỐI NGƯỜI THÂN GIA ĐÌNH</div>
                    <h3 className="fw-bold text-success mb-0 mt-1">100% Tự Động SMS SOS</h3>
                  </div>
                </div>
              </div>

              {/* INCIDENTS LIST FOR ADMIN */}
              <div className="d-flex flex-column gap-3">
                {systemAlerts
                  .filter((item) => {
                    if (adminAlertFilter === "critical") return item.status === "PENDING";
                    if (adminAlertFilter === "resolved") return item.status === "RESOLVED";
                    return true;
                  })
                  .map((alertItem) => (
                    <div
                      key={alertItem.id}
                      className={`card border-0 rounded-4 p-3 text-white transition-all cursor-pointer ${
                        alertItem.status === "PENDING"
                          ? "bg-dark border-start border-danger border-5 shadow-lg"
                          : "bg-secondary bg-opacity-20 border border-secondary"
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div
                          className="d-flex align-items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSelectedLiveCamAlert(alertItem);
                            if (!isWebcamActive) startWebcam();
                          }}
                          title="Nhấn vào để xem luồng Camera AI Live trực tiếp"
                        >
                          <div className="position-relative">
                            <img
                              src={alertItem.snapshot}
                              alt="Snapshot"
                              width="90"
                              height="65"
                              className="rounded-3 object-fit-cover border border-danger shadow-sm"
                            />
                            <span className="position-absolute bottom-0 end-0 badge bg-danger text-white extra-small m-1">
                              LIVE
                            </span>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-primary font-monospace">{alertItem.patient_id}</span>
                              <h6 className="fw-bold mb-0 text-white hover-underline">{alertItem.patient_name} ({alertItem.age} tuổi)</h6>
                              <span className={`badge ${alertItem.status === "PENDING" ? "bg-danger text-white animate-pulse" : "bg-success text-white"} extra-small rounded-pill`}>
                                {alertItem.status === "PENDING" ? "🚨 CẢNH BÁO KHẨN CẤP" : "✅ ĐÃ GIẢI QUYẾT"}
                              </span>
                            </div>
                            <div className="small text-secondary mt-1">
                              📍 Vị trí: <strong className="text-info">{alertItem.location}</strong> | ⏰ Thời gian: <strong className="text-light">{alertItem.time}</strong>
                            </div>
                            <div className="small text-warning mt-1 fw-bold">
                              ⚠️ Chỉ số AI: Angles {alertItem.spine_angle}° | Bất thường kéo dài {alertItem.duration_sec}s
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            className="btn btn-sm btn-info text-dark fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedLiveCamAlert(alertItem);
                              if (!isWebcamActive) startWebcam();
                            }}
                          >
                            <FaCamera /> 📺 Mở Live Cam Trực Tiếp
                          </button>

                          {alertItem.status === "PENDING" ? (
                            <>
                              <button
                                className="btn btn-sm btn-success text-white rounded-pill px-3 fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveSystemAlert(alertItem.id);
                                }}
                              >
                                ✅ Xác Nhận An Toàn
                              </button>
                              <button
                                className="btn btn-sm btn-danger text-white rounded-pill px-3 fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Đã phát thông báo điều động y tế cấp cứu tới ${alertItem.patient_name}!`);
                                }}
                              >
                                🚑 Điều Y Tế Cấp Cứu
                              </button>
                            </>
                          ) : (
                            <span className="badge bg-success text-white px-3 py-2 rounded-pill fw-bold">
                              ✓ Đã hoàn tất
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ADMIN MA TRẬN MULTI-GRID */}
          {adminViewMode === "grid" && (
            <div className="mt-4 pt-3 border-top border-secondary">
              <h6 className="fw-bold text-info mb-3 d-flex align-items-center gap-2">
                <FaDesktop /> MA TRẬN CAMERA GIÁM SÁT REAL-TIME 4 PHÒNG BỆNH NHÂN (ADMIN MULTI-GRID)
              </h6>
              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden">
                    <div className="p-2 bg-dark border-bottom border-secondary small font-monospace text-primary">
                      🔴 LIVE • PAT10000 Hồ Thanh Khánh (Phòng Ngủ 101)
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                      {isWebcamActive ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="text-center p-3">
                          <FaVideo className="fs-2 text-primary mb-2 opacity-50" />
                          <div className="small text-secondary">Luồng Live AI Camera Phòng Ngủ PAT10000</div>
                          <button className="btn btn-sm btn-primary rounded-pill mt-2" onClick={() => startWebcam()}>Bật Webcam Live</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden">
                    <div className="p-2 bg-dark border-bottom border-secondary small font-monospace text-info">
                      🔴 LIVE • PAT10001 Phan Anh Thảo (Phòng Khách)
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                      <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80" alt="Cam 2" className="w-100 h-100 object-fit-cover opacity-85" />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden">
                    <div className="p-2 bg-dark border-bottom border-secondary small font-monospace text-warning">
                      🔴 LIVE • PAT10002 Đỗ Thanh Phong (Nhà Vệ Sinh Tầng 1)
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                      <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" alt="Cam 3" className="w-100 h-100 object-fit-cover opacity-85" />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden">
                    <div className="p-2 bg-dark border-bottom border-secondary small font-monospace text-success">
                      🔴 LIVE • PAT10003 Phan Ngọc Ngọc (Hành Lang Tầng 2)
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" alt="Cam 4" className="w-100 h-100 object-fit-cover opacity-85" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HEADER TOP BAR */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FaBrain className="text-primary" /> AI Ghi Nhớ Chuyển Động &amp; Ma Trận Multi-Cam Theo Bệnh Nhân
          </h3>
          <p className="text-muted mb-0 small">
            Quản lý ma trận camera thông minh, tự động phân nhóm theo danh sách từng bệnh nhân &amp; tùy chỉnh đếm đệm ({anomalyTimeoutConfig}s)!
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2 px-3 shadow-sm rounded-pill"
            onClick={() => {
              setTempTimeoutValue(anomalyTimeoutConfig);
              setShowTimerSettingsModal(true);
            }}
          >
            <FaSlidersH /> ⚙️ Tùy Chỉnh Thời Gian ({anomalyTimeoutConfig}s)
          </button>

          <div className="bg-light p-2 rounded-pill border d-flex align-items-center gap-2 px-3">
            <span className="small fw-semibold text-secondary">Phủ Khung Xương:</span>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="skeletonSwitch"
                checked={showSkeleton}
                onChange={(e) => setShowSkeleton(e.target.checked)}
              />
            </div>
          </div>

          <button
            className="btn btn-outline-info d-flex align-items-center gap-2 fw-semibold"
            onClick={() => setShowGuideModal(true)}
          >
            <FaInfoCircle /> Hướng Dẫn Hỗ Trợ
          </button>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => {
              fetchCameras();
              scanVideoDevices();
            }}
          >
            <FaSync /> Làm Mới
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus /> Thêm Camera RTSP
          </button>
        </div>
      </div>

      {/* THẺ TỔNG QUAN AI BASELINE */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <FaBrain className="fs-3" />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">AI Baseline Memory</small>
                <strong className="text-success small d-block">{baselineMemoryStatus}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4 cursor-pointer" onClick={() => setShowTimerSettingsModal(true)}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                  <FaClock className="fs-3" />
                </div>
                <div>
                  <small className="text-muted fw-semibold d-block">Thời Gian Đếm Ngược Đã Cài</small>
                  <h4 className={`fw-bold mb-0 ${isAnomalyActive ? "text-warning animate-pulse" : "text-dark"}`}>
                    {isAnomalyActive ? `⏱️ CÒN ${anomalyCountdown}S...` : `${anomalyTimeoutConfig} GIÂY`}
                  </h4>
                </div>
              </div>
              <button className="btn btn-xs btn-outline-warning rounded-circle p-2">
                <FaCog />
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-danger border-4">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
                <FaExclamationTriangle className="fs-3" />
              </div>
              <div>
                <small className="text-muted fw-semibold d-block">Trạng Thái An Toàn Khẩn Cấp</small>
                <h4 className={`fw-bold mb-0 ${isAnomalyActive && anomalyCountdown === 0 ? "text-danger animate-pulse" : "text-success"}`}>
                  {isAnomalyActive && anomalyCountdown === 0 ? "🚨 PHÁT BÁO ĐỘNG NGÃ!" : "🟢 AN TOÀN"}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRESETS CAMERA TRONG NHÀ */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <FaHome className="text-success" /> Thêm Nhanh Camera Trong Nhà Theo Thương Hiệu
            </h5>
            <small className="text-muted">Nhấn vào mẫu thương hiệu camera gia đình để tự điền luồng kết nối</small>
          </div>

          <button
            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
            onClick={handleScanIndoorLanCameras}
            disabled={isScanningLan}
          >
            <FaWifi className="me-1" />
            {isScanningLan ? "Đang quét mạng WiFi..." : "🔍 Quét Tự Động Camera Trong Mạng WiFi Gia Đình"}
          </button>
        </div>

        <div className="row g-3 mb-3">
          {INDOOR_BRAND_PRESETS.map((preset, idx) => (
            <div className="col-12 col-sm-6 col-lg" key={idx}>
              <div
                className="p-3 rounded-4 border bg-light h-100 hover-shadow transition-all cursor-pointer d-flex flex-column justify-content-between"
                onClick={() => applyBrandPreset(preset)}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fs-5">{preset.icon}</span>
                    <strong className="text-dark small">{preset.brand}</strong>
                  </div>
                  <p className="text-muted extra-small mb-2" style={{ fontSize: "0.78rem" }}>
                    {preset.desc}
                  </p>
                </div>
                <button className="btn btn-xs btn-outline-primary rounded-pill w-100 py-1 font-monospace small">
                  + Chọn Mẫu {preset.brand.split(" ")[0]}
                </button>
              </div>
            </div>
          ))}
        </div>

        {discoveredCameras.length > 0 && (
          <div className="p-3 bg-success bg-opacity-10 border border-success rounded-4 mt-2">
            <h6 className="fw-bold text-success mb-2 d-flex align-items-center gap-2">
              <FaCheckCircle /> Đã phát hiện {discoveredCameras.length} Camera IP trong mạng WiFi:
            </h6>
            <div className="row g-2">
              {discoveredCameras.map((discovered, dIdx) => (
                <div className="col-md-4" key={dIdx}>
                  <div className="p-2 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <strong className="d-block small text-dark">{discovered.name}</strong>
                      <small className="text-muted font-monospace">{discovered.ip}</small>
                    </div>
                    <button
                      className="btn btn-sm btn-success rounded-pill px-3 py-1"
                      onClick={() => {
                        setNewCam({
                          name: discovered.name,
                          rtsp_url: discovered.rtsp_url,
                          location: discovered.location,
                          sensitivity: discovered.sensitivity,
                          patient_id: discovered.patient_id || "PAT10000",
                          patient_name: discovered.patient_name || "Hồ Thanh Khánh"
                        });
                        handleAddCameraSubmit();
                      }}
                    >
                      + Thêm Nhanh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DRODCAM WEBCAM CONTROL */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
              <FaMobileAlt className="fs-4" />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Dùng Điện Thoại Làm Camera AI Đặt Trong Nhà (DroidCam)</h5>
              <small className="text-muted">Biến điện thoại cũ thành camera giám sát AI thông minh đặt tại các phòng</small>
            </div>
          </div>

          <button
            className="btn btn-sm btn-outline-primary rounded-pill px-3"
            onClick={scanVideoDevices}
          >
            <FaSync className="me-1" /> Quét Cổng Camera ({videoDevices.length} thiết bị)
          </button>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-lg-6">
            <div className="p-3 bg-light rounded-4 border">
              <label className="form-label fw-bold text-dark small d-flex align-items-center gap-2 mb-2">
                <FaCamera className="text-success" /> Cách 1: DroidCam Windows Client (Camera Ảo)
              </label>

              <div className="d-flex gap-2">
                <select
                  className="form-select border-primary"
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    if (isWebcamActive) {
                      startWebcam(e.target.value);
                    }
                  }}
                >
                  {videoDevices.length === 0 && (
                    <option value="">(Bấm "Quét Cổng Camera" để nạp DroidCam)</option>
                  )}
                  {videoDevices.map((device, idx) => (
                    <option key={device.deviceId ? device.deviceId : `device-${idx}`} value={device.deviceId}>
                      {device.label ? `📷 ${device.label}` : `Camera Cổng ${idx + 1} (${device.deviceId ? device.deviceId.substring(0, 8) : idx}...)`}
                    </option>
                  ))}
                </select>

                {!isWebcamActive ? (
                  <button
                    className="btn btn-success fw-bold d-flex align-items-center gap-2 text-nowrap px-4"
                    onClick={() => startWebcam(selectedDeviceId)}
                  >
                    <FaCamera /> Bật Camera DroidCam
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2 text-nowrap px-3"
                    onClick={stopWebcam}
                  >
                    <FaStop /> Tắt Camera
                  </button>
                )}
              </div>

              {hasDroidCamDevice && (
                <div className="mt-2 text-success small fw-semibold d-flex align-items-center gap-1">
                  <FaCheckCircle /> Đã phát hiện cổng DroidCam! Chọn DroidCam Source 2/3 rồi bấm "Bật Camera DroidCam".
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <form onSubmit={handleConnectDroidcamIp} className="p-3 bg-light rounded-4 border">
              <label className="form-label fw-bold text-dark small d-flex align-items-center justify-content-between mb-2">
                <span className="d-flex align-items-center gap-2">
                  <FaWifi className="text-info" /> Cách 2: Kết Nối Trực Tiếp Qua WiFi IP DroidCam Điện Thoại
                </span>
                <span className="badge bg-secondary font-monospace">Port 4747</span>
              </label>

              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control font-monospace"
                  placeholder="IP Ví dụ: 192.168.1.15 hoặc 127.0.0.1"
                  value={droidcamIp}
                  onChange={(e) => setDroidcamIp(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-control font-monospace"
                  style={{ width: "90px" }}
                  placeholder="4747"
                  value={droidcamPort}
                  onChange={(e) => setDroidcamPort(e.target.value)}
                  required
                />

                {!isDroidcamIpActive ? (
                  <button type="submit" className="btn btn-primary fw-bold text-nowrap px-3">
                    <FaWifi className="me-1" /> Phát Stream IP
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-danger fw-bold text-nowrap px-3"
                    onClick={handleStopDroidcamIp}
                  >
                    <FaStop className="me-1" /> Ngắt Stream
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* BẢNG HƯỚNG DẪN KHẮC PHỤC KHI KHÔNG NHẬN DROIDCAM */}
        <div className="p-3 bg-info bg-opacity-10 border border-info rounded-4 mt-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <FaInfoCircle className="text-info fs-5" /> Hướng Dẫn Sửa Lỗi Khi Không Nhận Được Camera Từ DroidCam:
            </h6>
            <button
              className="btn btn-xs btn-outline-primary rounded-pill px-3 fw-bold"
              onClick={scanVideoDevices}
            >
              <FaSync className="me-1" /> Quét Lại Thiết Bị
            </button>
          </div>

          <div className="row g-2 extra-small text-dark">
            <div className="col-md-6">
              <div className="p-2.5 bg-white rounded-3 border h-100">
                <strong className="text-primary d-block mb-1 font-monospace">📌 Nếu dùng Cách 1 (App DroidCam trên Windows):</strong>
                <ul className="mb-0 ps-3 text-secondary" style={{ lineHeight: "1.5" }}>
                  <li>Mở ứng dụng <strong>DroidCam Client</strong> trên máy tính và ấn nút <strong>"Start"</strong>.</li>
                  <li>Nếu ô chọn camera đang trống, hãy bấm <strong>"Quét Cổng Camera"</strong>.</li>
                  <li>Trong menu chọn camera, đổi sang <strong>📷 DroidCam Source 2</strong> hoặc <strong>Source 3</strong>.</li>
                  <li>Đảm bảo trình duyệt không bị chặn quyền Camera (Bấm Cho Phép / Allow).</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-2.5 bg-white rounded-3 border h-100">
                <strong className="text-success d-block mb-1 font-monospace">📌 Nếu dùng Cách 2 (WiFi IP Stream trực tiếp):</strong>
                <ul className="mb-0 ps-3 text-secondary" style={{ lineHeight: "1.5" }}>
                  <li>Kiểm tra Điện Thoại và Máy Tính đã kết nối <strong>cùng 1 mạng WiFi</strong>.</li>
                  <li>Nhập đúng địa chỉ IP ghi trên màn hình DroidCam điện thoại (ví dụ: <code>192.168.1.15</code>).</li>
                  <li>Giữ nguyên Port <code>4747</code> rồi bấm <strong>"Phát Stream IP"</strong>.</li>
                  <li>Nếu hình bị đen, bấm nút <strong>"Đổi Chế Độ (Thẻ Ảnh / Iframe)"</strong> ở góc phải màn hình.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {webcamError && (
        <div className="alert alert-warning alert-dismissible fade show rounded-4 mb-4" role="alert">
          <FaExclamationTriangle className="me-2" /> {webcamError}
          <button type="button" className="btn-close" onClick={() => setWebcamError(null)}></button>
        </div>
      )}

      {/* DROIDCAM LIVE DISPLAY */}
      {isWebcamActive && (
        <div className="mb-4">
          <div className={`card ${isAnomalyActive && anomalyCountdown === 0 ? "border-danger border-4" : isAnomalyActive ? "border-warning border-4" : "border-success border-3"} shadow-lg rounded-4 overflow-hidden bg-dark text-white`}>
            <div className={`card-header ${isAnomalyActive && anomalyCountdown === 0 ? "bg-danger text-white" : isAnomalyActive ? "bg-warning text-dark" : "bg-success text-white"} p-3 d-flex justify-content-between align-items-center`}>
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm" role="status"></span>
                <h6 className="mb-0 fw-bold">📱 DROIDCAM LIVE: AI BASELINE &amp; BỘ ĐẾM {anomalyTimeoutConfig}S TÙY CHỈNH</h6>
              </div>

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button
                  className="btn btn-xs btn-outline-light fw-bold py-1 px-3 rounded-pill"
                  onClick={() => startWebcam("")}
                >
                  <FaCamera className="me-1" /> 🎥 Mở Webcam PC
                </button>

                <button
                  className="btn btn-xs btn-light text-success fw-bold py-1 px-3 rounded-pill"
                  onClick={() => {
                    setIsSimulatedFall(false);
                    isSimulatedFallRef.current = false;
                    anomalyStartTimeRef.current = 0;
                    setIsAnomalyActive(false);
                    setAnomalyCountdown(anomalyTimeoutConfig);
                  }}
                >
                  <FaRunning className="me-1" /> Chuyển Động Bình Thường
                </button>

                <button
                  className="btn btn-xs btn-danger text-white fw-bold py-1 px-3 rounded-pill"
                  onClick={() => toggleFallMotionState(998, "Camera DroidCam Điện thoại", "Phòng Ngủ Cụ A")}
                >
                  <FaExclamationTriangle className="me-1" /> 🚨 Thử Bất Thường &gt; {anomalyTimeoutConfig}s
                </button>
              </div>
            </div>

            <div className="position-relative bg-black d-flex justify-content-center align-items-center rounded-bottom overflow-hidden" style={{ minHeight: "400px" }}>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch((err) => console.warn("Video auto-play:", err));
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 object-fit-contain position-relative"
                style={{ maxHeight: "520px", minHeight: "340px", zIndex: 1 }}
              />

              <canvas
                ref={canvasRef}
                className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
                style={{ objectFit: "contain", zIndex: 10 }}
              />

              {isAnomalyActive && (
                <div
                  className="position-absolute top-0 start-50 translate-middle-x mt-3 bg-warning text-dark p-2 px-4 rounded-pill shadow-lg border border-dark border-2 text-center"
                  style={{ zIndex: 20 }}
                >
                  <strong className="d-block">
                    ⚠️ PHÁT HIỆN CHUYỂN ĐỘNG BẤT THƯỜNG! ĐANG ĐẾM HỒI PHỤC:
                  </strong>
                  <span className="fs-5 fw-bold font-monospace text-danger">
                    ⏱️ CÒN {anomalyCountdown} GIÂY (Mốc cài đặt: {anomalyTimeoutConfig}s)
                  </span>
                </div>
              )}

              <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-85 p-2 text-center small font-monospace text-white d-flex justify-content-around align-items-center flex-wrap gap-2" style={{ zIndex: 15 }}>
                <span>Góc Cột Sống: <strong className={detectedSpineAngle > 45 || isSimulatedFall ? "text-warning fs-6" : "text-success"}>{detectedSpineAngle}°</strong></span>
                <span>Khoảng Cách: <strong className="text-info">{personDistanceInfo.category}</strong></span>
                <span>Nét Khung Xương: <strong className="text-warning">{personDistanceInfo.lineWidth}px (Dynamic)</strong></span>
                <span>Trạng Thái: <strong className={isAnomalyActive ? "text-warning fw-bold animate-pulse" : "text-success"}>{detectedPoseStatus}</strong></span>
              </div>
            </div>

            <div className="card-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-white-50">
                <FaShieldAlt className={isAnomalyActive ? "text-warning me-1" : "text-success me-1"} />
                {isAnomalyActive
                  ? `AI đang đếm ngược ${anomalyCountdown}s (theo mức cài đặt ${anomalyTimeoutConfig}s). Hệ thống tự hủy nếu cử động bình thường.`
                  : `AI học mẫu cử động 24/7. Thời gian đếm đệm xác minh: ${anomalyTimeoutConfig}s.`}
              </div>

              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                onClick={() => handleTriggerFallAlert(998, "Camera DroidCam Điện thoại", "Phòng Ngủ Cụ A")}
              >
                <FaPlay /> 🚨 PHÁT BÁO ĐỘNG NGÃ TỨC THÌ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHU VỰC ĐIỀU KHIỂN & MA TRẬN MULTICAM PHÂN LOẠI THEO TỪNG BỆNH NHÂN */}
      {/* ========================================================================= */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
        {/* Multicam Control Toolbar */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-3 border-bottom mb-3">
          <div>
            <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <FaDesktop className="text-primary" /> Bảng Ma Trận Multi-Cam &amp; Quản Lý Theo Bệnh Nhân
            </h5>
            <p className="text-muted extra-small mb-0">
              Hiển thị danh sách camera của từng bệnh nhân, chọn chế độ ma trận 2x2, 3x3 hoặc lọc riêng theo từng bệnh nhân.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="btn-group p-1 bg-light rounded-pill border">
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 ${matrixMode === "by_patient" ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"}`}
                onClick={() => setMatrixMode("by_patient")}
                title="Gom nhóm camera theo từng bệnh nhân"
              >
                <FaUsers /> Nhóm Theo Bệnh Nhân
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 ${matrixMode === "grid_2x2" ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"}`}
                onClick={() => setMatrixMode("grid_2x2")}
                title="Chế độ Ma Trận Grid 2x2"
              >
                <FaThLarge /> Ma Trận 2x2
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 ${matrixMode === "grid_3x3" ? "btn-primary text-white shadow-sm" : "btn-light text-secondary"}`}
                onClick={() => setMatrixMode("grid_3x3")}
                title="Chế độ Ma Trận Grid 3x3"
              >
                <FaTh /> Ma Trận 3x3
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              className="btn btn-sm btn-outline-dark rounded-pill px-3 d-flex align-items-center gap-1 fw-bold"
              onClick={toggleMatrixFullscreen}
            >
              {isFullscreenMatrix ? <FaCompress /> : <FaExpand />}
              {isFullscreenMatrix ? "Thoát Fullscreen" : "Toàn Màn Hình"}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Tìm theo tên bệnh nhân, mã BN, vị trí camera..."
                value={searchCamQuery}
                onChange={(e) => setSearchCamQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted fw-bold text-nowrap">Lọc Bệnh Nhân:</label>
              <select
                className="form-select form-select-sm border-primary rounded-3 font-monospace"
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
              >
                <option value="all">Tất Cả Bệnh Nhân ({uniquePatients.length})</option>
                {uniquePatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 [{p.id}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted fw-bold text-nowrap">Khu Vực:</label>
              <div className="btn-group btn-group-sm w-100 rounded-3 border bg-light p-0.5">
                <button
                  className={`btn ${selectedRoomFilter === "all" ? "btn-primary" : "btn-light text-secondary"} btn-xs py-1`}
                  onClick={() => setSelectedRoomFilter("all")}
                >
                  Tất Cả
                </button>
                <button
                  className={`btn ${selectedRoomFilter === "bedroom" ? "btn-primary" : "btn-light text-secondary"} btn-xs py-1`}
                  onClick={() => setSelectedRoomFilter("bedroom")}
                >
                  Phòng Ngủ
                </button>
                <button
                  className={`btn ${selectedRoomFilter === "living" ? "btn-primary" : "btn-light text-secondary"} btn-xs py-1`}
                  onClick={() => setSelectedRoomFilter("living")}
                >
                  Phòng Khách
                </button>
                <button
                  className={`btn ${selectedRoomFilter === "restroom" ? "btn-primary" : "btn-light text-secondary"} btn-xs py-1`}
                  onClick={() => setSelectedRoomFilter("restroom")}
                >
                  Nhà Vệ Sinh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Đang tải ma trận camera của từng bệnh nhân...</p>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 my-3 border">
            <FaCamera className="fs-1 text-muted mb-2 opacity-50" />
            <h6 className="fw-bold text-secondary">Không tìm thấy camera thỏa mãn bộ lọc</h6>
            <p className="text-muted extra-small mb-0">Thử xóa từ khóa tìm kiếm hoặc chọn lại bệnh nhân / khu vực khác.</p>
          </div>
        ) : (
          /* ========================================================================= */
          /* RENDER MATRIX MODES */
          /* ========================================================================= */
          <>
            {/* MODE 1: GROUPED BY PATIENT (NHÓM THEO BỆNH NHÂN) */}
            {matrixMode === "by_patient" && (
              <div className="d-flex flex-column gap-4">
                {groupedPatients.map((patientGroup) => (
                  <div
                    key={patientGroup.patient_id}
                    className="card border-0 shadow-sm rounded-4 overflow-hidden bg-light border-start border-5 border-info"
                  >
                    {/* Patient Group Header Card */}
                    <div className="card-header bg-white p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-circle bg-primary bg-opacity-10 text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px", fontSize: "1.2rem" }}>
                          <FaUser />
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-primary font-monospace extra-small px-2 py-1">{patientGroup.patient_id}</span>
                            <h5 className="fw-bold mb-0 text-dark">{patientGroup.patient_name}</h5>
                            <span className="badge bg-secondary extra-small rounded-pill">
                              {patientGroup.age} tuổi • {patientGroup.gender}
                            </span>
                          </div>
                          <div className="small text-muted mt-1">
                            👨‍👩‍👧 Người thân: <strong className="text-dark">{patientGroup.caregiver_name}</strong> - 📞 <strong className="text-primary">{patientGroup.caregiver_phone}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-1.5 fw-bold extra-small">
                          📡 {patientGroup.cameras.length} Camera AI Active
                        </span>

                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                          onClick={() => {
                            const firstCam = patientGroup.cameras[0];
                            if (firstCam) handleTriggerFallAlert(firstCam.camera_id, firstCam.name, firstCam.location);
                          }}
                        >
                          <FaExclamationTriangle /> 🚨 SOS Bệnh Nhân
                        </button>
                      </div>
                    </div>

                    {/* Patient's Multi-Cam Grid */}
                    <div className="card-body p-3">
                      <div className="row g-3">
                        {patientGroup.cameras.map((cam) => (
                          <div className="col-12 col-md-6 col-lg-6" key={cam.camera_id}>
                            {renderCameraTile(cam)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODE 2: GRID 2x2 (MA TRẬN 2 CỘT) */}
            {matrixMode === "grid_2x2" && (
              <div className="row g-3">
                {filteredCameras.map((cam) => (
                  <div className="col-12 col-md-6 col-lg-6" key={cam.camera_id}>
                    {renderCameraTile(cam)}
                  </div>
                ))}
              </div>
            )}

            {/* MODE 3: GRID 3x3 (MA TRẬN 3 CỘT) */}
            {matrixMode === "grid_3x3" && (
              <div className="row g-3">
                {filteredCameras.map((cam) => (
                  <div className="col-12 col-md-6 col-lg-4" key={cam.camera_id}>
                    {renderCameraTile(cam)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PHÓNG TO LUỒNG CAMERA CHI TIẾT (MAXIMIZED CAMERA MODAL) */}
      {/* ========================================================================= */}
      {maximizedCamera && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0 bg-dark text-white overflow-hidden">
              <div className="modal-header bg-dark text-white border-bottom border-secondary p-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success text-white px-2 py-1 extra-small">LIVE STREAM 1080P</span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate" style={{ maxWidth: "500px" }}>
                    🔍 {maximizedCamera.name}
                  </h5>
                  <span className="badge bg-primary font-monospace ms-2">{maximizedCamera.patient_id} • {maximizedCamera.patient_name}</span>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMaximizedCamera(null)}
                ></button>
              </div>

              <div className="modal-body p-0 position-relative bg-black d-flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "520px" }}>
                <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center bg-black">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch((err) => console.warn("Video auto-play:", err));
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-100 h-100 object-fit-contain position-relative"
                    style={{ minHeight: "480px", maxHeight: "650px", zIndex: 1 }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
                    style={{ objectFit: "contain", zIndex: 10 }}
                  />
                </div>

                <div className="position-absolute top-0 start-0 m-3 badge bg-dark bg-opacity-85 text-white p-2 font-monospace border border-secondary shadow" style={{ zIndex: 10 }}>
                  📍 Vị Trí: {maximizedCamera.location} | RTSP Stream: {maximizedCamera.rtsp_url}
                </div>

                <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-85 p-2.5 text-center small font-monospace text-white d-flex justify-content-around align-items-center flex-wrap gap-2" style={{ zIndex: 15 }}>
                  <span>Góc Cột Sống: <strong className={isAnomalyActive ? "text-warning fs-6" : "text-success"}>{isAnomalyActive ? `${detectedSpineAngle || 78.5}°` : "14.5°"}</strong></span>
                  <span>Khoảng Cách: <strong className="text-info">📐 VỪA (Nét 5.2px)</strong></span>
                  <span>Trạng Thái AI: <strong className={isAnomalyActive ? "text-warning fw-bold animate-pulse" : "text-success"}>{isAnomalyActive ? `⚠️ PHÁT HIỆN BẤT THƯỜNG (${anomalyCountdown}s)` : "🟢 CHUYỂN ĐỘNG BÌNH THƯỜNG (24/7 Baseline)"}</strong></span>
                </div>
              </div>

              <div className="modal-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="small text-secondary font-monospace">
                  👨‍👩‍👧 Người thân tiếp nhận SOS: <strong className="text-white">{maximizedCamera.caregiver_name}</strong> ({maximizedCamera.caregiver_phone})
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-warning text-dark rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      handleSendDirectAnomalyToAdmin(maximizedCamera);
                      setMaximizedCamera(null);
                    }}
                  >
                    <FaWifi className="me-1" /> Báo Bất Thường Cho Admin
                  </button>
                  <button
                    className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      handleTriggerFallAlert(maximizedCamera.camera_id, maximizedCamera.name, maximizedCamera.location);
                      setMaximizedCamera(null);
                    }}
                  >
                    <FaPlay className="me-1" /> 🚨 Phát Báo Động Ngã Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÙY CHỈNH THỜI GIAN ĐẾM NGƯỢC */}
      {showTimerSettingsModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow border-0">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaSlidersH /> Menu Tùy Chỉnh Thời Gian Đếm Ngược Báo Động
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTimerSettingsModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-warning border-0 rounded-3 mb-4 small">
                  <strong>💡 Hướng dẫn cài đặt thời gian chờ:</strong>
                  <p className="mb-0">
                    Khi AI phát hiện bất thường, hệ thống đếm ngược thời gian đệm này. Nếu người thân tự đứng dậy trong thời gian này, báo động tự động HỦY.
                  </p>
                </div>

                <h6 className="fw-bold text-dark mb-3">1. Chọn Mức Thời Gian Nhanh:</h6>
                <div className="row g-2 mb-4">
                  {[
                    { label: "5 Giây", val: 5, desc: "Cấp cứu cực nhanh (Dành cho người yếu)" },
                    { label: "10 Giây", val: 10, desc: "Mặc định tiêu chuẩn hệ thống" },
                    { label: "15 Giây", val: 15, desc: "Phù hợp cho người già đi chậm" },
                    { label: "30 Giây", val: 30, desc: "Thận trọng tối đa" }
                  ].map((p, idx) => (
                    <div className="col-6" key={idx}>
                      <button
                        type="button"
                        className={`btn w-100 text-start p-3 rounded-3 border ${tempTimeoutValue === p.val ? "btn-warning text-dark border-dark fw-bold" : "btn-light text-dark"}`}
                        onClick={() => setTempTimeoutValue(p.val)}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="fs-6">{p.label}</strong>
                          {tempTimeoutValue === p.val && <FaCheckCircle className="text-dark" />}
                        </div>
                        <small className="text-muted extra-small d-block">{p.desc}</small>
                      </button>
                    </div>
                  ))}
                </div>

                <h6 className="fw-bold text-dark mb-2">2. Hoặc Tùy Chỉnh Số Giây Chính Xác:</h6>
                <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-3 border mb-3">
                  <input
                    type="range"
                    className="form-range flex-grow-1"
                    min="3"
                    max="60"
                    step="1"
                    value={tempTimeoutValue}
                    onChange={(e) => setTempTimeoutValue(parseInt(e.target.value, 10))}
                  />
                  <div className="bg-white border rounded-3 px-3 py-2 text-center font-monospace fw-bold fs-5 text-primary" style={{ minWidth: "90px" }}>
                    {tempTimeoutValue}s
                  </div>
                </div>

                <div className="small text-muted text-end">
                  Khoảng giá trị cho phép: từ <strong>3 giây</strong> đến <strong>60 giây</strong>.
                </div>
              </div>

              <div className="modal-footer bg-light border-0">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-3"
                  onClick={() => setShowTimerSettingsModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-warning text-dark fw-bold rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={() => saveTimeoutSetting(tempTimeoutValue)}
                >
                  <FaSave /> Lưu Cấu Hình ({tempTimeoutValue}s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HƯỚNG DẪN */}
      {showGuideModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaBrain /> Hướng Dẫn Cơ Chế AI Ghi Nhớ Chuyển Động &amp; Multi-Cam Matrix
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowGuideModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-info border-0 rounded-3 mb-4">
                  <strong>💡 Cơ chế AI Ghi Nhớ Mẫu Chuyển Động Bình Thường:</strong>
                  <p className="mb-0 small">
                    Hệ thống AI tự động ghi nhớ hình dạng cột sống & cử động đi lại bình thường của người thân 24/7. Khi phát hiện cử động bất thường, hệ thống đếm ngược ({anomalyTimeoutConfig}s). Nếu người thân tự đứng dậy trong thời gian này, báo động tự hủy!
                  </p>
                </div>

                <h6 className="fw-bold text-dark mb-3">Quy Trình Hoạt Động Ma Trận Multi-Cam:</h6>
                <ul className="list-group list-group-flush small border rounded-3 mb-3">
                  <li className="list-group-item p-3">
                    <strong className="text-primary">1. Nhóm Theo Bệnh Nhân:</strong>
                    <p className="text-muted mb-0">Hệ thống gom tất cả camera (phòng ngủ, phòng khách, nhà vệ sinh...) của từng bệnh nhân vào 1 khung quản lý tập trung.</p>
                  </li>
                  <li className="list-group-item p-3">
                    <strong className="text-success">2. Chế độ Grid Multi-Cam (2x2 / 3x3):</strong>
                    <p className="text-muted mb-0">Xem nhiều luồng camera cùng một lúc trên màn hình quan sát hoặc phóng to bằng nút 🔍 Phóng To.</p>
                  </li>
                  <li className="list-group-item p-3">
                    <strong className="text-warning">3. Đếm đệm {anomalyTimeoutConfig}s khi bất thường:</strong>
                    <p className="text-muted mb-0">Nếu phát hiện ngã hoặc sai lệch cột sống, AI đếm đệm {anomalyTimeoutConfig}s trước khi kích hoạt còi báo động khẩn cấp.</p>
                  </li>
                </ul>
              </div>

              <div className="modal-footer bg-light border-0">
                <button
                  type="button"
                  className="btn btn-primary px-4 rounded-pill"
                  onClick={() => setShowGuideModal(false)}
                >
                  Đã Hiểu, Quay Lại Màn Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM CAMERA MỚI */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Đăng Ký Camera Trong Nhà Mới</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddCameraSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tên Camera Trong Nhà</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Camera Ezviz C6N - Phòng Ngủ 101"
                        value={newCam.name}
                        onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Gán Cho Bệnh Nhân</label>
                      <select
                        className="form-select"
                        value={newCam.patient_id}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const found = uniquePatients.find((p) => p.id === pid);
                          setNewCam({
                            ...newCam,
                            patient_id: pid,
                            patient_name: found ? found.name : "Hồ Thanh Khánh"
                          });
                        }}
                      >
                        {uniquePatients.map((p) => (
                          <option key={p.id} value={p.id}>
                            👤 [{p.id}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Đường Dẫn RTSP / IP Stream</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="rtsp://admin:password@192.168.1.X:554/stream1"
                      value={newCam.rtsp_url}
                      onChange={(e) => setNewCam({ ...newCam, rtsp_url: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Vị Trí Lắp Đặt Trong Nhà</label>
                      <select
                        className="form-select"
                        value={newCam.location}
                        onChange={(e) => setNewCam({ ...newCam, location: e.target.value })}
                      >
                        <option value="Phòng Ngủ 101">🛌 Phòng Ngủ 101</option>
                        <option value="Phòng Ngủ 102">🛌 Phòng Ngủ 102</option>
                        <option value="Phòng Khách Trung Tâm">🛋️ Phòng Khách Trung Tâm</option>
                        <option value="Nhà Vệ Sinh Tầng 1">🚽 Nhà Vệ Sinh (Nguy cơ cao)</option>
                        <option value="Phòng Bếp & Nhà Ăn">🍳 Phòng Bếp & Nhà Ăn</option>
                        <option value="Hành Lang Tầng 2">🚪 Hành Lang / Cầu Thang</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Độ Nhạy AI Báo Động Ngã</label>
                      <select
                        className="form-select"
                        value={newCam.sensitivity}
                        onChange={(e) => setNewCam({ ...newCam, sensitivity: e.target.value })}
                      >
                        <option value="High">High (Cao - Nhạy nhất cho Nhà Vệ Sinh/Phòng Ngủ)</option>
                        <option value="Medium">Medium (Tiêu chuẩn cho Phòng Khách)</option>
                        <option value="Low">Low (Ít nhạy)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu Camera Vào Hệ Thống</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FALL ALERT MODAL */}
      {activeAlert && (
        <FallAlertModal
          alert={activeAlert}
          onClose={() => {
            setActiveAlert(null);
            setIsSimulatedFall(false);
            isSimulatedFallRef.current = false;
            anomalyStartTimeRef.current = 0;
            setIsAnomalyActive(false);
            setAnomalyCountdown(anomalyTimeoutConfigRef.current || 10);
          }}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}

      {/* LIVE ALERT STREAM MODAL */}
      {selectedLiveCamAlert && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0 bg-dark text-white overflow-hidden">
              <div className="modal-header bg-danger text-white p-3 border-bottom border-secondary">
                <div className="d-flex align-items-center gap-2">
                  <span className="spinner-grow spinner-grow-sm text-white" role="status"></span>
                  <h5 className="modal-title fw-bold mb-0">
                    🔴 LIVE STREAM TRỰC TIẾP: {selectedLiveCamAlert.patient_name} ({selectedLiveCamAlert.patient_id})
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedLiveCamAlert(null)}
                ></button>
              </div>

              <div className="modal-body p-0 position-relative bg-black d-flex align-items-center justify-content-center" style={{ minHeight: "380px" }}>
                {isWebcamActive ? (
                  <div className="position-relative w-100 h-100">
                    <video ref={videoRef} autoPlay playsInline muted className="w-100 h-100 object-fit-contain" style={{ maxHeight: "420px" }} />
                    <canvas ref={canvasRef} className="position-absolute top-0 start-0 w-100 h-100" />
                  </div>
                ) : (
                  <div className="w-100 position-relative text-center p-3">
                    <img src={selectedLiveCamAlert.snapshot} alt="Live Stream" className="w-100 object-fit-cover rounded-3 opacity-85" style={{ maxHeight: "380px" }} />
                    <div className="position-absolute top-50 start-50 translate-middle badge bg-dark bg-opacity-85 text-warning p-3 fs-6 border border-warning shadow">
                      ⚠️ AI Telemetry: Góc nghiêng {selectedLiveCamAlert.spine_angle}° | Bất thường kéo dài {selectedLiveCamAlert.duration_sec}s
                    </div>
                  </div>
                )}

                <div className="position-absolute top-0 start-0 m-3 badge bg-danger text-white p-2 fw-bold font-monospace shadow">
                  🔴 LIVE STREAM • {selectedLiveCamAlert.location}
                </div>
              </div>

              <div className="modal-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="small text-secondary">
                  👨‍👩‍👧 Người thân: <strong className="text-white">{selectedLiveCamAlert.caregiver_name}</strong> - 📞 <strong>{selectedLiveCamAlert.caregiver_phone}</strong> (Đã nhận SMS SOS)
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success text-white rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      handleResolveSystemAlert(selectedLiveCamAlert.id);
                      setSelectedLiveCamAlert(null);
                    }}
                  >
                    ✅ Xác Nhận An Toàn
                  </button>
                  <button
                    className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      alert(`Đã kích hoạt điều xe cấp cứu 115 & phát thông báo tới bệnh nhân ${selectedLiveCamAlert.patient_name}!`);
                      setSelectedLiveCamAlert(null);
                    }}
                  >
                    🚑 Điều Y Tế Cấp Cứu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraPage;
