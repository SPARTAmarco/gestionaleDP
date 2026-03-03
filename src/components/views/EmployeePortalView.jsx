import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Coffee, MessageSquare, Briefcase, Send, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

/**
 * EmployeePortalView relies on `employeeId` passed via URL 
 * example: /?employee=1234
 */
const EmployeePortalView = ({ employeeId }) => {
    const {
        employees,
        shifts,
        requests,
        handleCreateRequest,
        getWeekDays,
        changeWeek,
        t,
        business
    } = useAppContext();

    const [newMessage, setNewMessage] = useState('');
    const [requestType, setRequestType] = useState('ferie');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find if the ID matches a real employee
    const employee = employees.find(e => e.id === employeeId);

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Link Dipendente non valido</h2>
                    <p className="text-gray-500">Rivolgiti al tuo titolare per ricevere il link corretto.</p>
                </div>
            </div>
        );
    }

    const weekDays = getWeekDays();
    const myShifts = shifts.filter(s => s.employeeId === employeeId);

    // Get shifts for the visible week
    const weekShifts = myShifts.filter(s => weekDays.map(d => d.toISOString().split('T')[0]).includes(s.date));

    const shiftTypeConfig = {
        morning: { color: 'bg-amber-100 text-amber-700', icon: Coffee, label: 'Mattina' },
        afternoon: { color: 'bg-blue-100 text-blue-700', icon: Briefcase, label: 'Pomeriggio' },
        evening: { color: 'bg-indigo-100 text-indigo-700', icon: Clock, label: 'Sera' },
        custom: { color: 'bg-emerald-100 text-emerald-700', icon: CalendarIcon, label: 'Personalizzato' }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSubmitting(true);
        // Standard request payload but bound to this employee
        const success = await handleCreateRequest({
            employeeId: employeeId,
            type: requestType,
            reason: newMessage,
            status: 'pending',
            startDate: new Date().toISOString().split('T')[0] // simplified for fast sending
        });

        if (success) {
            setNewMessage('');
            alert('Richiesta inviata in attesa di approvazione!');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center">

            <div className="w-full bg-blue-600 p-8 text-white text-center shadow-lg shadow-blue-600/30 mb-6 sticky top-0 z-10">
                <div className="mb-2 text-blue-200 text-sm font-bold uppercase tracking-wider">{business?.name || 'La Mia Azienda'}</div>
                <h1 className="text-3xl font-extrabold mb-2">Ciao, {employee.firstName}</h1>
                <p className="text-blue-100 text-sm opacity-90">La tua area personale per i turni settimanali.</p>
            </div>

            <div className="w-full max-w-lg px-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            I tuoi turni
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => changeWeek(-1)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">&lt;</button>
                            <button onClick={() => changeWeek(1)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">&gt;</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {weekDays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const dayShifts = weekShifts.filter(s => s.date === dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div key={dateStr} className={`flex items-stretch gap-4 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 -mx-4 px-4 py-3 rounded-2xl' : ''}`}>
                                    <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                                        <span className={`text-xs uppercase font-bold ${isToday ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                                        </span>
                                        <span className={`text-2xl font-black ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center gap-2">
                                        {dayShifts.length === 0 ? (
                                            <div className="h-full min-h-[40px] flex items-center text-sm font-medium text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                                Riposo
                                            </div>
                                        ) : (
                                            dayShifts.map(shift => {
                                                const config = shiftTypeConfig[shift.type] || shiftTypeConfig.custom;
                                                const Icon = config.icon;
                                                return (
                                                    <div key={shift.id} className={`${config.color} px-4 py-3 rounded-2xl flex items-center justify-between`}>
                                                        <div className="flex items-center gap-3">
                                                            <Icon className="w-5 h-5 opacity-70" />
                                                            <span className="font-extrabold tracking-tight">{shift.startTime} - {shift.endTime}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-lg">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Invia Richiesta Veloce
                    </h2>

                    <form onSubmit={handleSendRequest} className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {['ferie', 'permesso', 'malattia', 'altro'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setRequestType(type)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95 whitespace-nowrap ${requestType === type
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t(type)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Scrivi una nota per il titolare..."
                                className="flex-1 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !newMessage.trim()}
                                className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-blue-600/20"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
};

export default EmployeePortalView;
