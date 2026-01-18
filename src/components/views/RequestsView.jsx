import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';

const RequestsView = () => {
    const {
        requests, getEmployeeById,
        handleApproveRequest, handleRejectRequest, t
    } = useAppContext();

    const pending = requests.filter(r => r.status === 'pending');
    const history = requests.filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getRequestTypeLabel = (type) => {
        switch (type) {
            case 'ferie': return 'Ferie';
            case 'permesso': return 'Permesso';
            case 'malattia': return 'Malattia';
            case 'altro': return 'Altro';
            default: return type;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Richieste Pendenti */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm p-6 transition-colors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    {t('pending_requests_title')} ({pending.length})
                </h2>
                <div className="space-y-4">
                    {pending.length > 0 ? (
                        pending.map((req) => {
                            const employee = getEmployeeById(req.employeeId);
                            return (
                                <motion.div
                                    key={req.id}
                                    className="p-4 border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center transition-colors"
                                    layout // Anima il layout quando viene rimosso
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -100 }}
                                >
                                    <div>
                                        {/* ... (dettagli richiesta non modificati) ... */}
                                        <div className="font-bold text-gray-900 dark:text-white">{employee?.firstName} {employee?.lastName}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span className="font-medium text-yellow-700">{getRequestTypeLabel(req.type)}:</span> {req.reason}
                                        </div>
                                        {req.startDate && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {t('period')}: {formatDate(req.startDate)}{req.endDate && req.startDate !== req.endDate ? ` - ${formatDate(req.endDate)}` : ''}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <motion.button
                                            onClick={() => handleApproveRequest(req.id)}
                                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium shadow"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <CheckCircle className="w-4 h-4" /> {t('approve')}
                                        </motion.button>
                                        <motion.button
                                            onClick={() => handleRejectRequest(req.id)}
                                            className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <XCircle className="w-4 h-4" /> {t('reject')}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center p-4 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-dark-border rounded-lg">
                            {t('no_pending_requests')}
                        </div>
                    )}
                </div>
            </div>

            {/* Storico Richieste */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm p-6 transition-colors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    {t('requests_history') || 'Storico Richieste'}
                </h2>
                <div className="space-y-4">
                    {history.length > 0 ? (
                        history.map((req) => {
                            const employee = getEmployeeById(req.employeeId);
                            return (
                                <div key={req.id} className="p-4 border border-gray-100 dark:border-dark-border rounded-lg flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{employee?.firstName} {employee?.lastName}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className={`font-medium ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                {req.status === 'approved' ? (t('approved') || 'Approvata') : (t('rejected') || 'Rifiutata')}
                                            </span>
                                            : {req.reason}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500">{t('no_history') || 'Nessuna richiesta nello storico'}</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RequestsView;
