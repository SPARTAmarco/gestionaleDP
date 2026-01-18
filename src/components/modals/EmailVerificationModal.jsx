import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';

const EmailVerificationModal = ({ message, onClose }) => {
    return (
        <AnimatedModal title="Verifica Email" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300 text-lg">
                    {message}
                </p>
                <div className="pt-4 flex justify-center">
                    <motion.button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Ho capito
                    </motion.button>
                </div>
            </div>
        </AnimatedModal>
    );
};

export default EmailVerificationModal;
