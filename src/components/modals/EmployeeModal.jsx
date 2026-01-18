import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Briefcase, Clock, User } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { useAppContext } from '../../context/AppContext';

const EmployeeModal = ({ employee, onSave, onClose, readOnly = false }) => {
    const { t } = useAppContext();
    const [formData, setFormData] = useState({
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        position: employee?.position || '',
        contractHours: employee?.contractHours || 40,
        email: employee?.email || '',
        phone: employee?.phone || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (readOnly) return;
        onSave({ ...formData, contractHours: Number(formData.contractHours) });
    };

    // --- READ ONLY VIEW ---
    if (readOnly && employee) {
        return (
            <AnimatedModal title={t('employee_details')} onClose={onClose}>
                <div className="space-y-6 p-2">
                    {/* Header Card */}
                    <div className="flex items-center gap-5 bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
                            style={{ backgroundColor: employee.color || '#3B82F6' }}
                        >
                            {(employee.firstName?.[0] || '?')}{(employee.lastName?.[0] || '')}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {employee.firstName} {employee.lastName}
                            </h3>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mt-1">
                                <Briefcase className="w-4 h-4" />
                                {employee.position || 'Nessun ruolo'}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                                <Mail className="w-4 h-4" />
                                {t('email')}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white break-all">
                                {employee.email || '-'}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                                <Phone className="w-4 h-4" />
                                {t('phone') || 'Telefono'}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {employee.phone || '-'}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                                <Clock className="w-4 h-4" />
                                {t('contract_hours')}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {employee.contractHours}h / settimana
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                                <User className="w-4 h-4" />
                                ID Dipendente
                            </div>
                            <div className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                {employee.id.substring(0, 8)}...
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            </AnimatedModal>
        );
    }

    // --- EDIT / CREATE VIEW ---
    return (
        <AnimatedModal title={employee ? t('edit_employee') : t('create_employee')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('first_name')}</label>
                        <input type="text" name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('last_name')}</label>
                        <input type="text" name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('position')}</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="position" placeholder="Es. Barista" value={formData.position} onChange={handleChange} required className="w-full pl-9 p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('contract_hours')}</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" name="contractHours" placeholder="40" value={formData.contractHours} onChange={handleChange} required className="w-full pl-9 p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" name="email" placeholder="email@esempio.com" value={formData.email} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone') || 'Telefono'}</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" name="phone" placeholder="+39 333 1234567" value={formData.phone} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <motion.button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {employee ? t('save_changes') : t('save_employee')}
                    </motion.button>
                </div>
            </form>
        </AnimatedModal>
    );
};

export default EmployeeModal;
