'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    showToast: (title: string, type?: Toast['type'], message?: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            toasts: [],
            addToast: () => {},
            removeToast: () => {},
            showToast: () => {},
            success: () => {},
            error: () => {},
            info: () => {},
            warning: () => {},
        } as ToastContextType;
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { ...toast, id }]);
        const duration = toast.duration ?? 5000;
        if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
    const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
    const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message, duration: 8000 }), [addToast]);
    const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
    const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message, duration: 7000 }), [addToast]);
    const showToast = useCallback((title: string, type?: Toast['type'], message?: string) => addToast({ type: type || 'info', title, message }), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-[400px]">
                {toasts.map((toast, index) => {
                    const icons = {
                        success: <CheckCircle size={20} className="text-green-400" />,
                        error: <AlertCircle size={20} className="text-red-400" />,
                        info: <Info size={20} className="text-blue-400" />,
                        warning: <AlertTriangle size={20} className="text-yellow-400" />,
                    };
                    const backgrounds = {
                        success: 'border-green-500/30 bg-green-500/10',
                        error: 'border-red-500/30 bg-red-500/10',
                        info: 'border-blue-500/30 bg-blue-500/10',
                        warning: 'border-yellow-500/30 bg-yellow-500/10',
                    };
                    return (
                        <div key={toast.id} className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slideInRight ${backgrounds[toast.type]}`}
                            style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{toast.title}</p>
                                {toast.message && <p className="text-xs text-gray-400 mt-1">{toast.message}</p>}
                            </div>
                            <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
