import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { useAppContext } from '../../context/AppContext';

const RepeatWeeksModal = ({ onConfirm, onClose }) => {
    const [weeks, setWeeks] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [step, setStep] = useState(1); // 1: Input, 2: Confirmation
    const { t, employees } = useAppContext();

    const handleNext = (e) => {
        e.preventDefault();
        const weeksNum = parseInt(weeks);
        if (!isNaN(weeksNum) && weeksNum > 0) {
            setStep(2);
        }
    };

    const handleConfirm = () => {
        console.log('RepeatWeeksModal: handleConfirm clicked', { weeks, selectedEmployee });
        const weeksNum = parseInt(weeks);
        if (!isNaN(weeksNum) && weeksNum > 0) {
            onConfirm(weeksNum, selectedEmployee);
            onClose();
        } else {
            console.error('RepeatWeeksModal: Invalid weeks input', weeks);
        }
    };

    return (
        <AnimatedModal title={step === 1 ? "Ripeti Pianificazione" : "Conferma Ripetizione"} onClose={onClose}>
            {step === 1 ? (
                <form onSubmit={handleNext} className="space-y-6 py-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-200 text-sm mb-4">
                        Copia automaticamente i turni della settimana corrente nelle settimane future per risparmiare tempo.
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            Numero di settimane
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="1"
                                max="52"
                                value={weeks}
                                onChange={(e) => setWeeks(e.target.value)}
                                placeholder="4"
                                required
                                className="w-24 p-4 text-center text-3xl font-bold bg-white dark:bg-dark-bg border-2 border-blue-500 dark:border-blue-500 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-blue-600 dark:text-blue-400"
                                autoFocus
                            />
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                Settimane future<br /> da pianificare
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            Applica A
                        </label>
                        <div className="relative">
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-medium text-gray-900 dark:text-white cursor-pointer"
                            >
                                <option value="all">Tutti i dipendenti (Team Completo)</option>
                                <option disabled>──────────</option>
                                {employees.filter(e => e.isActive).map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
                        >
                            Annulla
                        </button>
                        <motion.button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/30 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Continua
                        </motion.button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6 py-2">
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Confermi la sovrascrittura?</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                Stai per copiare i turni per <strong>{weeks} settimane</strong>.<br />
                                {selectedEmployee === 'all'
                                    ? "Tutti i turni futuri GIÀ PRESENTI in questo periodo verranno ELIMINATI e sostituiti."
                                    : "I turni futuri per il dipendente selezionato verranno ELIMINATI e sostituiti."}
                            </p>
                        </div>

                        <div className="w-full bg-white dark:bg-dark-bg p-3 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                            Questa operazione non è reversibile
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 px-2">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                        >
                            ← Indietro
                        </button>
                        <motion.button
                            type="button"
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg shadow-red-600/30 text-sm flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Check className="w-4 h-4" />
                            Conferma e Ripeti
                        </motion.button>
                    </div>
                </div>
            )}
        </AnimatedModal>
    );
};

export default RepeatWeeksModal;
