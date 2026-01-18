import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, ClipboardList, Search, Inbox, AlertCircle } from 'lucide-react';

const EmptyState = ({
    type = 'generic',
    title,
    description,
    action,
    actionLabel,
    icon: CustomIcon,
    className = ''
}) => {
    // Predefined empty state configurations
    const presets = {
        employees: {
            icon: Users,
            title: 'Nessun Dipendente',
            description: 'Inizia aggiungendo il tuo primo dipendente al team.',
            iconColor: 'text-blue-500'
        },
        shifts: {
            icon: Calendar,
            title: 'Nessun Turno Programmato',
            description: 'Non ci sono turni per questo periodo. Aggiungi il primo turno per iniziare.',
            iconColor: 'text-purple-500'
        },
        requests: {
            icon: ClipboardList,
            title: 'Nessuna Richiesta',
            description: 'Non ci sono richieste pendenti. Tutto in ordine!',
            iconColor: 'text-green-500'
        },
        search: {
            icon: Search,
            title: 'Nessun Risultato',
            description: 'Non abbiamo trovato nessun risultato per la tua ricerca. Prova con termini diversi.',
            iconColor: 'text-gray-500'
        },
        inbox: {
            icon: Inbox,
            title: 'Tutto Pulito!',
            description: 'Non hai notifiche da visualizzare.',
            iconColor: 'text-blue-500'
        },
        error: {
            icon: AlertCircle,
            title: 'Qualcosa è Andato Storto',
            description: 'Si è verificato un errore durante il caricamento dei dati.',
            iconColor: 'text-red-500'
        },
        generic: {
            icon: Inbox,
            title: 'Nessun Elemento',
            description: 'Non ci sono elementi da visualizzare.',
            iconColor: 'text-gray-400'
        }
    };

    const preset = presets[type] || presets.generic;
    const Icon = CustomIcon || preset.icon;
    const finalTitle = title || preset.title;
    const finalDescription = description || preset.description;
    const iconColor = preset.iconColor;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
        >
            {/* Animated Icon Container */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="mb-6"
            >
                <div className="relative">
                    {/* Background Circle */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.15, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className={`absolute inset-0 rounded-full bg-current ${iconColor} opacity-20`}
                        style={{ width: '100px', height: '100px', margin: '-10px' }}
                    />

                    {/* Icon */}
                    <div className={`relative w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border`}>
                        <Icon className={`w-10 h-10 ${iconColor}`} strokeWidth={1.5} />
                    </div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-gray-900 dark:text-white mb-2"
            >
                {finalTitle}
            </motion.h3>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed"
            >
                {finalDescription}
            </motion.p>

            {/* Action Button */}
            {action && actionLabel && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={action}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
};

export default EmptyState;
