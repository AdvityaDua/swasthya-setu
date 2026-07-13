import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! I am your AI assistant. How can I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Try fetching user location on mount
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Geolocation denied or unavailable.", error);
                }
            );
        }
    }, []);

    const token = useSelector((state) => state.user.token);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Send request to backend
            const payload = { message: userMsg };
            if (location.lat && location.lng) {
                payload.latitude = location.lat;
                payload.longitude = location.lng;
            }

            const response = await fetch('http://127.0.0.1:8000/api/chatbot/query/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error.' }]);
            }
        } catch (error) {
            console.error('Chatbot API Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to the server.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-80 sm:w-[350px] h-[500px] mb-4 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot size={24} />
                            <h3 className="font-semibold text-lg">AI Assistant</h3>
                        </div>
                        <button onClick={toggleChat} className="text-blue-100 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, ...props }) => (
                                                    <Link 
                                                        to={props.href} 
                                                        className="inline-block mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                        {...props}
                                                    >
                                                        {props.children}
                                                    </Link>
                                                )
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex flex-row gap-2 items-end">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
                        <div className="flex gap-2 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={!inputValue.trim() || isLoading}
                                className="absolute right-1 top-1 bottom-1 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                                <Send size={16} className="ml-0.5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={toggleChat}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:-translate-y-1"
                >
                    <MessageSquare size={28} />
                </button>
            )}
        </div>
    );
}
