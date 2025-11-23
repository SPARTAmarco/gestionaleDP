import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Globe, Moon, Calendar,
    Mail, Bell, Download, BarChart2,
    X, Check, Zap, FileText, FileSpreadsheet
} from 'lucide-react';

// Assicurati che questo percorso punti al tuo AppContext.js
// Se AppContext è nello stesso file di App.jsx, usa il percorso corretto
import { useAppContext } from "../../App";
import SettingItem from '../settings/SettingItem';

const SettingsView = ({ onOpenPremium }) => {
    const {
        user,
        settings,
        updateSettings,
        toggleNotification,
        theme,
        toggleTheme,
        updateProfile,
        changePassword,
        t,
        business,
        exportPDF,
        exportExcel,
        employees,
        shifts,
        getWeekDays,
        calculateWeekHours
    } = useAppContext();

    const isPremium = user?.is_premium;
    const isEmployee = user?.role === 'employee';
    const [activeModal, setActiveModal] = useState(null); // 'profile' | 'password' | 'export' | 'analytics' | null

    // --- Modal Wrapper ---
    const Modal = ({ title, onClose, children }) => (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />
                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10"
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    // --- Profile Form Component ---
    // --- Profile Form Component (Aggiornato con Dati Business) ---
    const ProfileForm = () => {
        const [formData, setFormData] = useState({
            // Dati Personali
            firstName: user?.user_metadata?.first_name || '',
            lastName: user?.user_metadata?.last_name || '',
            email: user?.email || '',

            // Dati Attività (Prei dallo stato 'business')
            businessName: business?.name || '',
            address: business?.address || '',
            phone: business?.phone || ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            const success = await updateProfile(formData);
            if (success) {
                setActiveModal(null);
            }
        };

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">

                {/* SEZIONE PERSONALE */}
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1 mb-3">
                    Dati Personali
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cognome</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* SEZIONE ATTIVITÀ - Solo per Titolari */}
                {!isEmployee && (
                    <>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1 mb-3 mt-6">
                            Dettagli Attività
                        </h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Attività</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="es. Bar Centrale"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indirizzo Completo</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Via Roma 123, Milano"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefono Attività</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="02 12345678"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </>
                )}

                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-dark-surface pb-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Annulla</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">Salva Tutto</button>
                </div>
            </form>
        );
    };

    // --- Export Modal Component ---
    const ExportModal = () => {
        const handleExport = (format) => {
            if (format === 'pdf') {
                exportPDF();
            } else if (format === 'excel') {
                exportExcel();
            }
            setActiveModal(null);
        };

        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Scegli il formato per esportare i tuoi dati:
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <motion.button
                        onClick={() => handleExport('pdf')}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-dark-bg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FileText className="w-8 h-8 text-red-600 dark:text-red-500 mb-2" />
                        <span className="font-medium text-gray-900 dark:text-white">PDF</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per stampa</span>
                    </motion.button>
                    <motion.button
                        onClick={() => handleExport('excel')}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 transition-colors bg-white dark:bg-dark-bg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-500 mb-2" />
                        <span className="font-medium text-gray-900 dark:text-white">Excel</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per analisi</span>
                    </motion.button>
                </div>
                <div className="pt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        );
    };

    // --- Analytics View Component ---
    const AnalyticsView = () => {
        const weekDays = getWeekDays();
        const activeEmployees = employees?.filter(e => e.isActive) || [];
        const weekShifts = shifts?.filter(s => 
            weekDays.some(d => d.toISOString().split('T')[0] === s.date)
        ) || [];
        
        // Calcola statistiche
        const totalHours = weekShifts.reduce((sum, shift) => {
            if (!shift.startTime || !shift.endTime) return sum;
            const [startH, startM] = shift.startTime.split(':').map(Number);
            const [endH, endM] = shift.endTime.split(':').map(Number);
            const shiftHours = ((endH + endM / 60) - (startH + startM / 60));
            return sum + (shiftHours > 0 ? shiftHours : 0);
        }, 0);

        // Dipendente con più ore
        const employeeHours = activeEmployees.map(emp => ({
            employee: emp,
            hours: weekShifts
                .filter(s => s.employeeId === emp.id)
                .reduce((sum, shift) => {
                    if (!shift.startTime || !shift.endTime) return sum;
                    const [startH, startM] = shift.startTime.split(':').map(Number);
                    const [endH, endM] = shift.endTime.split(':').map(Number);
                    const shiftHours = ((endH + endM / 60) - (startH + startM / 60));
                    return sum + (shiftHours > 0 ? shiftHours : 0);
                }, 0)
        }));
        const topEmployee = employeeHours.sort((a, b) => b.hours - a.hours)[0];

        return (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {activeEmployees.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Dipendenti Attivi</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {weekShifts.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Turni Questa Settimana</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {totalHours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Ore Totali</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {activeEmployees.length > 0 ? (totalHours / activeEmployees.length).toFixed(1) : 0}h
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Media Ore/Dipendente</div>
                    </div>
                </div>

                {topEmployee && topEmployee.hours > 0 && (
                    <div className="bg-white dark:bg-dark-bg p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dipendente con Più Ore</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700 dark:text-gray-300">
                                {topEmployee.employee.firstName} {topEmployee.employee.lastName}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                {topEmployee.hours.toFixed(1)}h
                            </span>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        );
    };

    // --- Password Form Component ---
    const PasswordForm = () => {
        const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (passwords.new !== passwords.confirm) {
                alert(t('password_mismatch') || 'Le password non coincidono');
                return;
            }
            // Nota: Supabase UpdateUser non richiede la vecchia password se sei loggato,
            // ma la passiamo comunque se volessi implementare controlli extra lato tuo.
            const success = await changePassword(passwords.current, passwords.new);
            if (success) {
                setActiveModal(null);
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nota: Per Supabase Auth diretto, spesso la 'current' non serve per l'update se c'è sessione attiva, ma è buona UI chiederla */}
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('current_password') || 'Password Attuale'}</label>
                    <input
                        type="password"
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div> */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('new_password') || 'Nuova Password'}</label>
                    <input
                        type="password"
                        value={passwords.new}
                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirm_password') || 'Conferma Password'}</label>
                    <input
                        type="password"
                        value={passwords.confirm}
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">{t('cancel') || 'Annulla'}</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">{t('update_password') || 'Aggiorna'}</button>
                </div>
            </form>
        );
    };

    // --- Settings Structure ---
    const sections = [
        {
            title: t('account') || 'Account',
            items: [
                {
                    id: 'profile',
                    title: t('profile_info') || 'Informazioni Profilo',
                    description: t('profile_desc') || 'Modifica nome, cognome ed email',
                    icon: User,
                    type: 'button',
                    isPremium: false,
                    onClick: () => setActiveModal('profile')
                },
                {
                    id: 'password',
                    title: t('change_password') || 'Cambia Password',
                    description: t('password_desc') || 'Aggiorna la tua password di accesso',
                    icon: Lock,
                    type: 'button',
                    isPremium: false,
                    onClick: () => setActiveModal('password')
                },
                {
                    id: 'language',
                    title: t('language') || 'Lingua',
                    description: t('language_desc') || 'Seleziona la lingua dell\'app',
                    icon: Globe,
                    type: 'select',
                    value: settings?.language || 'it',
                    options: [
                        { value: 'it', label: t('italian') || 'Italiano' },
                        { value: 'en', label: t('english') || 'English' }
                    ],
                    onChange: (val) => updateSettings('language', val),
                    isPremium: false
                }
            ]
        },
        {
            title: t('appearance') || 'Aspetto',
            items: [
                {
                    id: 'theme',
                    title: t('dark_theme') || 'Tema Scuro',
                    description: t('dark_theme_desc') || 'Attiva la modalità notturna',
                    icon: Moon,
                    type: 'toggle',
                    value: theme === 'dark',
                    onChange: toggleTheme,
                    isPremium: false
                },
                !isEmployee && {
                    id: 'weekStart',
                    title: t('week_start') || 'Inizio Settimana',
                    description: t('week_start_desc') || 'Giorno di inizio del calendario',
                    icon: Calendar,
                    type: 'select',
                    value: settings?.weekStart || 'monday',
                    options: [
                        { value: 'monday', label: t('monday') || 'Lunedì' },
                        { value: 'sunday', label: t('sunday') || 'Domenica' }
                    ],
                    onChange: (val) => updateSettings('weekStart', val),
                    isPremium: false
                }
            ].filter(Boolean)
        },
        !isEmployee && {
            title: t('subscription') || 'Abbonamento',
            items: [
                {
                    id: 'premium_status',
                    title: isPremium ? (t('premium_status_active') || 'Premium Attivo') : (t('premium_status_inactive') || 'Piano Gratuito'),
                    description: isPremium
                        ? (t('premium_status_desc_active') || 'Hai accesso a tutte le funzionalità')
                        : (t('premium_status_desc_inactive') || 'Passa a Premium per sbloccare tutto'),
                    icon: Zap,
                    type: 'button',
                    isPremium: false,
                    onClick: isPremium ? () => { } : onOpenPremium,
                    customContent: isPremium ? (
                        <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {t('you_are_premium') || 'PREMIUM'}
                        </span>
                    ) : null
                }
            ]
        },
        {
            title: t('notifications') || 'Notifiche',
            items: [
                {
                    id: 'email_shifts',
                    title: t('email_shifts') || 'Email Turni',
                    description: t('email_shifts_desc') || 'Ricevi email per i nuovi turni',
                    icon: Mail,
                    type: 'toggle',
                    value: settings?.emailNotifications?.shifts || false,
                    onChange: () => toggleNotification('shifts'),
                    isPremium: false
                },
                {
                    id: 'push',
                    title: t('push_notif') || 'Notifiche Push',
                    description: t('push_notif_desc') || 'Notifiche immediate sul dispositivo',
                    icon: Bell,
                    type: 'toggle',
                    value: settings?.pushNotifications || false,
                    onChange: (val) => updateSettings('pushNotifications', val),
                    isPremium: false
                }
            ]
        },
        !isEmployee && {
            title: t('security') || 'Sicurezza & Dati',
            items: [
                {
                    id: 'export',
                    title: t('export_data') || 'Esporta Dati',
                    description: t('export_desc') || 'Scarica un backup dei tuoi dati',
                    icon: Download,
                    type: 'button',
                    isPremium: false,
                    onClick: () => setActiveModal('export')
                },
                {
                    id: 'analytics',
                    title: t('analytics') || 'Analisi Avanzate',
                    description: t('analytics_desc') || 'Statistiche dettagliate',
                    icon: BarChart2,
                    type: 'button',
                    isPremium: false,
                    onClick: () => setActiveModal('analytics')
                }
            ]
        }
    ].filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 max-w-4xl mx-auto pb-24"
        >
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('settings_title') || 'Impostazioni'}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('settings_subtitle') || 'Gestisci le tue preferenze e account'}</p>
                </div>
                {isPremium && !isEmployee && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-full"
                    >
                        <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" />
                        <span className="font-bold text-yellow-700 dark:text-yellow-400">{t('premium_member') || 'Membro Premium'}</span>
                    </motion.div>
                )}
            </div>

            <div className="space-y-8">
                {sections.map((section) => (
                    <motion.section
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-1">{section.title}</h3>
                        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden transition-colors">
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {section.items.map((item) => (
                                    <SettingItem
                                        key={item.id}
                                        {...item}
                                        isLocked={item.isPremium && !isPremium}
                                        onLockClick={onOpenPremium}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.section>
                ))}
            </div>

            {/* Modals Rendering */}
            {activeModal === 'profile' && (
                <Modal title={t('edit_profile') || 'Modifica Profilo'} onClose={() => setActiveModal(null)}>
                    <ProfileForm />
                </Modal>
            )}
            {activeModal === 'password' && (
                <Modal title={t('change_password') || 'Cambia Password'} onClose={() => setActiveModal(null)}>
                    <PasswordForm />
                </Modal>
            )}
            {activeModal === 'export' && (
                <Modal title={t('export_data') || 'Esporta Dati'} onClose={() => setActiveModal(null)}>
                    <ExportModal />
                </Modal>
            )}
            {activeModal === 'analytics' && (
                <Modal title={t('analytics') || 'Analisi Avanzate'} onClose={() => setActiveModal(null)}>
                    <AnalyticsView />
                </Modal>
            )}
        </motion.div>
    );
};

export default SettingsView;