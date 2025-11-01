'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastContextType {
  showToast: (
    message: string, 
    type?: 'success' | 'error' | 'info' | 'warning', 
    options?: { 
      durationMs?: number;
      title?: string;
    }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface Toast {
  id: string;
  message: string;
  title?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  durationMs: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info', 
    options?: { durationMs?: number; title?: string }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const durationMs = Math.max(1000, options?.durationMs ?? 5000);
    const newToast: Toast = { 
      id, 
      message, 
      title: options?.title,
      type, 
      visible: false, 
      durationMs 
    };

    setToasts(prev => [...prev, newToast]);

    // Trigger enter transition on next tick for smooth animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t));
      }, 10);
    });

    // Start exit after durationMs, then remove after transition
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 400); // Match transition duration
    }, durationMs);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 400); // Match transition duration
  };

  const getToastConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bgGradient: 'from-green-50 via-green-50/50 to-white',
          iconBg: 'bg-green-500',
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          bgGradient: 'from-red-50 via-red-50/50 to-white',
          iconBg: 'bg-red-500',
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          bgGradient: 'from-amber-50 via-amber-50/50 to-white',
          iconBg: 'bg-amber-500',
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          defaultTitle: 'Warning',
        };
      default: // info
        return {
          bgGradient: 'from-blue-50 via-blue-50/50 to-white',
          iconBg: 'bg-blue-500',
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          defaultTitle: 'Info',
        };
    }
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[60] space-y-3 flex flex-col items-end">
      {toasts.map(toast => {
        const config = getToastConfig(toast.type);
        return (
          <div
            key={toast.id}
            className={`relative max-w-sm w-full rounded-lg shadow-md bg-gradient-to-r ${config.bgGradient}`}
            style={{ 
              minWidth: '320px',
              transform: toast.visible ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
              opacity: toast.visible ? 1 : 0,
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
              willChange: 'transform, opacity',
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                      {toast.title || config.defaultTitle}
                    </h4>
                    {/* Message */}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {toast.message}
                    </p>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    aria-label="Đóng thông báo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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