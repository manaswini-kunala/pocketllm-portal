import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Send, Plus, Trash2, Menu, Settings, LogOut, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface Session {
    id: string;
    title: string;
}

const Chat: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [persona, setPersona] = useState('Default');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (currentSessionId) {
            fetchMessages(currentSessionId);
        } else {
            setMessages([]);
        }
    }, [currentSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/sessions');
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: 'temp-' + Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat', {
                prompt: userMsg.content,
                sessionId: currentSessionId,
                persona
            });

            if (!currentSessionId) {
                setCurrentSessionId(res.data.sessionId);
                fetchSessions(); // Refresh list to show new session
            }

            setMessages(prev => {
                // Replace temp message if we wanted to be strict, but appending assistant is fine
                // Actually, let's just append the assistant message.
                // Ideally we'd replace the temp ID with real ID but for UI it doesn't matter much here.
                return [...prev, res.data.message];
            });
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Error: Could not get response.' }]);
        } finally {
            setLoading(false);
        }
    };

    const createNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
    };

    const deleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;
        try {
            await api.delete(`/sessions/${id}`);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (currentSessionId === id) {
                createNewChat();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <div className={clsx(
                "bg-gray-900 text-white flex-shrink-0 transition-all duration-300 flex flex-col",
                sidebarOpen ? "w-64" : "w-0"
            )}>
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h1 className="font-bold text-xl truncate">PocketLLM</h1>
                </div>

                <div className="p-4">
                    <button
                        onClick={createNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md transition"
                    >
                        <Plus size={18} /> New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => setCurrentSessionId(session.id)}
                            className={clsx(
                                "p-3 rounded-md cursor-pointer flex items-center justify-between group hover:bg-gray-800 transition",
                                currentSessionId === session.id ? "bg-gray-800" : ""
                            )}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate text-sm">{session.title}</span>
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400 truncate">{user.email}</span>
                    </div>
                    <div className="flex gap-2">
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 p-2 rounded text-xs"
                            >
                                <Settings size={14} /> Admin
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-900/50 hover:bg-red-900 p-2 rounded text-xs"
                        >
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="bg-white shadow-sm p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900">
                            <Menu size={24} />
                        </button>
                        <h2 className="font-semibold text-gray-800">
                            {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || 'Chat' : 'New Conversation'}
                        </h2>
                    </div>
                    <select
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        className="border-gray-300 rounded-md text-sm p-1 border focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="Default">Default Persona</option>
                        <option value="Formal">Formal</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Technical">Technical</option>
                    </select>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>Start a new conversation...</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={clsx(
                            "flex w-full",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}>
                            <div className={clsx(
                                "max-w-[80%] rounded-lg p-4 shadow-sm",
                                msg.role === 'user'
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                            )}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-500 border border-gray-200 rounded-lg p-4 rounded-bl-none shadow-sm">
                                <div className="flex gap-1">
                                    <span className="animate-bounce">●</span>
                                    <span className="animate-bounce delay-100">●</span>
                                    <span className="animate-bounce delay-200">●</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full pr-12 pl-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <span className="text-xs text-gray-400">Powered by Hugging Face Inference</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
