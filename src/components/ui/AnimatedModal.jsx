import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AnimatedModal = ({
    isOpen = true,
    onClose,
    title,
    children,
    maxWidth = 'max-w-2xl',
    showCloseButton = true
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                        mass: 0.8
                    }}
                    className={`relative bg-white dark:bg-dark-surface rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden z-10 border border-gray-100 dark:border-dark-border flex flex-col`}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className={`flex items-center justify-between p-6 pb-2 shrink-0 ${title ? '' : 'absolute right-0 top-0 z-20'}`}>
                            {title && (
                                <motion.h2
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"
                                >
                                    {title}
                                </motion.h2>
                            )}
                            {showCloseButton && (
                                <motion.button
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors text-gray-500 dark:text-gray-400 backdrop-blur-sm"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="overflow-y-auto overflow-x-hidden p-6 pt-2"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AnimatedModal;
