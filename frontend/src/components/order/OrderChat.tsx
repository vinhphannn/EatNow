'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  senderType: 'customer' | 'driver' | 'restaurant';
  senderId: string;
  message: string;
  at: string;
}

export default function OrderChat({ orderId, token, role }: { orderId: string; token: string; role: 'customer' | 'driver' | 'restaurant' }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const wsUrl = useMemo(() => (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000') : ''), []);

  useEffect(() => {
    if (!orderId || !token) return;
    const s = io(wsUrl, { transports: ['websocket', 'polling'], withCredentials: true, auth: { token } });
    setSocket(s);
    s.on('connect', () => {
      setConnected(true);
      s.emit('join_order', orderId);
    });
    s.on('disconnect', () => setConnected(false));
    s.on('order_chat_history:v1', (payload: any) => {
      if (payload?.orderId === orderId && Array.isArray(payload?.messages)) {
        setMessages(payload.messages as ChatMessage[]);
      }
    });
    s.on('order_chat_message:v1', (payload: any) => {
      if (payload?.orderId === orderId && payload?.message) {
        setMessages(prev => [...prev, { senderType: payload.senderType, senderId: payload.senderId, message: payload.message, at: payload.at }]);
      }
    });
    return () => { try { s.emit('leave_order', orderId); } catch {} s.disconnect(); };
  }, [orderId, token, wsUrl]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socket || !connected) return;
    socket.emit('order_chat_send', { orderId, message: text });
    setInput('');
  };

  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col h-80">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">Trò chuyện với tài xế</div>
        <div className={`text-xs ${connected ? 'text-green-600' : 'text-gray-400'}`}>{connected ? 'Đang kết nối' : 'Mất kết nối'}</div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className={`max-w-[80%] ${m.senderType === role ? 'ml-auto text-right' : ''}`}>
            <div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.senderType === role ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <div>{m.message}</div>
              <div className="text-[10px] opacity-70 mt-1">{new Date(m.at).toLocaleTimeString('vi-VN')}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button onClick={sendMessage} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">Gửi</button>
      </div>
    </div>
  );
}


