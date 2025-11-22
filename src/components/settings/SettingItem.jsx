import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingItem = ({
    icon: Icon,
    title,
    description,
    type = 'button',
    value,
    onChange,
    onClick,
    options = [],
    isLocked = false,
    onLockClick,
    customContent
}) => {

    const handleInteraction = (e) => {
        // Se è un selettore o uno switch, non vogliamo attivare il click del div
        // a meno che non clicchiamo fuori dall'input.
        if (type === 'select') return;

        console.log(`Click rilevato su: ${title} (Tipo: ${type})`);

        if (isLocked) {
            if (onLockClick) onLockClick();
            return;
        }

        if (type === 'button' && onClick) {
            onClick();
        } else if (type === 'toggle' && onChange) {
            onChange(!value);
        }
    };

    return (
        <div
            onClick={handleInteraction}
            className={`
        group flex items-center justify-between p-4 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0
        ${(type === 'button' || type === 'toggle' || isLocked) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
        ${isLocked ? 'opacity-75' : ''}
      `}
        >
            <div className="flex items-center gap-4 flex-1">
                <div className={`
          p-2 rounded-lg transition-colors
          ${isLocked
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                    }
        `}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
                        {isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                    {description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pl-4">
                {customContent}

                {isLocked ? (
                    <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium text-gray-500">
                        Premium
                    </div>
                ) : (
                    <>
                        {/* TOGGLE SWITCH */}
                        {type === 'toggle' && (
                            <div className={`
                w-11 h-6 rounded-full transition-colors relative pointer-events-none
                ${value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                                <motion.div
                                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                    animate={{ x: value ? 20 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </div>
                        )}

                        {/* SELECT DROPDOWN */}
                        {type === 'select' && (
                            <select
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300 cursor-pointer"
                                onClick={(e) => e.stopPropagation()} // Importante: ferma il click per non attivare il div padre
                            >
                                {options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}

                        {/* FRECCIA PER I BOTTONI */}
                        {type === 'button' && !customContent && (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SettingItem;