import React from "react";
import { FaRobot, FaUser, FaCheckCircle, FaExclamationTriangle, FaHeartbeat } from "react-icons/fa";

function StructuredAIResponse({ message }) {
  const isAI = message.role === "assistant" || message.sender === "ai";

  // Simple markdown renderer for headers, bold, bullet points
  const renderFormattedText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="card-title-custom fs-6 text-primary mt-2 mb-2">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="section-title fs-6 text-white mt-2 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ")) {
        return (
          <div key={idx} className="d-flex align-items-start gap-2 mb-1">
            <span className="text-primary">•</span>
            <span className="body-text">{parseBold(line.replace("- ", ""))}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="py-1"></div>;
      }
      return <p key={idx} className="body-text mb-1">{parseBold(line)}</p>;
    });
  };

  const parseBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-white fw-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`d-flex gap-3 mb-3 ${isAI ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${isAI ? "bg-primary text-white" : "bg-secondary text-white"}`}
        style={{ width: "36px", height: "36px" }}
      >
        {isAI ? <FaRobot /> : <FaUser />}
      </div>

      {/* Message Bubble */}
      <div
        className="p-3 rounded-4"
        style={{
          maxWidth: "80%",
          backgroundColor: isAI ? "var(--bg-card-subtle)" : "rgba(59, 130, 246, 0.18)",
          border: `1px solid ${isAI ? "var(--border-color)" : "rgba(59, 130, 246, 0.4)"}`,
          color: "var(--text-main)"
        }}
      >
        {/* Header Title / Tag */}
        <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom border-secondary border-opacity-25 extra-small-text">
          <span className="fw-bold text-muted">{isAI ? "Trợ lý AI Gemini" : "Người dùng"}</span>
          <span className="text-muted font-monospace">{message.time || "Vừa xong"}</span>
        </div>

        {/* Content */}
        <div className="mt-2">
          {renderFormattedText(message.content || message.text)}
        </div>
      </div>
    </div>
  );
}

export default StructuredAIResponse;
