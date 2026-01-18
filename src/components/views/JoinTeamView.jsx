import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Briefcase, UserPlus, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';

const JoinTeamView = ({ onCreateBusiness }) => {
    const { user, showNotification, loadData } = useAppContext();
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Cerca il business con quel codice
            const { data: business, error: findError } = await supabase
                .from('businesses')
                .select('id, name')
                .eq('join_code', joinCode.toUpperCase())
                .single();

            if (findError || !business) {
                throw new Error("Codice non valido. Chiedi al tuo titolare il codice corretto.");
            }

            // 2. Collega il profilo utente a questo business
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    business_id: business.id,
                    role: 'employee'
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 3. (Opzionale) Se esiste già una riga nella tabella 'employees' con questa email, 
            // potremmo collegare l'ID utente Auth a quella riga per sincronizzarli.
            // Per ora ci accontentiamo di collegare il profilo.

            showNotification(`Benvenuto nel team di ${business.name}!`, 'success');

            // 4. Ricarica i dati per aggiornare l'interfaccia
            await loadData(user);

        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

                {/* CARD 1: DIPENDENTE */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30"
                >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6">
                        <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sono un Dipendente</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Inserisci il codice univoco che ti ha fornito il tuo titolare per accedere ai tuoi turni.
                    </p>

                    <form onSubmit={handleJoinTeam} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codice Team</label>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Es. X7K9P2"
                                className="w-full p-3 text-center text-2xl tracking-widest uppercase font-mono border border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white"
                                maxLength={7}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || joinCode.length < 3}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Verifica in corso...' : 'Entra nel Team'} <UserPlus className="w-5 h-5" />
                        </button>
                    </form>
                </motion.div>

                {/* CARD 2: TITOLARE */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl border border-orange-100 dark:border-orange-900/30 flex flex-col justify-center"
                >
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-6">
                        <Briefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sono un Titolare</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Devi gestire i turni del tuo locale? Crea una nuova attività e inizia a organizzare il lavoro.
                    </p>

                    <button
                        onClick={onCreateBusiness}
                        className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold transition-colors"
                    >
                        Registra la mia Attività
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

export default JoinTeamView;