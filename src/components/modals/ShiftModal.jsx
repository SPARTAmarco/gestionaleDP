import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar, Clock, User, Sun } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { useAppContext } from '../../context/AppContext';

const ShiftModal = ({ shift, initialDate, onSave, onDelete, onClose }) => {
    const { employees, t } = useAppContext(); // Prendi i dipendenti dal context

    const [formData, setFormData] = useState({
        employeeId: shift?.employeeId || employees[0]?.id || '',
        date: shift?.date || initialDate || new Date().toISOString().split('T')[0],
        startTime: shift?.startTime || '09:00',
        endTime: shift?.endTime || '17:00',
        type: shift?.type || 'morning'
        // Nota: 'notes' rimosso perché non esiste nella tabella shifts del database
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <AnimatedModal title={shift ? t('edit_shift') : t('create_shift')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('employee')}</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                        >
                            <option value="" disabled>{t('select_employee')}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Inizio</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fine</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo Turno</label>
                    <div className="relative">
                        <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                        >
                            <option value="morning">{t('morning')}</option>
                            <option value="afternoon">{t('afternoon')}</option>
                            <option value="evening">{t('evening')}</option>
                            <option value="night">{t('night')}</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-dark-border mt-2">
                    {onDelete && (
                        <motion.button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('delete')}
                        </motion.button>
                    )}
                    <motion.button
                        type="submit"
                        className="ml-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all font-medium shadow-md text-sm"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {shift ? t('save_shift') : t('create_shift')}
                    </motion.button>
                </div>
            </form>
        </AnimatedModal>
    );
};

export default ShiftModal;
