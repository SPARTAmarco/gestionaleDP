import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Bell, TrendingUp, DollarSign } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';

const PremiumModal = ({ onClose }) => {
    // Prendiamo l'utente (per l'email) e la funzione per le notifiche
    const { user, showNotification, t } = useAppContext();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Inizializza Stripe con la CHIAVE PUBBLICA che hai messo nel file .env
    // È importante farlo fuori dal render per evitare di ricaricarlo ogni volta.

    // SOSTITUISCI IL VECCHIO handlePremiumClick CON QUESTO:

    const handlePremiumClick = async () => {
        setIsRedirecting(true);

        if (!user || !user.email) {
            showNotification("Errore: utente non trovato o email mancante.", "error");
            setIsRedirecting(false);
            return;
        }

        try {
            // Ottieni l'URL base dell'applicazione
            const baseUrl = window.location.origin;

            // 1. CHIAMA IL BACKEND con email, baseUrl e userId
            const { data, error } = await supabase.functions.invoke(
                'create-checkout-session',
                {
                    body: JSON.stringify({
                        email: user.email,
                        baseUrl: baseUrl,
                        userId: user.id
                    })
                }
            );

            if (error) {
                throw new Error(`Errore Chiamata Funzione: ${error.message}`);
            }

            // 2. NUOVA GESTIONE DELL'URL
            if (!data || !data.url) {
                throw new Error("Risposta non valida dal server, URL mancante.");
            }

            // 3. REINDIRIZZA MANUALMENTE
            // Questo sostituisce il vecchio 'redirectToCheckout'
            window.location.href = data.url;

        } catch (error) {
            console.error("Errore nel processo di checkout:", error);
            showNotification(error.message || 'Impossibile avviare il pagamento', 'error');
            setIsRedirecting(false); // Sblocca il pulsante in caso di errore
        }
    };

    return (
        // AnimatedModal è la funzione che abbiamo definito nel refactoring
        <AnimatedModal title={t('premium_plans_title')} onClose={onClose}>
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <p className="text-gray-600 dark:text-gray-400">{t('premium_plans_desc')}</p>

                <div className="grid md:grid-cols-2 gap-4">

                    {/* --- PIANO BASE (CORRETTO) --- */}
                    <div className="border-2 border-blue-100 dark:border-blue-900/30 rounded-xl p-5 shadow-lg bg-white dark:bg-dark-surface transition-colors">
                        <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t('plan_base')}</h4>
                        <p className="text-4xl font-extrabold my-2 text-gray-900 dark:text-white">
                            €0<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mese</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('plan_base_desc')}</p>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('feature_manual_shifts')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('feature_employees')}</li>
                            <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold"><TrendingUp className="w-4 h-4" /> {t('feature_export')}</li>
                        </ul>
                        <button
                            disabled
                            className="w-full mt-5 py-2 bg-blue-500 text-white rounded-lg opacity-70 cursor-not-allowed font-medium"
                        >
                            {t('current_plan')}
                        </button>
                    </div>

                    {/* --- PIANO PREMIUM (ATTIVO) --- */}
                    <motion.div
                        className="border-2 border-yellow-500 rounded-xl p-5 shadow-2xl relative bg-yellow-50 dark:bg-yellow-900/10 transition-colors"
                        whileHover={!isRedirecting ? { scale: 1.02, y: -5 } : {}}
                    >
                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">TOP</div>
                        <h4 className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">{t('plan_premium')}</h4>
                        <p className="text-4xl font-extrabold my-2 text-gray-900 dark:text-white">
                            €19<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mese</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('plan_premium_desc')}</p>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('feature_all_base')}</li>
                            <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-500" /> {t('feature_ai_shifts')}</li>
                            <li className="flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-500" /> {t('feature_notifications')}</li>
                            <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-500" /> {t('feature_advanced_reports')}</li>
                        </ul>
                        <motion.button
                            onClick={handlePremiumClick}
                            disabled={isRedirecting}
                            className="w-full mt-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors font-bold shadow-lg flex items-center justify-center gap-2"
                            whileHover={!isRedirecting ? { scale: 1.05 } : {}}
                            whileTap={!isRedirecting ? { scale: 0.95 } : {}}
                        >
                            {isRedirecting ? (
                                <>
                                    <motion.div
                                        className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ loop: Infinity, ease: "linear", duration: 1 }}
                                    />
                                    <span>{t('loading')}</span>
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-5 h-5" />
                                    {t('activate_premium')}
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </AnimatedModal>
    );
};

export default PremiumModal;
