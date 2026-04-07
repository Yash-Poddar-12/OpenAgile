import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-mint" />,
  error: <XCircle className="w-5 h-5 text-danger" />,
  info: <Info className="w-5 h-5 text-blue" />,
  warning: <AlertCircle className="w-5 h-5 text-warning" />,
};

const BORDERS = {
  success: 'border-mint',
  error: 'border-danger',
  info: 'border-blue',
  warning: 'border-warning',
};

const ToastItem = ({ toast, remove }) => {
  return (
    <div className={`
      flex items-start gap-3 p-4 min-w-[300px] max-w-md w-full
      bg-card shadow-card rounded-xl border-l-[4px] ${BORDERS[toast.type] || BORDERS.info}
      animate-slide-in transition-all duration-300 pointer-events-auto
    `}>
      <div className="flex-shrink-0 mt-0.5">
        {ICONS[toast.type] || ICONS.info}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{toast.message}</p>
      </div>
      <button 
        onClick={() => remove(toast.id)}
        className="flex-shrink-0 text-muted hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} remove={removeToast} />
      ))}
    </div>
  );
};

export default Toast;
