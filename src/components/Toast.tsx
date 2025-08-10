'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-md p-4 flex items-center space-x-3 shadow-sm animate-in slide-in-from-top-1`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className={`${textColor} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${iconColor} hover:opacity-70 transition-opacity`}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  const showToast = (type: 'success' | 'error', message: string, duration?: number) => {
    setToast({ type, message, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <Toast {...toast} onClose={hideToast} />
  ) : null;

  return {
    showToast,
    ToastComponent,
  };
}