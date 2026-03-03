import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, Copy, Check, Users, Eye } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import EmptyState from '../ui/EmptyState';
import ConfirmationModal from '../modals/ConfirmationModal';

function EmployeesView({ onAddEmployee, onViewDetails }) {
    const { employees, calculateWeekHours, handleDeleteEmployee, business, t } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    useEffect(() => {
        console.log("EmployeesView montato. Dipendenti ricevuti:", employees);
    }, [employees]);

    const filteredEmployees = employees.filter(emp => {
        if (!emp) return false;
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        const pos = (emp.position || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || pos.includes(search);
    });

    const copyEmployeeLink = (employeeId) => {
        const baseUrl = window.location.href.split('?')[0];
        const link = `${baseUrl}?dipendente=${employeeId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(employeeId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (employeeToDelete) {
            await handleDeleteEmployee(employeeToDelete.id);
            setEmployeeToDelete(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 pb-24"
        >


            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <input
                        type="text"
                        placeholder={t('search_employee') || "Cerca dipendente..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <button
                    onClick={onAddEmployee}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    {t('add_employee') || "Aggiungi"}
                </button>
            </div>

            <div className="hidden md:block bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-dark-border">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">{t('full_name') || "Nome"}</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">{t('position') || "Ruolo"}</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">{t('contract_hours') || "Contratto"}</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">{t('current_hours') || "Ore Sett."}</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300 w-32">{t('actions') || "Azioni"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                                    style={{ backgroundColor: employee.color || '#ccc' }}
                                                >
                                                    {(employee.firstName?.[0] || '?')}{(employee.lastName?.[0] || '')}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                                                        {employee.position}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium hidden md:table-cell">
                                            {employee.position}
                                        </td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                                            {employee.contractHours}h
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${(calculateWeekHours && calculateWeekHours(employee.id) > employee.contractHours)
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {calculateWeekHours ? calculateWeekHours(employee.id) : '0'}h
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => copyEmployeeLink(employee.id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Copia link dipendente"
                                                >
                                                    {copiedId === employee.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => onViewDetails(employee)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={t('view_details') || "Visualizza Dettagli"}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(employee)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Elimina"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12">
                                        <EmptyState
                                            type={searchTerm ? 'search' : 'employees'}
                                            action={searchTerm ? null : onAddEmployee}
                                            actionLabel={searchTerm ? null : 'Aggiungi Dipendente'}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                        <div key={employee.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                                    style={{ backgroundColor: employee.color || '#ccc' }}
                                >
                                    {(employee.firstName?.[0] || '?')}{(employee.lastName?.[0] || '')}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                                        {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {employee.position}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg p-3 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Contratto: <span className="font-semibold text-gray-900 dark:text-white">{employee.contractHours}h</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Attuali: <span className={`font-bold ${(calculateWeekHours && calculateWeekHours(employee.id) > employee.contractHours)
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {calculateWeekHours ? calculateWeekHours(employee.id) : '0'}h
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => copyEmployeeLink(employee.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors"
                                    title="Copia link personale"
                                >
                                    {copiedId === employee.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} Link
                                </button>
                                <button
                                    onClick={() => onViewDetails(employee)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                                >
                                    <Eye className="w-4 h-4" /> Dettagli
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(employee)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Elimina
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        type={searchTerm ? 'search' : 'employees'}
                        action={searchTerm ? null : onAddEmployee}
                        actionLabel={searchTerm ? null : 'Aggiungi Dipendente'}
                        className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border"
                    />
                )}
            </div>

            {/* Confirmation Modal for Delete */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setEmployeeToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Rimuovi Dipendente"
                message={`Sei sicuro di voler rimuovere ${employeeToDelete?.firstName} ${employeeToDelete?.lastName} dalla tua attività?\n\n⚠️ ATTENZIONE: Tutti i turni assegnati a questo dipendente verranno eliminati definitivamente.`}
                confirmText="Rimuovi"
                cancelText="Annulla"
                variant="danger"
            />
        </motion.div >
    );
}

export default EmployeesView;