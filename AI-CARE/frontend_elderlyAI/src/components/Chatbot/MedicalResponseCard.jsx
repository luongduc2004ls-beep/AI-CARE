import React from "react";
import {
  FaHeartbeat,
  FaPills,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserCheck,
  FaVideo,
  FaCheckCircle,
  FaTimesCircle,
  FaFileMedical,
  FaEye,
  FaExternalLinkAlt
} from "react-icons/fa";
import { Link } from "react-router-dom";

function MedicalResponseCard({ message, onConfirmAction, onCancelAction }) {
  const isAI = message.sender === "ai" || message.role === "assistant";
  const text = message.text || message.content || "";

  const renderFormattedBlocks = (rawText) => {
    if (!rawText) return null;
    const sections = rawText.split(/(?=### )/g);

    return sections.map((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return null;

      // 1. Vitals Header / Evaluation Block
      if (trimmed.startsWith("### 🩺")) {
        const title = trimmed.split("\n")[0].replace("### ", "");
        const body = trimmed.split("\n").slice(1).join("\n");
        return (
          <div key={idx} className="p-3 mb-3 rounded-3 border border-primary border-opacity-25" style={{ backgroundColor: "var(--bg-card-subtle)" }}>
            <div className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
              <FaHeartbeat /> {title}
            </div>
            <div className="small lh-base" style={{ color: "var(--text-main)" }}>{parseLines(body)}</div>
          </div>
        );
      }

      // 2. Health Insight Block
      if (trimmed.startsWith("### 📌")) {
        const title = trimmed.split("\n")[0].replace("### ", "");
        const body = trimmed.split("\n").slice(1).join("\n");
        return (
          <div key={idx} className="p-3 mb-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card-subtle)", borderColor: "var(--border-color)" }}>
            <div className="fw-bold mb-1" style={{ color: "var(--text-heading)" }}>{title}</div>
            <div className="small lh-base text-muted">{parseLines(body)}</div>
          </div>
        );
      }

      // 3. Nutrition & Caregiver Advice Block
      if (trimmed.startsWith("### 🍽️")) {
        const title = trimmed.split("\n")[0].replace("### ", "");
        const body = trimmed.split("\n").slice(1).join("\n");
        return (
          <div key={idx} className="p-3 mb-3 rounded-3 border border-success border-opacity-25" style={{ backgroundColor: "var(--summary-success-bg)" }}>
            <div className="fw-bold text-success mb-2">{title}</div>
            <div className="small lh-base" style={{ color: "var(--text-main)" }}>{parseLines(body)}</div>
          </div>
        );
      }

      // 4. Medical Red Flags & Safety Warning Block
      if (trimmed.startsWith("### ⚠️")) {
        const title = trimmed.split("\n")[0].replace("### ", "");
        const body = trimmed.split("\n").slice(1).join("\n");
        return (
          <div key={idx} className="p-3 mb-3 rounded-3 border border-danger border-opacity-25" style={{ backgroundColor: "var(--summary-danger-bg)" }}>
            <div className="fw-bold text-danger mb-2 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {title}
            </div>
            <div className="small lh-base" style={{ color: "var(--text-main)" }}>{parseLines(body)}</div>
          </div>
        );
      }

      // 5. Patient Profile or Search Block with Actions
      if (trimmed.startsWith("### 👤") || trimmed.startsWith("### 🔍") || trimmed.startsWith("### 💊") || trimmed.startsWith("### ⏰") || trimmed.startsWith("### 🫁") || trimmed.startsWith("### 📊") || trimmed.startsWith("### 🏥") || trimmed.startsWith("### 📹") || trimmed.startsWith("### ❌")) {
        const title = trimmed.split("\n")[0].replace("### ", "");
        const body = trimmed.split("\n").slice(1).join("\n");
        return (
          <div key={idx} className="p-3 mb-3 rounded-3 border shadow-sm" style={{ backgroundColor: "var(--bg-card-subtle)", borderColor: "var(--border-color)" }}>
            <div className="fw-bold mb-2 fs-6" style={{ color: "var(--text-heading)" }}>{title}</div>
            <div className="small lh-base" style={{ color: "var(--text-main)" }}>{parseLines(body)}</div>
          </div>
        );
      }

      // Default Block
      return (
        <div key={idx} className="mb-2 small lh-base" style={{ color: "var(--text-main)" }}>
          {parseLines(trimmed.replace(/^### /, ""))}
        </div>
      );
    });
  };

  const parseLines = (textChunk) => {
    return textChunk.split("\n").map((line, lIdx) => {
      const clean = line.trim();
      if (!clean) return <div key={lIdx} className="py-1"></div>;
      
      // Numbered patient result line: "1. Nguyễn Văn An(1) (PAT10000) — Tuổi: 71 • ..."
      const numMatch = clean.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const patCodeMatch = clean.match(/\b(PAT\d+)\b/);
        const patCode = patCodeMatch ? patCodeMatch[1] : null;

        return (
          <div key={lIdx} className="p-2 mb-2 rounded-2 border d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1">{numMatch[1]}</span>
              <div>{parseBold(numMatch[2])}</div>
            </div>
            {patCode && (
              <div className="d-flex gap-1">
                <Link to={`/elderly?patient=${patCode}`} className="btn btn-outline-primary btn-sm py-0 px-2 extra-small-text" title="Xem hồ sơ bệnh án">
                  <FaFileMedical className="me-1" /> Hồ sơ
                </Link>
                <Link to={`/health?patient=${patCode}`} className="btn btn-outline-success btn-sm py-0 px-2 extra-small-text" title="Xem sinh hiệu">
                  <FaHeartbeat className="me-1" /> Sinh hiệu
                </Link>
              </div>
            )}
          </div>
        );
      }

      if (clean.startsWith("- ")) {
        return (
          <div key={lIdx} className="d-flex align-items-start gap-2 mb-1">
            <span className="text-primary fw-bold">•</span>
            <span>{parseBold(clean.replace("- ", ""))}</span>
          </div>
        );
      }
      return <p key={lIdx} className="mb-1">{parseBold(clean)}</p>;
    });
  };

  const parseBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="fw-bold" style={{ color: "var(--text-heading)" }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isAI) {
    return (
      <div className="d-flex justify-content-end mb-3">
        <div className="p-3 rounded-4 bg-primary text-white shadow-sm" style={{ maxWidth: "80%" }}>
          <div className="small">{text}</div>
          <div className="extra-small-text text-white-50 mt-1 text-end">{message.time || "Vừa xong"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-start mb-3">
      <div className="p-3 p-md-4 rounded-4 shadow-sm w-100" style={{ maxWidth: "94%", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {renderFormattedBlocks(text)}

        {/* Confirmation Dialog Footer if required */}
        {message.require_confirmation && (
          <div className="mt-3 pt-3 border-top d-flex gap-2 justify-content-end" style={{ borderColor: "var(--border-color)" }}>
            <button className="btn btn-outline-secondary btn-sm px-3 rounded-pill" onClick={onCancelAction}>
              <FaTimesCircle className="me-1" /> Hủy bỏ
            </button>
            <button className="btn btn-danger btn-sm px-3 rounded-pill fw-bold" onClick={() => onConfirmAction?.(message.action_target)}>
              <FaCheckCircle className="me-1" /> Xác nhận thực hiện
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top extra-small-text text-muted" style={{ borderColor: "var(--border-color)" }}>
          <span>ElderlyCare AI Health Companion</span>
          <span>{message.time || "Vừa xong"}</span>
        </div>
      </div>
    </div>
  );
}

export default MedicalResponseCard;
