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
                <form onSubmit={handleNext} className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                        Per quante settimane future vuoi ripetere questa pianificazione?
                    </p>
                    <input
                        type="number"
                        min="1"
                        max="52"
                        value={weeks}
                        onChange={(e) => setWeeks(e.target.value)}
                        placeholder="Es. 1, 4, 8..."
                        required
                        className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-2xl font-bold"
                        autoFocus
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Per chi vuoi ripetere i turni?
                        </label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="all">Tutti i dipendenti</option>
                            {employees.filter(e => e.isActive).map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <motion.button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Annulla
                        </motion.button>
                        <motion.button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Continua
                        </motion.button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 flex gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <p className="font-bold mb-1">Attenzione: Sovrascrittura Dati</p>
                            <p>
                                Stai per copiare i turni per <strong>{weeks} settimane</strong>.
                                {selectedEmployee === 'all'
                                    ? " I turni esistenti in questo periodo per TUTTI i dipendenti verranno eliminati e sostituiti."
                                    : " I turni esistenti in questo periodo per il dipendente selezionato verranno eliminati e sostituiti."}
                            </p>
                            <p className="mt-2 font-bold">Questa azione non è reversibile.</p>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        <motion.button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Indietro
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={handleConfirm}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
