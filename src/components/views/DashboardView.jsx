import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, Users, Bell, Clock, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDateShort } from '../../utils/dateUtils';
import { TableSkeleton, CardGridSkeleton } from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';

const DashboardView = ({ onAddShift, onEditShift, onOpenRepeatWeeksModal }) => {
    const {
        currentWeekStart, getWeekDays, changeWeek,
        employees, shifts, getShiftsForDate, calculateWeekHours, calculateHours,
        pendingRequestsCount, exportPDF, exportExcel, t, settings, isLoading
    } = useAppContext();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between transition-colors">
                <motion.button
                    onClick={() => changeWeek(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('week')}</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                        {formatDateShort(getWeekDays()[0])} - {formatDateShort(getWeekDays()[6])}
                    </div>
                </div>

                <div className="flex gap-2">
                    <motion.button
                        onClick={() => changeWeek(0)} // Passa 0 per "Oggi"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {t('today')}
                    </motion.button>
                    <motion.button
                        onClick={() => changeWeek(1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                        whileTap={{ scale: 0.9 }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Stat Cards with Loading State */}
            {isLoading ? (
                <CardGridSkeleton cards={4} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.button
                        onClick={() => onAddShift()}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer shadow"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus className="w-6 h-6 mb-2" />
                        <div className="font-bold">{t('add_shift')}</div>
                    </motion.button>

                    <motion.button
                        onClick={onOpenRepeatWeeksModal}
                        className="bg-white dark:bg-dark-surface text-blue-600 dark:text-blue-400 p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer shadow border border-blue-100 dark:border-blue-900"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex flex-col items-center">
                            <TrendingUp className="w-6 h-6 mb-2" />
                            <div className="font-bold text-sm">Ripeti Turni</div>
                        </div>
                    </motion.button>

                    <motion.div
                        className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border transition-colors"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Users className="w-6 h-6 text-gray-400 mb-2" />
                        <motion.div
                            key={employees.length}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white"
                        >
                            {employees.length}
                        </motion.div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('employees')}</div>
                    </motion.div>

                    <motion.div
                        className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border transition-colors"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Bell className="w-6 h-6 text-orange-400 mb-2" />
                        <motion.div
                            key={pendingRequestsCount}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white"
                        >
                            {pendingRequestsCount}
                        </motion.div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('pending_requests_stat')}</div>
                    </motion.div>
                </div>
            )}

            {/* Tabella Calendario (Desktop) */}
            <div className="hidden md:block bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        {/* ... (thead non modificato) ... */}
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border transition-colors">
                                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-48">{t('employee')}</th>
                                {getWeekDays().map((day, idx) => {
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    return (
                                        <th key={idx} className={`text-center p-4 font-semibold group relative ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-sm ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                                                {day.getDate()} {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { month: 'short' })}
                                            </div>

                                            {/* Quick Add Button */}
                                            <motion.button
                                                onClick={() => onAddShift(day.toISOString().split('T')[0])}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full transition-opacity"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title={t('add_shift')}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </motion.button>
                                        </th>
                                    );
                                })}
                                <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-24">{t('total_hours')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.filter(e => e.isActive).map((employee) => (
                                <tr key={employee.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors duration-150">
                                    <td className="p-4">
                                        {/* ... (info dipendente non modificate) ... */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                                style={{ backgroundColor: employee.color }}
                                            >
                                                {employee.firstName[0]}{employee.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{employee.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {getWeekDays().map((day, dayIdx) => {
                                        const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === employee.id);
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        return (
                                            <td key={dayIdx} className={`p-2 align-top ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                <div className="space-y-1">
                                                    {dayShifts.map((shift) => (
                                                        <motion.div
                                                            key={shift.id}
                                                            className="text-xs p-2 rounded-lg cursor-pointer"
                                                            style={{
                                                                backgroundColor: employee.color + '20',
                                                                borderLeft: `3px solid ${employee.color}`
                                                            }}
                                                            onClick={() => onEditShift(shift)}
                                                            whileHover={{ scale: 1.05, shadow: 'lg' }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        >
                                                            <div className="font-semibold" style={{ color: employee.color }}>
                                                                {shift.startTime} - {shift.endTime}
                                                                {shift.notes && <span className="ml-1 text-xs">💬</span>}
                                                            </div>
                                                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                                                                {calculateHours(shift.startTime, shift.endTime)}h
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-4 text-center">
                                        {/* ... (ore totali non modificate) ... */}
                                        <div className="font-bold text-gray-900 dark:text-white">{calculateWeekHours(employee.id)}h</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">/{employee.contractHours}h</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lista Verticale (Mobile) */}
            <div className="md:hidden space-y-6">
                {getWeekDays().map((day, idx) => {
                    const dayString = day.toISOString().split('T')[0];
                    // Raccogli tutti i turni del giorno per tutti i dipendenti attivi
                    const dayShifts = employees
                        .filter(e => e.isActive)
                        .flatMap(emp => {
                            const shiftsForDay = getShiftsForDate(day).filter(s => s.employeeId === emp.id);
                            return shiftsForDay.map(s => ({ ...s, employee: emp }));
                        })
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={idx} className={`rounded-xl border ${isToday ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-900/10' : 'border-gray-200 bg-white dark:border-dark-border dark:bg-dark-surface'} overflow-hidden`}>
                            <div className={`p-3 border-b ${isToday ? 'border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20' : 'border-gray-100 bg-gray-50 dark:border-dark-border dark:bg-dark-bg'} flex justify-between items-center`}>
                                <div className="font-bold text-gray-900 dark:text-white">
                                    {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                <motion.button
                                    onClick={() => onAddShift(dayString)}
                                    className="p-2 bg-white dark:bg-dark-surface text-blue-600 dark:text-blue-400 rounded-full shadow-sm border border-gray-100 dark:border-dark-border"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Plus className="w-4 h-4" />
                                </motion.button>
                            </div>
                            <div className="p-3 space-y-3">
                                {dayShifts.length > 0 ? (
                                    dayShifts.map(shift => (
                                        <motion.div
                                            key={shift.id}
                                            onClick={() => onEditShift(shift)}
                                            className="flex items-center gap-3 bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-100 dark:border-dark-border shadow-sm"
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                                style={{ backgroundColor: shift.employee.color }}
                                            >
                                                {shift.employee.firstName[0]}{shift.employee.lastName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 dark:text-white">
                                                    {shift.employee.firstName} {shift.employee.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {shift.startTime} - {shift.endTime}
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        ({calculateHours(shift.startTime, shift.endTime)}h)
                                                    </span>
                                                </div>
                                                {shift.notes && (
                                                    <div className="text-xs text-gray-400 mt-1 italic truncate">
                                                        {shift.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4 italic">
                                        {t('no_shifts') || "Nessun turno programmato"}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-6">
                <motion.button
                    onClick={() => {
                        console.log('Export PDF clicked');
                        if (exportPDF) exportPDF();
                        else console.error('exportPDF function not found in context');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors shadow-sm text-gray-700 dark:text-gray-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FileText className="w-4 h-4 text-red-600 dark:text-red-500" />
                    <span className="font-medium">{t('export_pdf')}</span>
                </motion.button>
                <motion.button
                    onClick={() => {
                        console.log('Export Excel clicked');
                        if (exportExcel) exportExcel();
                        else console.error('exportExcel function not found in context');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors shadow-sm text-gray-700 dark:text-gray-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-500" />
                    <span className="font-medium">{t('export_excel')}</span>
                </motion.button>
            </div>
        </motion.div >
    );
}

export default DashboardView;
