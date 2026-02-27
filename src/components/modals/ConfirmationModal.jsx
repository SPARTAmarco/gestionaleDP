import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Conferma Azione',
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    variant = 'danger' // 'danger' | 'warning' | 'info'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
        },
        warning: {
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/30',
        },
        info: {
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
        }
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-dark-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 pb-2">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                                <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm font-medium">
                            {message}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
                        >
                            {cancelText}
                        </button>
                        <motion.button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-bold shadow-lg text-sm ${styles.buttonBg}`}
                        >
                            {confirmText}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
