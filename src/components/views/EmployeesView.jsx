import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Copy, Check, Users, User, Eye } from 'lucide-react';
// IMPORTANTE: Assicurati che questo percorso punti dove hai definito AppContext
import { useAppContext } from '../../App';

function EmployeesView({ onAddEmployee, onEditEmployee }) {
    const { employees, calculateWeekHours, handleDeleteEmployee, business, t } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    // DEBUG: Controlla la console per vedere se questo messaggio appare
    useEffect(() => {
        console.log("EmployeesView montato. Dipendenti ricevuti:", employees);
    }, [employees]);

    // LOGICA DI FILTRO ROBUSTA
    const filteredEmployees = employees.filter(emp => {
        // 1. Controllo base: l'oggetto deve esistere
        if (!emp) return false;

        // 2. Costruiamo una stringa unica per la ricerca
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        const pos = (emp.position || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        // 3. Se c'è una ricerca, filtriamo, altrimenti mostriamo tutto
        return fullName.includes(search) || pos.includes(search);
    });

    // Funzione copia codice
    const copyCode = () => {
        if (business?.join_code) {
            navigator.clipboard.writeText(business.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 pb-24"
        >
            {/* --- SEZIONE 1: CODICE INVITO (Solo per Titolare) --- */}
            {business?.join_code && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6" /> Invita il tuo Staff
                        </h2>
                        <p className="text-blue-100 mt-1 opacity-90 text-sm">
                            Il dipendente deve inserire questo codice quando si registra:
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-3 pl-5 rounded-lg flex items-center gap-4 border border-white/20">
                        <span className="font-mono text-2xl font-bold tracking-widest uppercase select-all">
                            {business.join_code}
                        </span>
                        <button
                            onClick={copyCode}
                            className="p-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-transform active:scale-95 shadow-sm"
                            title="Copia codice"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {/* --- SEZIONE 2: BARRA DI RICERCA --- */}
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

            {/* --- SEZIONE 3: TABELLA DIPENDENTI --- */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-dark-border">
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
                                                {/* Avatar con iniziali sicure */}
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
                                            {/* Calcolo ore sicuro */}
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
                                                    onClick={() => onEditEmployee(employee)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={t('view_details') || "Visualizza Dettagli"}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee.id)}
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
                                    <td colSpan="5" className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                                                <User className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="font-medium">Nessun dipendente trovato</p>
                                            <p className="text-sm opacity-70">Prova a modificare la ricerca o aggiungi un nuovo membro.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

export default EmployeesView;