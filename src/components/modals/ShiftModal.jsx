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
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('employee')}</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors group-focus-within:bg-blue-600 group-focus-within:text-white pointer-events-none">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <select
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                            <option value="" disabled>{t('select_employee')}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Data</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-colors group-focus-within:bg-purple-600 group-focus-within:text-white pointer-events-none">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Inizio</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors group-focus-within:bg-gray-800 group-focus-within:text-white pointer-events-none">
                                <Clock className="w-4 h-4" />
                            </div>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-gray-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Fine</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors group-focus-within:bg-gray-800 group-focus-within:text-white pointer-events-none">
                                <Clock className="w-4 h-4" />
                            </div>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                required
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-gray-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Tipo Turno</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center transition-colors group-focus-within:bg-orange-600 group-focus-within:text-white pointer-events-none">
                            <Sun className="w-4 h-4" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                            <option value="morning">{t('morning')}</option>
                            <option value="afternoon">{t('afternoon')}</option>
                            <option value="evening">{t('evening')}</option>
                            <option value="night">{t('night')}</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 mt-4">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('delete')}
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
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
                            {shift ? t('save_shift') : t('create_shift')}
                        </motion.button>
                    </div>
                </div>
            </form>
        </AnimatedModal>
    );
};

export default ShiftModal;
