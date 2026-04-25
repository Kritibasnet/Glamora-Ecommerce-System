import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    useEffect(scrollToBottom, [messages]);

    const fetchMessages = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const token = localStorage.getItem('glamora_token');
        const content = input;
        setInput('');
        setLoading(true);

        try {
            await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            fetchMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthConsumer>
            {authValue => {
                if (!authValue.isAuthenticated || authValue.user?.role === 'admin') return null;

                return (
                    <WidgetContainer>
                        {!isOpen && (
                            <ChatBubble onClick={() => setIsOpen(true)}>
                                <i className="fas fa-comment-dots"></i>
                                {messages.some(m => !m.is_read && m.is_admin_reply) && <UnreadBadge />}
                            </ChatBubble>
                        )}

                        {isOpen && (
                            <ChatWindow>
                                <ChatHeader>
                                    <span>Chat with us</span>
                                    <button onClick={() => setIsOpen(false)}>&times;</button>
                                </ChatHeader>
                                <MessageList>
                                    {messages.map((msg, index) => (
                                        <MessageItem key={index} isAdmin={msg.is_admin_reply}>
                                            <div className="content">{msg.content}</div>
                                            <div className="time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </MessageItem>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </MessageList>
                                <ChatInput onSubmit={handleSend}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button type="submit" disabled={loading}>
                                        <i className="fas fa-paper-plane"></i>
                                    </button>
                                </ChatInput>
                            </ChatWindow>
                        )}
                    </WidgetContainer>
                );
            }}
        </AuthConsumer>
    );
};

const WidgetContainer = styled.div`
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
`;

const ChatBubble = styled.div`
    width: 60px;
    height: 60px;
    background: var(--mainPink);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    transition: transform 0.3s ease;
    position: relative;

    &:hover {
        transform: scale(1.1);
    }
`;

const UnreadBadge = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 15px;
    height: 15px;
    background: #ff4757;
    border-radius: 50%;
    border: 2px solid white;
`;

const ChatWindow = styled.div`
    width: 350px;
    height: 450px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const ChatHeader = styled.div`
    background: var(--mainPink);
    color: white;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;

    button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    }
`;

const MessageList = styled.div`
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8f9fa;
`;

const MessageItem = styled.div`
    max-width: 80%;
    padding: 10px 15px;
    border-radius: 15px;
    align-self: ${props => props.isAdmin ? 'flex-start' : 'flex-end'};
    background: ${props => props.isAdmin ? '#e9ecef' : 'var(--mainPink)'};
    color: ${props => props.isAdmin ? 'black' : 'white'};
    position: relative;

    .content {
        font-size: 0.9rem;
    }

    .time {
        font-size: 0.7rem;
        margin-top: 5px;
        opacity: 0.7;
        text-align: right;
    }
`;

const ChatInput = styled.form`
    padding: 15px;
    display: flex;
    gap: 10px;
    border-top: 1px solid #eee;

    input {
        flex: 1;
        border: 1px solid #ddd;
        padding: 8px 15px;
        border-radius: 20px;
        outline: none;

        &:focus {
            border-color: var(--mainPink);
        }
    }

    button {
        background: var(--mainPink);
        color: white;
        border: none;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.1);
        }
    }
`;

export default ChatWidget;
