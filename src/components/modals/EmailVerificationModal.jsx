import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';

const EmailVerificationModal = ({ message, onClose }) => {
    return (
        <AnimatedModal title="Verifica Email" onClose={onClose}>
            <div className="space-y-6 py-2">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-inner">
                        <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Controlla la tua posta</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex justify-center w-full">
                    <motion.button
                        onClick={onClose}
                        className="w-full px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/30 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Ho capito, grazie
                    </motion.button>
                </div>
            </div>
        </AnimatedModal>
    );
};

export default EmailVerificationModal;
