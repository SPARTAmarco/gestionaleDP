import React, { useState } from 'react';
import { Calendar, Clock, LogOut, User, MapPin, Home, MessageSquare, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeRequestsView from './EmployeeRequestsView';
import SettingsView from './SettingsView';

const EmployeeDashboard = () => {
    const { user, business, authSignOut, shifts, calculateHours, t } = useAppContext();
    const [activeTab, setActiveTab] = useState('home');

    // Recuperiamo i dati visuali
    const userName = user?.user_metadata?.first_name || user?.first_name || 'Dipendente';
    const businessName = business?.name || 'Nessuna attività';

    // --- LOGICA TURNI REALI ---
    // 1. Filtra i turni di QUESTO dipendente
    console.log("DEBUG: EmployeeDashboard User ID:", user?.id);
    console.log("DEBUG: All Shifts:", shifts);
    const myShifts = shifts
        .filter(s => s.employeeId === user?.id)
        .sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
    console.log("DEBUG: My Shifts:", myShifts);

    // 2. Trova il prossimo turno (da oggi in poi)
    // Filtriamo solo i turni futuri o di oggi
    const upcomingShifts = myShifts.filter(s => {
        const shiftDate = new Date(s.date);
        shiftDate.setHours(0, 0, 0, 0); // Normalizza a mezzanotte locale

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizza a mezzanotte locale

        return shiftDate.getTime() >= today.getTime();
    });

    const nextShift = upcomingShifts[0]; // Il primo della lista (già ordinata)

    // Helper per formattare la data
    const formatDate = (dateStr) => {
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        return new Date(dateStr).toLocaleDateString('it-IT', options);
    };

    const formatCreationTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `Assegnato il: ${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const renderHome = () => (
        <div className="space-y-6">
            {/* HEADER DIPENDENTE */}
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {userName[0]}
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white text-lg">{t('hello')}, {userName}</h1>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="w-3 h-3" /> {businessName}
                        </div>
                    </div>
                </div>
                <button
                    onClick={authSignOut}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('logout')}
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            {/* PROSSIMO TURNO CARD */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">{t('next_shift_title')}</h2>

                {nextShift ? (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Calendar className="w-5 h-5" />
                            <span className="font-medium capitalize">{formatDate(nextShift.date)}</span>
                        </div>

                        <div className="text-4xl font-bold mb-2">
                            {nextShift.startTime} - {nextShift.endTime}
                        </div>

                        {nextShift.notes && (
                            <div className="mt-4 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <div className="text-sm font-medium mb-1 opacity-90">Commento:</div>
                                <div className="text-sm opacity-80">{nextShift.notes}</div>
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-6">
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm capitalize">
                                {user?.position || 'Staff'}
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-sm font-medium opacity-90 justify-end">
                                    <Clock className="w-4 h-4" /> {calculateHours(nextShift.startTime, nextShift.endTime)} ore
                                </div>
                                {nextShift.createdAt && (
                                    <div className="mt-1 text-xs opacity-70">
                                        {formatCreationTime(nextShift.createdAt)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center shadow-sm border border-gray-100 dark:border-dark-border transition-colors">
                        <p className="text-gray-500 dark:text-gray-400">{t('no_shifts_scheduled')}</p>
                    </div>
                )}
            </div>

            {/* LISTA ALTRI TURNI */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm p-6 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('your_shifts')}</h3>

                {upcomingShifts.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingShifts.map((shift) => (
                            <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white capitalize">
                                            {formatDate(shift.date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {shift.startTime} - {shift.endTime}
                                        </div>
                                        {shift.notes && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                                💬 {shift.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-gray-600 dark:text-gray-300 flex flex-col items-end">
                                    <span>{calculateHours(shift.startTime, shift.endTime)}h</span>
                                    {shift.createdAt && (
                                        <span className="text-[10px] font-normal text-gray-400 mt-1">
                                            {formatCreationTime(shift.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('no_other_shifts')}
                            <br />{t('enjoy_rest')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors pb-24">
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'home' && renderHome()}
                        {activeTab === 'requests' && <EmployeeRequestsView />}
                        {activeTab === 'settings' && <SettingsView />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border px-6 py-3 flex justify-around items-center z-50 safe-area-bottom transition-colors shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-xl ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{t('home')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-xl ${activeTab === 'requests' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{t('requests')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-xl ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    <Settings className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{t('settings')}</span>
                </button>
            </div>
        </div>
    );
};

export default EmployeeDashboard;