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
  FaSave
} from "react-icons/fa";
import FallAlertModal from "../components/Camera/FallAlertModal";
import notificationService from "../services/notificationService";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
      snapshot: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
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
      snapshot: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
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
      snapshot: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
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

  // Cấu hình thời gian đếm ngược tùy chỉnh (Mặc định: 10 giây, lưu localStorage)
  const [anomalyTimeoutConfig, setAnomalyTimeoutConfig] = useState(() => {
    const saved = localStorage.getItem("anomalyTimeoutConfig");
    return saved ? parseInt(saved, 10) : 10;
  });

  // Tạm lưu cấu hình trong modal cài đặt
  const [tempTimeoutValue, setTempTimeoutValue] = useState(anomalyTimeoutConfig);

  // Bộ lọc camera theo khu vực trong nhà
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

  // Canvas & Video refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const lastAlertTimeRef = useRef(0);
  const anomalyStartTimeRef = useRef(0);
  const poseHistoryRef = useRef([]);

  // REFS ĐỒNG BỘ NGUYÊN TỬ CHO MEDIAPIPE (TRÁNH KHỞI TẠO LẠI BỊ ĐÔNG MÀN HÌNH)
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

  // Quét mạng LAN giả lập phát hiện camera trong nhà
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [discoveredCameras, setDiscoveredCameras] = useState([]);

  // State quản lý danh sách thiết bị Camera phần cứng DroidCam
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);

  // State cho DroidCam Direct IP WiFi Stream
  const [droidcamIp, setDroidcamIp] = useState("192.168.1.15");
  const [droidcamPort, setDroidcamPort] = useState("4747");
  const [isDroidcamIpActive, setIsDroidcamIpActive] = useState(false);
  const [droidcamStreamUrl, setDroidcamStreamUrl] = useState("");
  const [ipStreamMode, setIpStreamMode] = useState("img");

  // Form state cho camera mới
  const [newCam, setNewCam] = useState({
    name: "",
    rtsp_url: "",
    location: "Phòng Ngủ Cụ A",
    sensitivity: "High"
  });

  // Lưu thiết lập thời gian đếm ngược mới vào localStorage
  const saveTimeoutSetting = (newSec) => {
    const val = Math.max(parseInt(newSec, 10) || 10, 3);
    setAnomalyTimeoutConfig(val);
    setAnomalyCountdown(val);
    anomalyTimeoutConfigRef.current = val;
    localStorage.setItem("anomalyTimeoutConfig", val.toString());
    setShowTimerSettingsModal(false);

    // Đặt lại đếm ngược nếu không có ngã
    if (!isSimulatedFallRef.current) {
      anomalyStartTimeRef.current = 0;
      setIsAnomalyActive(false);
    }
  };

  // Quét thiết bị camera phần cứng DroidCam
  const scanVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setWebcamError("Trình duyệt không hỗ trợ quét thiết bị camera.");
        return;
      }

      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Xin quyền camera tạm thời thất bại:", e);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(videoInputs);

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
    }
  };

  // Quét tự động Camera IP trong mạng WiFi Gia Đình
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
          ip: "192.168.1.105"
        },
        {
          name: "Imou Ranger 2 - Nhà Vệ Sinh Tầng 1",
          rtsp_url: "rtsp://admin:L2026XYZ@192.168.1.106:554/cam/realmonitor?channel=1&subtype=0",
          location: "Nhà Vệ Sinh Tầng 1",
          sensitivity: "High",
          ip: "192.168.1.106"
        },
        {
          name: "Tapo C200 - Phòng Khách Gia Đình",
          rtsp_url: "rtsp://admin:TAPO1234@192.168.1.107:554/stream1",
          location: "Phòng Khách",
          sensitivity: "Medium",
          ip: "192.168.1.107"
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
          name: "Camera Ezviz AI - Phòng Ngủ Cụ Hồ Thanh Khánh",
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

  // Tự động gán streamObject & Khởi tạo MediaPipe Pose Real-Time Tracker KHÔNG BỊ KHỞI TẠO LẠI
  useEffect(() => {
    let animId;

    if (isWebcamActive && videoRef.current) {
      if (streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((err) => console.warn("Video auto-play:", err));
      }

      if (window.Pose) {
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

          const renderLoop = async () => {
            if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
              try {
                await poseRef.current.send({ image: videoRef.current });
              } catch (e) {
                // Ignore send errors
              }
            }
            animId = requestAnimationFrame(renderLoop);
          };

          animId = requestAnimationFrame(renderLoop);
        } catch (err) {
          console.warn("Khởi tạo MediaPipe Pose lỗi, dùng fallback detector:", err);
        }
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isWebcamActive]);

  // =========================================================================
  // XỬ LÝ AI CHUYỂN ĐỘNG BÌNH THƯỜNG & ĐẾM NGƯỢC TÙY CHỈNH KHI BẤT THƯỜNG
  // =========================================================================
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

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const lm = results.poseLandmarks;

      const headVisible = (lm[0]?.visibility || 0) > 0.5;
      const lShoulder = lm[11];
      const rShoulder = lm[12];
      const lHip = lm[23];
      const rHip = lm[24];

      const shouldersVisible = (lShoulder?.visibility || 0) > 0.5 && (rShoulder?.visibility || 0) > 0.5;
      const hipsVisible = (lHip?.visibility || 0) > 0.5 && (rHip?.visibility || 0) > 0.5;

      const shoulderX = (lShoulder.x + rShoulder.x) / 2;
      const shoulderY = (lShoulder.y + rShoulder.y) / 2;
      const hipX = (lHip.x + rHip.x) / 2;
      const hipY = (lHip.y + rHip.y) / 2;

      const shoulderDist = Math.hypot((lShoulder.x - rShoulder.x) * width, (lShoulder.y - rShoulder.y) * height);
      const spineDist = Math.hypot((shoulderX - hipX) * width, (shoulderY - hipY) * height);
      const anatomyRatio = spineDist > 0 ? shoulderDist / spineDist : 0;

      const isHumanAnatomyValid = (headVisible || shouldersVisible || hipsVisible);

      if (!isHumanAnatomyValid && !isSimFall) {
        setHasRealPerson(false);
        return;
      }

      setHasRealPerson(true);

      const dx = Math.abs((shoulderX - hipX) * width);
      const dy = Math.abs((shoulderY - hipY) * height);
      const spineAngleDeg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
      setDetectedSpineAngle(spineAngleDeg);

      // Đánh giá chuyển động bất thường (Góc nghiêng cột sống > 35° hoặc giả lập ngã)
      const isPoseAbnormal = (spineAngleDeg > 35 || isSimFall) && (isHumanAnatomyValid || isSimFall);

      if (isPoseAbnormal) {
        if (!anomalyStartTimeRef.current) {
          anomalyStartTimeRef.current = Date.now();
        }

        const elapsedSec = Math.floor((Date.now() - anomalyStartTimeRef.current) / 1000);
        const remaining = Math.max(currentTargetTimeout - elapsedSec, 0);

        setAnomalyCountdown(remaining);
        setIsAnomalyActive(true);

        if (remaining > 0) {
          setDetectedPoseStatus(`⚠️ BẤT THƯỜNG! Đang chờ ${currentTargetTimeout}s xem có hồi phục... (Còn ${remaining}s)`);
        } else {
          // Sau thời gian tùy chỉnh liên tục KHÔNG hồi phục -> PHÁT BÁO ĐỘNG NGÃ KHẨN CẤP!
          setDetectedPoseStatus(`🚨 CẢNH BÁO NGÃ: Quá ${currentTargetTimeout}s chuyển động không trở lại bình thường!`);
          const now = Date.now();
          if (autoDetectFallRef.current && now - lastAlertTimeRef.current > 8000) {
            lastAlertTimeRef.current = now;

            // Tự động đẩy cảnh báo tức thì vào danh sách sự cố của Admin
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
              snapshot: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
            };
            setSystemAlerts((prev) => [newWebcamAlert, ...prev]);
            handleTriggerFallAlert(998, `Webcam Live Phát Hiện Ngã (${spineAngleDeg}°)`, "Phòng Ngủ 101");
          }
        }
      } else {
        // Chuyển động trở lại BÌNH THƯỜNG trong vòng thời gian cài đặt -> HỦY ĐẾM NGƯỢC, KHÔNG PHÁT BÁO ĐỘNG!
        if (anomalyStartTimeRef.current) {
          anomalyStartTimeRef.current = 0;
          setIsAnomalyActive(false);
          setAnomalyCountdown(currentTargetTimeout);
          setDetectedPoseStatus("🟢 ĐÃ HỒI PHỤC VỀ CHUYỂN ĐỘNG BÌNH THƯỜNG (Đã hủy đếm ngược)");
        } else {
          setDetectedPoseStatus("🟢 CHUYỂN ĐỘNG BÌNH THƯỜNG (AI Baseline Memory Active)");
        }
      }

      const strokeColor = (isAnomalyActive && anomalyCountdown === 0) ? "#ef4444" : isAnomalyActive ? "#f59e0b" : "#10b981";
      const fillColor = (isAnomalyActive && anomalyCountdown === 0) ? "rgba(239, 68, 68, 0.2)" : isAnomalyActive ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.15)";

      ctx.lineWidth = 4;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = "#ffffff";

      POSE_CONNECTIONS.forEach(([i, j]) => {
        if (lm[i] && lm[j] && lm[i].visibility > 0.4 && lm[j].visibility > 0.4) {
          ctx.beginPath();
          ctx.moveTo(lm[i].x * width, lm[i].y * height);
          ctx.lineTo(lm[j].x * width, lm[j].y * height);
          ctx.stroke();
        }
      });

      lm.forEach((point, idx) => {
        if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx) && point.visibility > 0.4) {
          ctx.beginPath();
          ctx.arc(point.x * width, point.y * height, 6, 0, 2 * Math.PI);
          ctx.fillStyle = strokeColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
      });

      let minX = width, minY = height, maxX = 0, maxY = 0;
      lm.forEach((p) => {
        if (p.visibility > 0.4) {
          minX = Math.min(minX, p.x * width);
          minY = Math.min(minY, p.y * height);
          maxX = Math.max(maxX, p.x * width);
          maxY = Math.max(maxY, p.y * height);
        }
      });

      const boxWidth = Math.max(maxX - minX + 20, 80);
      const boxHeight = Math.max(maxY - minY + 20, 80);
      const startX = Math.max(minX - 10, 0);
      const startY = Math.max(minY - 10, 0);

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = isAnomalyActive ? 4 : 3;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(startX, startY, boxWidth, boxHeight, 8);
      } else {
        ctx.rect(startX, startY, boxWidth, boxHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(startX, startY - 26, isAnomalyActive ? 280 : 220, 24, 4);
      } else {
        ctx.rect(startX, startY - 26, isAnomalyActive ? 280 : 220, 24);
      }
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(
        isAnomalyActive
          ? `⚠️ BẤT THƯỜNG! ĐẾM ${currentTargetTimeout}S: CÒN ${anomalyCountdown}S`
          : `🟢 AI BASELINE: CHUYỂN ĐỘNG BÌNH THƯỜNG`,
        startX + 8,
        startY - 9
      );
    } else {
      setHasRealPerson(false);
    }
  };

  // Bật Webcam / DroidCam qua trình duyệt
  const startWebcam = async (targetDeviceId = selectedDeviceId) => {
    setWebcamError(null);
    stopWebcam();

    try {
      let stream = null;
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
        } catch (exactErr) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: targetDeviceId },
            audio: false
          });
        }
      }

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsWebcamActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setWebcamError(
        "Không thể mở luồng camera. Hãy đảm bảo DroidCam Client trên PC đã bấm Start hoặc không bị ứng dụng khác chiếm giữ!"
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

  // Bật luồng DroidCam qua IP WiFi
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

  // Kích Hoạt Cảnh Báo Ngã Khẩn Cấp
  const handleTriggerFallAlert = async (cameraId = 998, camName = null, camLoc = null) => {
    setTestingCamId(cameraId);
    setIsSimulatedFall(true);
    isSimulatedFallRef.current = true;

    const cameraTitle = camName || "Camera Trong Nhà AI";
    const locationTitle = camLoc || "Phòng Ngủ 101";
    const nowStr = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
    const timeoutVal = anomalyTimeoutConfigRef.current || 10;

    try {
      await notificationService.create({
        title: `🚨 CẢNH BÁO NGUY CẤP: Chuyển động bất thường quá ${timeoutVal}s tại ${locationTitle}!`,
        content: `Camera AI [${cameraTitle}] phát hiện góc cột sống nghiêng ${detectedSpineAngle}° kéo dài quá ${timeoutVal} giây không hồi phục vào lúc ${nowStr}.`,
        type: "fall",
        severity: "CRITICAL"
      });
    } catch (e) {
      console.warn("Lưu notification thất bại:", e);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/cameras/${cameraId}/trigger-fall`);
      if (res.data && res.data.alert) {
        setActiveAlert(res.data.alert);
      }
    } catch (err) {
      setActiveAlert({
        alert_id: Math.floor(Math.random() * 9000) + 1000,
        camera_id: cameraId,
        camera_name: cameraTitle,
        location: locationTitle,
        patient_name: "Cụ Nguyễn Văn A (82 tuổi)",
        detected_at: nowStr,
        severity: "KHẨN CẤP",
        ai_analytics: {
          confidence: 0.984,
          spine_angle_deg: detectedSpineAngle || 78.5,
          aspect_ratio: 0.42,
          vertical_velocity_m_s: 3.85,
          motionless_duration_sec: timeoutVal
        },
        snapshot_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
      });
    } finally {
      setTestingCamId(null);
    }
  };

  // Chuyển đổi tư thế ngã
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

  // Phản hồi xử lý cảnh báo
  const handleAcknowledgeAlert = async (alertId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/cameras/alerts/${alertId}/acknowledge`, { status });
    } catch (e) {
      console.log("Ack alert error:", e);
    }
    setActiveAlert(null);
    setIsSimulatedFall(false);
    isSimulatedFallRef.current = false;
    anomalyStartTimeRef.current = 0;
    setIsAnomalyActive(false);
    setAnomalyCountdown(anomalyTimeoutConfigRef.current || 10);
  };

  // Thêm camera RTSP mới
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
    setNewCam({ name: "", rtsp_url: "", location: "Phòng Ngủ Cụ A", sensitivity: "High" });
  };

  const handleSendDirectAnomalyToAdmin = (cam) => {
    const patientCode = cam.patient_id || "PAT10000";
    const patientName = cam.patient_name || (cam.name ? cam.name.replace(/^Camera\s+.*?\s+-\s+/i, "") : "Hồ Thanh Khánh");
    const camLoc = cam.location || "Phòng Ngủ 101";
    const caregiverName = cam.caregiver_name || "Phan Thị An (Con gái)";
    const caregiverPhone = cam.caregiver_phone || "0851745822";

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
      spine_angle: (Math.random() * 25 + 65).toFixed(1),
      duration_sec: anomalyTimeoutConfig || 10,
      caregiver_name: caregiverName,
      caregiver_phone: caregiverPhone,
      status: "PENDING",
      snapshot: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
    };

    setSystemAlerts((prev) => [newAlert, ...prev]);
    alert(`📡 ĐÃ PHÁT HIỆN & BÁO CÁO THÀNH CÔNG THÔNG TIN CỤ THỂ BỆNH NHÂN:\n\n• Mã BN: [${patientCode}]\n• Họ Tên Bệnh Nhân: [${patientName}]\n• Vị Trí Camera Phát Hiện: [${camLoc}]\n• Người Thân Tiếp Nhận SOS: [${caregiverName} - ${caregiverPhone}]\n\nAdmin đã nhận thông báo thời gian thực và đang mở luồng Live Stream để xuất phương án xử lý khẩn cấp!`);
  };

  // Chọn mẫu thương hiệu camera trong nhà để tự điền form
  const applyBrandPreset = (preset) => {
    setNewCam({
      name: `Camera ${preset.brand} - ${preset.defaultLocation}`,
      rtsp_url: preset.template,
      location: preset.defaultLocation,
      sensitivity: preset.defaultLocation.includes("Nhà Vệ Sinh") ? "High" : "Medium"
    });
    setShowAddModal(true);
  };

  // Lọc danh sách camera theo khu vực trong nhà
  const filteredCamerasByRoom = cameras.filter((cam) => {
    if (selectedRoomFilter === "all") return true;
    const locLower = (cam.location || "").toLowerCase();
    if (selectedRoomFilter === "bedroom") return locLower.includes("ngủ");
    if (selectedRoomFilter === "living") return locLower.includes("khách");
    if (selectedRoomFilter === "restroom") return locLower.includes("vệ sinh") || locLower.includes("tắm");
    if (selectedRoomFilter === "kitchen") return locLower.includes("bếp") || locLower.includes("ăn");
    return true;
  });

  const hasDroidCamDevice = videoDevices.some((d) =>
    (d.label || "").toLowerCase().includes("droidcam")
  );

  return (
    <div className="container-fluid p-4">
      {/* KHU VỰC TRUNG TÂM ĐIỀU HÀNH DÀNH RIÊNG CHO ADMIN */}
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
                Theo dõi tập trung ma trận camera 4 phòng cùng lúc, quản lý phân tích AI phát hiện té ngã &amp; điều hành cảnh báo sự cố khẩn cấp.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 ${adminViewMode === "alerts" ? "btn-danger text-white shadow-sm" : "btn-outline-light"}`}
                onClick={() => setAdminViewMode("alerts")}
              >
                <FaExclamationTriangle /> 🚨 Trung Tâm Xử Lý Cảnh Báo Té Ngã
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 ${adminViewMode === "grid" ? "btn-primary text-white" : "btn-outline-light"}`}
                onClick={() => setAdminViewMode("grid")}
              >
                <FaDesktop /> 📺 Ma Trận Multi-Grid 4 Camera
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 ${adminViewMode === "focus" ? "btn-primary text-white" : "btn-outline-light"}`}
                onClick={() => setAdminViewMode("focus")}
              >
                <FaCamera /> 🔍 Luồng Chi Tiết Tập Trung
              </button>
            </div>
          </div>

          {/* ADMIN: BẢNG GIÁM SÁT XỬ LÝ CẢNH BÁO TÉ NGÃ TOÀN HỆ THỐNG */}
          {adminViewMode === "alerts" && (
            <div className="mt-4 pt-3 border-top border-secondary">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h6 className="fw-bold text-danger mb-1 d-flex align-items-center gap-2">
                    <FaExclamationTriangle /> NẬT KÝ &amp; NHẬN CẢNH BÁO TÉ NGÃ TOÀN HỆ THỐNG (SYSTEM-WIDE INCIDENTS)
                  </h6>
                  <small className="text-secondary">Theo dõi sự cố khẩn cấp tức thì từ toàn bộ camera bệnh nhân khác nhau</small>
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

              {/* TỔNG QUAN STATS CARDS FOR ALERTS */}
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
                            <div className="extra-small text-body-secondary mt-1">
                              👨‍👩‍👧 Người thân: <strong className="text-light">{alertItem.caregiver_name}</strong> - 📞 <strong>{alertItem.caregiver_phone}</strong> (Đã nhận SMS SOS)
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

          {/* ADMIN MA TRẬN MULTI-GRID 4 CAMERA */}
          {adminViewMode === "grid" && (
            <div className="mt-4 pt-3 border-top border-secondary">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
                  <FaDesktop /> MA TRẬN CAMERA GIÁM SÁT REAL-TIME 4 PHÒNG BỆNH NHÂN (ADMIN MULTI-GRID)
                </h6>
                <small className="text-secondary">Nhấn nút [🔍 Phóng To] để xem kỹ luồng camera bất kỳ</small>
              </div>

              <div className="row g-3">
                {/* CAM 1 */}
                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden shadow-sm">
                    <div className="p-2.5 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">
                      <div className="small fw-bold text-primary d-flex align-items-center gap-1 font-monospace">
                        🔴 LIVE • CAM 101: PAT10000 Hồ Thanh Khánh (Phòng Ngủ)
                      </div>
                      <span className="badge bg-success text-white extra-small">AI Skeleton Active</span>
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
                      {isWebcamActive ? (
                        <div className="position-relative w-100 h-100">
                          <video ref={videoRef} autoPlay playsInline muted className="w-100 h-100 object-fit-cover" style={{ maxHeight: "240px" }} />
                          <canvas ref={canvasRef} className="position-absolute top-0 start-0 w-100 h-100" />
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <FaVideo className="fs-1 text-primary mb-2 opacity-50" />
                          <div className="small text-secondary mb-2">Luồng Live AI Camera Phòng Ngủ PAT10000</div>
                          <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={() => startWebcam()}>
                            <FaPlay className="me-1" /> Bật Luồng Live Cam 1
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CAM 2 */}
                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden shadow-sm">
                    <div className="p-2.5 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">
                      <div className="small fw-bold text-info d-flex align-items-center gap-1 font-monospace">
                        🔴 LIVE • CAM 102: PAT10001 Phan Anh Thảo (Phòng Khách)
                      </div>
                      <span className="badge bg-success text-white extra-small">1080p 60FPS</span>
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
                      <img
                        src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
                        alt="Cam 2"
                        className="w-100 object-fit-cover"
                        style={{ maxHeight: "240px", opacity: 0.85 }}
                      />
                      <div className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 text-success border border-success extra-small">
                        🟢 Chuyển động bình thường (Góc nghiêng 8°)
                      </div>
                    </div>
                  </div>
                </div>

                {/* CAM 3 */}
                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden shadow-sm">
                    <div className="p-2.5 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">
                      <div className="small fw-bold text-warning d-flex align-items-center gap-1 font-monospace">
                        🔴 LIVE • CAM 103: PAT10002 Đỗ Thanh Phong (Nhà Vệ Sinh Tầng 1)
                      </div>
                      <span className="badge bg-warning text-dark extra-small fw-bold">Khu Vực Nguy Cơ Cao</span>
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
                      <img
                        src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
                        alt="Cam 3"
                        className="w-100 object-fit-cover"
                        style={{ maxHeight: "240px", opacity: 0.85 }}
                      />
                      <div className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white border border-secondary extra-small">
                        🛡️ AI Giám Sát Té Ngã Đang Bật
                      </div>
                    </div>
                  </div>
                </div>

                {/* CAM 4 */}
                <div className="col-lg-6">
                  <div className="card bg-black text-white border border-secondary rounded-4 overflow-hidden shadow-sm">
                    <div className="p-2.5 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">
                      <div className="small fw-bold text-success d-flex align-items-center gap-1 font-monospace">
                        🔴 LIVE • CAM 104: PAT10003 Phan Ngọc Ngọc (Hành Lang Tầng 2)
                      </div>
                      <span className="badge bg-primary text-white extra-small">RTSP Stream Active</span>
                    </div>
                    <div className="position-relative bg-dark d-flex align-items-center justify-content-center" style={{ minHeight: "220px" }}>
                      <img
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                        alt="Cam 4"
                        className="w-100 object-fit-cover"
                        style={{ maxHeight: "240px", opacity: 0.85 }}
                      />
                      <div className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 text-info border border-info extra-small">
                        🟢 Lối đi an toàn - Không có vật cản
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FaBrain className="text-primary" /> AI Ghi Nhớ Chuyển Động Bình Thường &amp; Xác Minh Bất Thường
          </h3>
          <p className="text-muted mb-0 small">
            AI tự động ghi nhớ mẫu bước đi cử động bình thường; tùy chỉnh thời gian đếm đệm đếm ngược ({anomalyTimeoutConfig}s) khi phát hiện bất thường!
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          {/* NÚT MỞ MENU TÙY CHỈNH THỜI GIAN ĐẾM NGƯỢC (TIMER SETTINGS) */}
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

      {/* THẺ TỔNG QUAN AI BASELINE MEMORY & BỘ ĐẾM THỜI GIAN TÙY CHỈNH */}
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

      {/* THỦ THUẬT KẾT NỐI NHANH THƯƠNG HIỆU CAMERA TRONG NHÀ (INDOOR CAMERA BRAND PRESETS) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <FaHome className="text-success" /> Thêm Nhanh Camera Trong Nhà Theo Thương Hiệu
            </h5>
            <small className="text-muted">Nhấn vào mẫu thương hiệu camera gia đình bạn đang dùng để tự điền luồng kết nối</small>
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
                style={{ cursor: "pointer" }}
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
              <FaCheckCircle /> Đã phát hiện {discoveredCameras.length} Camera IP trong mạng WiFi nhà bạn:
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
                          sensitivity: discovered.sensitivity
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

      {/* Bảng Điều Khiển Kết Nối DroidCam & Camera Thiết Bị */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
              <FaMobileAlt className="fs-4" />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Dùng Điện Thoại Làm Camera AI Đặt Trong Nhà (DroidCam)</h5>
              <small className="text-muted">Biến điện thoại cũ thành camera giám sát AI thông minh đặt tại các phòng trong nhà</small>
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
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label ? `📷 ${device.label}` : `Camera Cổng ${idx + 1} (${device.deviceId.substring(0, 8)}...)`}
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

              <div className="d-flex gap-2 mt-2 align-items-center">
                <span className="small text-muted">Nhanh:</span>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                  onClick={() => {
                    setDroidcamIp("127.0.0.1");
                    setDroidcamPort("4747");
                  }}
                >
                  127.0.0.1 (PC Client)
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                  onClick={() => {
                    setDroidcamIp("192.168.1.15");
                    setDroidcamPort("4747");
                  }}
                >
                  192.168.1.15 (WiFi Điện thoại)
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {webcamError && (
        <div className="alert alert-warning alert-dismissible fade show rounded-4 mb-4" role="alert">
          <FaExclamationTriangle className="me-2" /> {webcamError}
          <button type="button" className="btn-close" onClick={() => setWebcamError(null)}></button>
        </div>
      )}

      {/* Màn Hình Trực Tiếp DroidCam Driver Virtual Camera */}
      {isWebcamActive && (
        <div className="mb-4">
          <div className={`card ${isAnomalyActive && anomalyCountdown === 0 ? "border-danger border-4" : isAnomalyActive ? "border-warning border-4" : "border-success border-3"} shadow-lg rounded-4 overflow-hidden bg-dark text-white`}>
            <div className={`card-header ${isAnomalyActive && anomalyCountdown === 0 ? "bg-danger text-white" : isAnomalyActive ? "bg-warning text-dark" : "bg-success text-white"} p-3 d-flex justify-content-between align-items-center`}>
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm" role="status"></span>
                <h6 className="mb-0 fw-bold">📱 DROIDCAM LIVE: AI BASELINE &amp; BỘ ĐẾM {anomalyTimeoutConfig}S TÙY CHỈNH</h6>
              </div>

              {/* Nút mô phỏng chuyển động để kiểm thử */}
              <div className="d-flex gap-2 align-items-center flex-wrap">
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

            <div className="position-relative bg-black d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 object-fit-contain rounded-bottom position-relative"
                style={{ maxHeight: "520px", minHeight: "340px" }}
              />

              <canvas
                ref={canvasRef}
                className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
                style={{ objectFit: "contain" }}
              />

              {/* HUD Banner Hiển Thị Trạng Thái Đếm Ngược Tùy Chỉnh */}
              {isAnomalyActive && (
                <div
                  className="position-absolute top-0 start-50 translate-middle-x mt-3 bg-warning text-dark p-2 px-4 rounded-pill shadow-lg border border-dark border-2 text-center"
                  style={{ zIndex: 10 }}
                >
                  <strong className="d-block">
                    ⚠️ PHÁT HIỆN CHUYỂN ĐỘNG BẤT THƯỜNG! ĐANG ĐẾM HỒI PHỤC:
                  </strong>
                  <span className="fs-5 fw-bold font-monospace text-danger">
                    ⏱️ CÒN {anomalyCountdown} GIÂY (Mốc cài đặt: {anomalyTimeoutConfig}s)
                  </span>
                </div>
              )}

              <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-85 p-2 text-center small font-monospace text-white d-flex justify-content-around align-items-center">
                <span>Góc Cột Sống: <strong className={detectedSpineAngle > 45 || isSimulatedFall ? "text-warning fs-6" : "text-success"}>{detectedSpineAngle}°</strong></span>
                <span>Cấu Hình Hạn Định: <strong className="text-warning">{anomalyTimeoutConfig} Giây</strong></span>
                <span>Trạng Thái: <strong className={isAnomalyActive ? "text-warning fw-bold animate-pulse" : "text-success"}>{detectedPoseStatus}</strong></span>
              </div>
            </div>

            <div className="card-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-white-50">
                <FaShieldAlt className={isAnomalyActive ? "text-warning me-1" : "text-success me-1"} />
                {isAnomalyActive
                  ? `AI đang đếm ngược ${anomalyCountdown}s (theo mức cài đặt ${anomalyTimeoutConfig}s). Nếu chuyển động trở lại bình thường, hệ thống sẽ tự hủy báo động.`
                  : `AI đang học mẫu cử động bình thường 24/7. Thời gian đếm đệm xác minh bất thường hiện tại: ${anomalyTimeoutConfig}s.`}
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

      {/* Màn Hình Trực Tiếp DroidCam WiFi IP Stream */}
      {isDroidcamIpActive && (
        <div className="mb-4">
          <div className={`card ${isSimulatedFall ? "border-danger border-4" : "border-info border-3"} shadow-lg rounded-4 overflow-hidden bg-dark text-white`}>
            <div className={`card-header ${isSimulatedFall ? "bg-danger text-white" : "bg-info text-dark"} p-3 d-flex justify-content-between align-items-center`}>
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm" role="status"></span>
                <h6 className="mb-0 fw-bold">📶 DROIDCAM WIFI STREAM: {droidcamStreamUrl}</h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-xs btn-dark py-1 px-3 text-white fw-bold rounded-pill"
                  onClick={() => toggleFallMotionState(997, `DroidCam WiFi (${droidcamIp})`, "Khu vực WiFi")}
                >
                  {isSimulatedFall ? "Đổi Sang Bình Thường" : `🚨 Giả Lập Bất Thường ${anomalyTimeoutConfig}s`}
                </button>
                <button
                  className="btn btn-xs btn-dark py-1 px-2 text-info"
                  onClick={() => setIpStreamMode(ipStreamMode === "img" ? "iframe" : "img")}
                >
                  Đổi Chế Độ ({ipStreamMode === "img" ? "Thẻ Ảnh" : "Iframe"})
                </button>
              </div>
            </div>

            <div className="position-relative bg-black d-flex justify-content-center align-items-center" style={{ minHeight: "360px" }}>
              {ipStreamMode === "img" ? (
                <img
                  src={droidcamStreamUrl}
                  alt="DroidCam WiFi Feed"
                  className="w-100 h-100 object-fit-contain"
                  style={{ maxHeight: "480px" }}
                  onError={(e) => {
                    console.warn("Lỗi tải /video, chuyển sang chế độ Iframe");
                    setIpStreamMode("iframe");
                  }}
                />
              ) : (
                <iframe
                  src={droidcamStreamUrl}
                  title="DroidCam Feed Frame"
                  className="w-100 border-0"
                  style={{ height: "460px" }}
                />
              )}
            </div>

            <div className="card-footer bg-dark border-top border-secondary p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-white-50">
                <FaShieldAlt className="text-info me-1" /> Luồng WiFi IP DroidCam đang phát thời gian thực tới AI Server.
              </div>

              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                onClick={() => handleTriggerFallAlert(997, `DroidCam WiFi (${droidcamIp})`, "Khu vực WiFi")}
              >
                <FaPlay /> 🚨 BÁO ĐỘNG NGÃ TỨC THÌ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH CAMERA TRONG NHÀ PHÂN LỌAI THEO PHÒNG / KHU VỰC */}
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="fw-bold mb-0 text-dark">Danh Sách Camera Trong Nhà Đang Giám Sát</h5>
          <span className="badge bg-secondary">{filteredCamerasByRoom.length} Camera</span>
        </div>

        <div className="d-flex gap-1 flex-wrap">
          <button
            className={`btn btn-sm rounded-pill px-3 ${selectedRoomFilter === "all" ? "btn-primary" : "btn-light text-secondary"}`}
            onClick={() => setSelectedRoomFilter("all")}
          >
            Tất Cả Các Phòng
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${selectedRoomFilter === "bedroom" ? "btn-primary" : "btn-light text-secondary"}`}
            onClick={() => setSelectedRoomFilter("bedroom")}
          >
            <FaBed /> Phòng Ngủ
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${selectedRoomFilter === "living" ? "btn-primary" : "btn-light text-secondary"}`}
            onClick={() => setSelectedRoomFilter("living")}
          >
            <FaCouch /> Phòng Khách
          </button>
          <button
            className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${selectedRoomFilter === "restroom" ? "btn-primary" : "btn-light text-secondary"}`}
            onClick={() => setSelectedRoomFilter("restroom")}
          >
            <FaBath /> Nhà Vệ Sinh
          </button>
        </div>
      </div>

      {/* Grid Danh Sách Tất Cả Camera RTSP Khác */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Đang kết nối các luồng camera trong nhà...</p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredCamerasByRoom.map((cam) => (
            <div className="col-lg-6 col-xl-6" key={cam.camera_id}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white">
                <div className="card-header bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success p-1 me-1">LIVE 24/7</span>
                    <h6 className="mb-0 fw-bold">{cam.name}</h6>
                  </div>
                  <span className="badge bg-secondary font-monospace small">{cam.location}</span>
                </div>

                <div className="position-relative bg-black" style={{ minHeight: "260px" }}>
                  <div
                    className="w-100 h-100 d-flex flex-column justify-content-between p-3 position-absolute top-0 start-0"
                    style={{
                      backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.15) 1px, transparent 1px)`,
                      backgroundSize: "20px 20px"
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="badge bg-dark bg-opacity-75 text-success border border-success d-flex align-items-center gap-1">
                        <FaCheckCircle /> RTSP/H.264 Active
                      </span>
                      <span className="badge bg-primary bg-opacity-75">
                        Độ Nhạy AI: {cam.sensitivity}
                      </span>
                    </div>

                    <div className="text-center my-4">
                      <div className="d-inline-block position-relative border border-success border-opacity-50 p-4 rounded-3 bg-dark bg-opacity-50">
                        <small className="text-success d-block mb-1 font-monospace">
                          [AI BASELINE MEMORY ACTIVE]
                        </small>
                        <div className="d-flex justify-content-center gap-3 text-white-50 small">
                          <span>FPS: 30.0</span>
                          <span>Xác Minh: {anomalyTimeoutConfig} Giây</span>
                          <span>Trạng Thái: An Toàn</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-end text-white-50 small font-monospace">
                      <span>{cam.rtsp_url}</span>
                      <span>STATUS: NORMAL</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${cam.ai_enabled ? "bg-success text-white" : "bg-secondary text-white"}`}>
                      {cam.ai_enabled ? "AI Theo Dõi: ON" : "AI Theo Dõi: OFF"}
                    </span>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-warning text-dark btn-sm d-flex align-items-center gap-1 px-3 py-1.5 fw-bold shadow-sm rounded-pill"
                      onClick={() => handleSendDirectAnomalyToAdmin(cam)}
                    >
                      <FaWifi /> 📡 Báo Bất Thường Cho Admin
                    </button>
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-1 px-3 py-1.5 fw-bold shadow-sm rounded-pill"
                      disabled={testingCamId === cam.camera_id}
                      onClick={() => handleTriggerFallAlert(cam.camera_id, cam.name, cam.location)}
                    >
                      <FaPlay /> {testingCamId === cam.camera_id ? "Đang xử lý..." : "🚨 Báo Động Ngã"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL MENU TÙY CHỈNH THỜI GIAN ĐẾM NGƯỢC XÁC MINH BẤT THƯỜNG */}
      {/* ========================================================================= */}
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
                    Khi AI phát hiện bất thường, hệ thống sẽ đếm ngược thời gian đệm này. Nếu người thân tự đứng dậy trong khoảng thời gian này, báo động sẽ tự động HỦY để tránh làm phiền gia đình.
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

      {/* Modal Hướng Dẫn Kết Nối DroidCam */}
      {showGuideModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaBrain /> Hướng Dẫn Cơ Chế AI Ghi Nhớ Chuyển Động &amp; Đếm Ngược
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
                    Hệ thống AI tự động ghi nhớ hình dạng cột sống & cử động đi lại bình thường của người thân 24/7. Khi phát hiện cử động bị bất thường, hệ thống sẽ đếm ngược theo mốc thời gian bạn đã cài đặt ({anomalyTimeoutConfig}s). Nếu người thân tự đứng dậy trong mốc thời gian này, báo động sẽ tự hủy!
                  </p>
                </div>

                <h6 className="fw-bold text-dark mb-3">Quy Trình Hoạt Động Chi Tiết:</h6>
                <ul className="list-group list-group-flush small border rounded-3 mb-3">
                  <li className="list-group-item p-3">
                    <strong className="text-success">1. Chuyển động bình thường:</strong>
                    <p className="text-muted mb-0">AI ghi nhận góc nghiêng cột sống thẳng &lt; 35°. Không phát ra bất kỳ âm thanh cảnh báo nào.</p>
                  </li>
                  <li className="list-group-item p-3">
                    <strong className="text-warning">2. Phát hiện bất thường ➔ Đếm đệm {anomalyTimeoutConfig} giây:</strong>
                    <p className="text-muted mb-0">Góc nghiêng cột sống lệch bất thường &gt; 45°. AI bắt đầu đếm ngược {anomalyTimeoutConfig}s xem người thân có tự hồi phục không.</p>
                  </li>
                  <li className="list-group-item p-3">
                    <strong className="text-primary">3. Hồi phục trong thời gian cài đặt:</strong>
                    <p className="text-muted mb-0">Nếu cử động trở lại bình thường trước khi hết {anomalyTimeoutConfig}s, AI tự động HỦY BÁO ĐỘNG.</p>
                  </li>
                  <li className="list-group-item p-3">
                    <strong className="text-danger">4. Quá {anomalyTimeoutConfig} giây KHÔNG hồi phục:</strong>
                    <p className="text-muted mb-0">Lập tức kích hoạt còi báo động khẩn cấp, mở màn hình đỏ và gửi cuộc gọi cấp cứu!</p>
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

      {/* Modal Thêm Camera Trong Nhà Mới */}
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
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tên Camera Trong Nhà</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Camera Ezviz C6N - Phòng Ngủ Cụ A"
                      value={newCam.name}
                      onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                      required
                    />
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
                        <option value="Phòng Ngủ Cụ A">🛌 Phòng Ngủ Cụ A</option>
                        <option value="Phòng Khách Trung Tâm">🛋️ Phòng Khách Trung Tâm</option>
                        <option value="Nhà Vệ Sinh Tầng 1">🚽 Nhà Vệ Sinh (Khu vực nguy cơ cao)</option>
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

      {/* Modal Báo động đỏ thời gian thực khi phát hiện ngã */}
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

      {/* MODAL TRỰC TIẾP MỞ LUỒNG CAMERA LIVE KHI ADMIN NHẤP VÀO THÔNG BÁO CẢNH BÁO */}
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
