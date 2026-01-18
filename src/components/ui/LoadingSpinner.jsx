import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center transition-colors">
        <div className="text-center">
            <motion.div
                className="inline-block h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{ loop: Infinity, ease: "linear", duration: 1 }}
            >
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
        </div>
    </div>
);

export default LoadingSpinner;
