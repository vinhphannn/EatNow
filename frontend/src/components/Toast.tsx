'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', options?: { durationMs?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  durationMs: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', options?: { durationMs?: number }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const durationMs = Math.max(1000, options?.durationMs ?? 5000);
    const newToast: Toast = { id, message, type, visible: false, durationMs };

    setToasts(prev => [...prev, newToast]);

    // Trigger enter transition on next tick
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t));
    }, 20);

    // Start exit after durationMs, then remove after transition
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, durationMs);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[60] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 ease-out ${
            toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          } ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white/90 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}