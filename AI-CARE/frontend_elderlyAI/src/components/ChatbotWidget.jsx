// ==============================================================================
// GIAO DIỆN NÚT VÀ CỬA SỔ CHATBOT AI NỔI (CHATBOTWIDGET.JSX)
// ==============================================================================
// Mô tả: Component Chatbot Widget kết nối trực tiếp với Backend Flask API.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

export default function ChatbotWidget({ apiUrl = 'http://localhost:5000/api/chatbot/chat' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Xin chào! Tôi là Trợ lý AI CARE Gemini. Tôi có thể giúp gì cho sức khỏe của bạn hôm nay?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        // Thêm tin nhắn của user vào danh sách
        const newMessages = [...messages, { sender: 'user', text: trimmed }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({ message: trimmed })
            });

            const data = await res.json();
            if (!res.ok && !data.reply) throw new Error(data.error || 'Có lỗi xảy ra.');

            const botReply = data.reply || data.answer || '🤖 AI đã phản hồi.';
            setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
        } catch (err) {
            setMessages((prev) => [...prev, { sender: 'bot', text: `⚠️ Lỗi: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-care-widget-container">
            {/* Nút Chat tròn nổi ở góc màn hình */}
            <button
                className="ai-care-widget-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Mở khung Chatbot"
            >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
            </button>

            {/* Cửa sổ Chatbot hiện ra khi nhấn vào nút */}
            <div className={`ai-care-widget-window ${isOpen ? 'open' : ''}`}>
                <div className="ai-care-header">
                    <div className="ai-care-header-title">
                        <span className="ai-care-status-dot"></span>
                        <span>AI CARE Assistant</span>
                    </div>
                    <button className="ai-care-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                </div>

                <div className="ai-care-body" ref={chatBodyRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`ai-care-msg ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="ai-care-msg bot loading">
                            Gemini AI đang suy nghĩ...
                        </div>
                    )}
                </div>

                <form className="ai-care-footer" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="ai-care-input"
                        placeholder="Nhập câu hỏi của bạn..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="ai-care-send-btn" disabled={isLoading}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
