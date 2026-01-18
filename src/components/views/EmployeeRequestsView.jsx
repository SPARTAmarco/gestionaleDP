import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Calendar, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const EmployeeRequestsView = () => {
    const { user, requests, handleCreateRequest, t } = useAppContext();
    const [newMessage, setNewMessage] = useState('');
    const [requestType, setRequestType] = useState('ferie'); // ferie, permesso, malattia, altro
    const [dates, setDates] = useState({ start: '', end: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef(null);

    // Filter my requests
    const myRequests = requests
        .filter(r => r.employeeId === user.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [myRequests]);

    const [isSingleDay, setIsSingleDay] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSubmitting(true);
        const success = await handleCreateRequest({
            type: requestType,
            reason: newMessage,
            startDate: requestType === 'altro' ? null : (dates.start || null),
            endDate: requestType === 'altro' ? null : (isSingleDay ? dates.start : (dates.end || null))
        });

        if (success) {
            setNewMessage('');
            setDates({ start: '', end: '' });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] bg-white dark:bg-dark-surface rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-dark-border transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg transition-colors">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {t('requests_title')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('requests_subtitle')}</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-dark-bg/50 transition-colors">
                {myRequests.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>{t('no_requests_yet')}</p>
                    </div>
                ) : (
                    myRequests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col max-w-[85%] ml-auto bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 shadow-sm`}
                        >
                            <div className="flex justify-between items-start gap-4 mb-1">
                                <span className="text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded text-blue-50">
                                    {t(req.type)}
                                </span>
                                <span className="text-[10px] opacity-70">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm mb-2">{req.reason}</p>
                            {req.startDate && (
                                <div className="text-xs bg-black/10 p-2 rounded flex items-center gap-2 mb-2">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(req.startDate).toLocaleDateString()}
                                    {req.endDate && req.startDate !== req.endDate && ` - ${new Date(req.endDate).toLocaleDateString()}`}
                                </div>
                            )}
                            <div className="flex justify-end items-center gap-1 mt-1">
                                {req.status === 'pending' && <Clock className="w-3 h-3 opacity-70" />}
                                {req.status === 'approved' && <CheckCircle className="w-3 h-3 text-green-300" />}
                                {req.status === 'rejected' && <XCircle className="w-3 h-3 text-red-300" />}
                                <span className="text-[10px] opacity-70 capitalize">{t(req.status)}</span>
                            </div>
                        </motion.div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border transition-colors">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
                    {['ferie', 'permesso', 'malattia', 'altro'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setRequestType(type)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${requestType === type
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-transparent'
                                }`}
                        >
                            {t(type)}
                        </button>
                    ))}
                </div>

                {(requestType === 'ferie' || requestType === 'permesso' || requestType === 'malattia') && (
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={isSingleDay}
                                    onChange={() => setIsSingleDay(true)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                {t('single_day')}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!isSingleDay}
                                    onChange={() => setIsSingleDay(false)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                {t('period')}
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dates.start}
                                onChange={e => setDates({ ...dates, start: e.target.value })}
                                className="flex-1 text-sm p-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors"
                                required={requestType !== 'altro'}
                            />
                            {!isSingleDay && (
                                <input
                                    type="date"
                                    value={dates.end}
                                    onChange={e => setDates({ ...dates, end: e.target.value })}
                                    className="flex-1 text-sm p-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors"
                                    required={!isSingleDay}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('write_message')}
                        className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newMessage.trim()}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeRequestsView;
