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

    // --- READ ONLY VIEW (Enhanced) ---
    if (readOnly && employee) {
        return (
            <AnimatedModal title={null} onClose={onClose}>
                <div className="relative">
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl -mt-6 -mx-6 w-[calc(100%+3rem)]"></div>

                    <div className="relative pt-10 px-2 pb-4">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center mb-8">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-dark-surface shadow-lg mb-4"
                                style={{ backgroundColor: employee.color || '#3B82F6' }}
                            >
                                {(employee.firstName?.[0] || '?')}{(employee.lastName?.[0] || '')}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {employee.firstName} {employee.lastName}
                            </h3>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mt-2 text-sm">
                                <Briefcase className="w-4 h-4" />
                                {employee.position || 'Nessun ruolo'}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm text-blue-500">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">{t('email')}</span>
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white break-all pl-11">
                                    {employee.email || '-'}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm text-green-500">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">{t('phone') || 'Telefono'}</span>
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white pl-11">
                                    {employee.phone || '-'}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm text-purple-500">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">{t('contract_hours')}</span>
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white pl-11">
                                    {employee.contractHours}h <span className="text-gray-400 text-sm font-normal">/ settimana</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm text-orange-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">ID</span>
                                </div>
                                <div className="font-mono text-sm text-gray-600 dark:text-gray-300 pl-11 truncate">
                                    {employee.id}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-8">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full md:w-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                Chiudi Profilo
                            </motion.button>
                        </div>
                    </div>
                </div>
            </AnimatedModal>
        );
    }

    // --- EDIT / CREATE VIEW (Enhanced) ---
    return (
        <AnimatedModal title={employee ? t('edit_employee') : "Nuovo Dipendente"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('first_name')}</label>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="Nome"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('last_name')}</label>
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Cognome"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('position')}</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors group-focus-within:bg-blue-600 group-focus-within:text-white">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            name="position"
                            placeholder="Es. Barista, Cameriere..."
                            value={formData.position}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('contract_hours')}</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-colors group-focus-within:bg-purple-600 group-focus-within:text-white">
                            <Clock className="w-4 h-4" />
                        </div>
                        <input
                            type="number"
                            name="contractHours"
                            placeholder="40"
                            value={formData.contractHours}
                            onChange={handleChange}
                            required
                            className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('email')}</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors group-focus-within:bg-gray-800 group-focus-within:text-white">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="email@esempio.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-gray-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('phone') || 'Telefono'}</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors group-focus-within:bg-green-600 group-focus-within:text-white">
                                <Phone className="w-4 h-4" />
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="+39..."
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full pl-14 p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-gray-900 dark:text-white"
                            />
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
                        {employee ? t('save_changes') : "Crea Dipendente"}
                    </motion.button>
                </div>
            </form>
        </AnimatedModal>
    );
};

export default EmployeeModal;
