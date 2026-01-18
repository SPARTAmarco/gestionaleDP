import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 5000, id }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - (100 / (duration / 100));
                if (newProgress <= 0) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [duration, onClose]);

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-600 dark:text-green-400',
            textColor: 'text-green-900 dark:text-green-100',
            progressColor: 'bg-green-600 dark:bg-green-400'
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-600 dark:text-red-400',
            textColor: 'text-red-900 dark:text-red-100',
            progressColor: 'bg-red-600 dark:bg-red-400'
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'border-orange-200 dark:border-orange-800',
            iconColor: 'text-orange-600 dark:text-orange-400',
            textColor: 'text-orange-900 dark:text-orange-100',
            progressColor: 'bg-orange-600 dark:bg-orange-400'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textColor: 'text-blue-900 dark:text-blue-100',
            progressColor: 'bg-blue-600 dark:bg-blue-400'
        }
    };

    const { icon: Icon, bgColor, borderColor, iconColor, textColor, progressColor } = config[type] || config.success;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.3, x: 100 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, scale: 0.5, transition: { duration: 0.2 } }}
            className={`relative flex items-start gap-3 p-4 rounded-xl shadow-lg border ${bgColor} ${borderColor} min-w-[320px] max-w-md overflow-hidden`}
        >
            {/* Icon */}
            <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />

            {/* Message */}
            <div className={`flex-1 ${textColor} text-sm font-medium leading-relaxed`}>
                {message}
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className={`${iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <motion.div
                    className={`h-full ${progressColor}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );
};

// Toast Container Component
export const ToastContainer = ({ toasts = [], onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            {...toast}
                            onClose={() => onClose(toast.id)}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Hook for managing toasts
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 5000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return { toasts, addToast, removeToast };
};

export default Toast;
