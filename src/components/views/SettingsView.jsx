import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Globe, Moon, Calendar,
    Mail, Bell, Shield, Download, BarChart2,
    X, Check, Zap
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
        t
    } = useAppContext();

    const isPremium = user?.is_premium;
    const [activeModal, setActiveModal] = useState(null); // 'profile' | 'password' | null

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
        // Prendiamo anche 'business' dal context per pre-compilare i campi
        const { business } = useAppContext();

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

                {/* SEZIONE ATTIVITÀ */}
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

                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-dark-surface pb-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Annulla</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">Salva Tutto</button>
                </div>
            </form>
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
                {
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
            ]
        },
        {
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
        {
            title: t('security') || 'Sicurezza & Dati',
            items: [
                {
                    id: '2fa',
                    title: t('two_factor') || 'Autenticazione a 2 Fattori',
                    description: t('two_factor_desc') || 'Aumenta la sicurezza del tuo account',
                    icon: Shield,
                    type: 'toggle',
                    value: settings?.twoFactorEnabled || false,
                    onChange: (val) => updateSettings('twoFactorEnabled', val),
                    isPremium: true // LOCKATO
                },
                {
                    id: 'export',
                    title: t('export_data') || 'Esporta Dati',
                    description: t('export_desc') || 'Scarica un backup dei tuoi dati',
                    icon: Download,
                    type: 'button',
                    isPremium: true, // LOCKATO
                    onClick: () => console.log('Open export')
                },
                {
                    id: 'analytics',
                    title: t('analytics') || 'Analisi Avanzate',
                    description: t('analytics_desc') || 'Statistiche dettagliate',
                    icon: BarChart2,
                    type: 'button',
                    isPremium: true, // LOCKATO
                    onClick: () => console.log('Open analytics')
                }
            ]
        }
    ];

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
                {isPremium && (
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
        </motion.div>
    );
};

export default SettingsView;