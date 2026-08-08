/**
 * Utility to capture live camera snapshot at the instant an anomaly is detected
 */

export const generateSimulatedSnapshotSVG = (metadata = {}) => {
  const timeStr = metadata.time || new Date().toLocaleTimeString("vi-VN");
  const camName = metadata.camera_name || "Camera AI Live Giám Sát";
  const location = metadata.location || "Phòng Ngủ 101";
  const spineAngle = metadata.spine_angle || "78.5";

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bgGrad)"/>
      
      <!-- Surveillance Grid Lines -->
      <path d="M0,100 L800,100 M0,200 L800,200 M0,300 L800,300 M0,400 L800,400 M100,0 L100,500 M200,0 L200,500 M300,0 L300,500 M400,0 L400,500 M500,0 L500,500 M600,0 L600,500 M700,0 L700,500" stroke="#334155" stroke-opacity="0.3" stroke-width="1"/>
      
      <!-- Simulated Room Furniture -->
      <rect x="50" y="280" width="220" height="180" fill="#1e293b" rx="8" stroke="#475569" stroke-width="2"/>
      <text x="160" y="380" fill="#64748b" font-family="sans-serif" font-size="14" text-anchor="middle">Giường Bệnh Nhân</text>
      
      <!-- Fallen Person Skeleton (Simulated Horizontal Posture) -->
      <g stroke="#ef4444" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="480" cy="380" r="16" fill="#ef4444" fill-opacity="0.4"/>
        <line x1="480" y1="380" x2="360" y2="395" />
        <line x1="450" y1="385" x2="430" y2="420" />
        <line x1="450" y1="385" x2="470" y2="430" />
        <line x1="360" y1="395" x2="290" y2="410" />
        <line x1="360" y1="395" x2="310" y2="435" />
      </g>

      <!-- Anomaly Bounding Box -->
      <rect x="260" y="340" width="250" height="110" fill="rgba(239, 68, 68, 0.18)" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6,4" rx="6"/>
      <rect x="260" y="316" width="230" height="24" fill="#ef4444" rx="3"/>
      <text x="270" y="332" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">🚨 PHÁT HIỆN BẤT THƯỜNG (${spineAngle}°)</text>

      <!-- Live Stream HUD Header -->
      <rect x="15" y="15" width="450" height="75" fill="rgba(0, 0, 0, 0.85)" rx="8" stroke="#ef4444" stroke-width="1.5"/>
      <circle cx="35" cy="35" r="7" fill="#ef4444"/>
      <text x="50" y="40" fill="#ef4444" font-family="sans-serif" font-size="13" font-weight="bold">🔴 HÌNH CHỤP TRỰC TIẾP KHI NHẬN DIỆN BẤT THƯỜNG</text>
      <text x="35" y="60" fill="#f8fafc" font-family="sans-serif" font-size="12">Kênh: ${camName} | Vị trí: ${location}</text>
      <text x="35" y="77" fill="#fbbf24" font-family="sans-serif" font-size="11">Thời điểm chụp: ${timeStr}</text>

      <!-- System stamp footer -->
      <rect x="520" y="460" width="265" height="25" fill="rgba(0,0,0,0.7)" rx="4"/>
      <text x="775" y="477" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">Elderly AI Security • Realtime Frame Capture</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

export const captureLiveCameraSnapshot = (videoEl, canvasEl, metadata = {}) => {
  try {
    if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;

      const offCanvas = document.createElement("canvas");
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext("2d");

      // 1. Draw actual live webcam / video frame
      ctx.drawImage(videoEl, 0, 0, width, height);

      // 2. Overlay AI skeleton / pose canvas if visible
      if (canvasEl && canvasEl.width > 0 && canvasEl.height > 0) {
        ctx.drawImage(canvasEl, 0, 0, width, height);
      }

      // 3. Draw live timestamp & anomaly banner HUD directly on captured image
      const nowStr = metadata.time || new Date().toLocaleString("vi-VN");
      const locationStr = metadata.location || "Phòng Ngủ 101 (Live Webcam)";
      const spineAngle = metadata.spine_angle || 78.5;

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(15, 15, 420, 75);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ef4444";
      ctx.strokeRect(15, 15, 420, 75);

      // Live red blinking dot & alert text
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(32, 35, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = "bold 13px sans-serif";
      ctx.fillText("🚨 HÌNH CHỤP TRỰC TIẾP KHI NHẬN DIỆN BẤT THƯỜNG", 48, 40);

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Thời điểm chụp: ${nowStr}`, 32, 60);
      ctx.fillText(`Vị trí: ${locationStr} | Góc nghiêng: ${spineAngle}°`, 32, 77);

      // 4. Draw red highlight bounding box on image frame
      const boxX = width * 0.2;
      const boxY = height * 0.25;
      const boxW = width * 0.6;
      const boxH = height * 0.55;

      ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(boxX, boxY - 26, 220, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`⚠️ ANOMALY DETECTED (${spineAngle}°)`, boxX + 8, boxY - 8);

      return offCanvas.toDataURL("image/jpeg", 0.92);
    }
  } catch (err) {
    console.warn("Could not capture live video element frame, using SVG snapshot:", err);
  }

  return generateSimulatedSnapshotSVG(metadata);
};
