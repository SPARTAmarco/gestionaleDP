import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Briefcase, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import EmailVerificationModal from '../modals/EmailVerificationModal';

const AuthView = () => {
    const { authSignIn, authSignUp } = useAppContext();

    const [isLoginView, setIsLoginView] = useState(true);
    const [userType, setUserType] = useState('owner'); // 'owner' | 'employee'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [emailVerificationMessage, setEmailVerificationMessage] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        businessName: '',
        address: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted. UserType:", userType, "IsLogin:", isLoginView); // DEBUG

        // VALIDAZIONE MANUALE
        if (!formData.email || !formData.password) {
            setError("Email e Password sono obbligatorie.");
            return;
        }
        if (!isLoginView) {
            if (!formData.firstName || !formData.lastName) {
                setError("Nome e Cognome sono obbligatori.");
                return;
            }
            if (userType === 'owner' && (!formData.businessName || !formData.address || !formData.phone)) {
                setError("Tutti i dati dell'attività sono obbligatori.");
                return;
            }
        }

        setLoading(true);
        setError(null);

        let result;
        try {
            if (isLoginView) {
                // LOGIN
                console.log("Attempting login for:", formData.email); // DEBUG
                result = await authSignIn(formData.email, formData.password);
            } else {
                // REGISTRAZIONE
                console.log("Attempting registration as:", userType); // DEBUG
                const finalData = {
                    ...formData,
                    role: userType,
                    businessName: userType === 'owner' ? formData.businessName : '',
                    address: userType === 'owner' ? formData.address : '',
                    phone: userType === 'owner' ? formData.phone : '',
                };
                console.log("Registration data:", finalData); // DEBUG

                result = await authSignUp(finalData);

                if (!result.error) {
                    console.log("Registration success!"); // DEBUG
                    // Mostra modale personalizzata invece di alert
                    setEmailVerificationMessage(userType === 'owner'
                        ? 'Attività registrata! Controlla la tua email per confermare.'
                        : 'Account creato! Accedi per unirti al team.');
                    setShowEmailVerificationModal(true);
                    setIsLoginView(true);
                }
            }

            if (result.error) {
                console.error("Auth error:", result.error); // DEBUG
                setError(result.error.message || "Si è verificato un errore sconosciuto.");
            }
        } catch (err) {
            console.error("Unexpected error in handleSubmit:", err); // DEBUG
            setError("Errore imprevisto: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors">
            <div className="bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
                        <LogIn className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isLoginView ? 'Bentornato' : 'Crea Account'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {isLoginView ? 'Inserisci le credenziali per accedere' : 'Inizia a gestire i turni in modo semplice'}
                    </p>
                </div>

                {/* SELETTORE TIPO UTENTE (Solo in Registrazione) */}
                {!isLoginView && (
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setUserType('owner')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${userType === 'owner'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Briefcase className="w-4 h-4" /> Titolare
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('employee')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${userType === 'employee'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <User className="w-4 h-4" /> Dipendente
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                    {/* Campi visibili SOLO in registrazione */}
                    {!isLoginView && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                                name="firstName"
                                placeholder="Nome"
                                onChange={handleChange}
                                required
                                className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                name="lastName"
                                placeholder="Cognome"
                                onChange={handleChange}
                                required
                                className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Campi SOLO per TITOLARE in registrazione */}
                    {!isLoginView && userType === 'owner' && (
                        <div className="border-l-2 border-blue-500 pl-3 py-1 my-2 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Dati Attività</p>
                            <input
                                name="businessName"
                                placeholder="Nome Attività (es. Bar Centrale)"
                                onChange={handleChange}
                                required
                                className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                name="address"
                                placeholder="Via, Città"
                                onChange={handleChange}
                                required
                                className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                name="phone"
                                placeholder="Telefono"
                                onChange={handleChange}
                                required
                                className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Email e Password (Sempre visibili) */}
                    <div className="space-y-3">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {loading ? 'Elaborazione...' : (isLoginView ? 'Accedi' : (userType === 'owner' ? 'Registra Attività' : 'Crea Account'))}
                    </motion.button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => { setIsLoginView(!isLoginView); setError(null); }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        {isLoginView
                            ? <span>Non hai un account? <span className="font-bold text-blue-600 dark:text-blue-400">Registrati</span></span>
                            : <span>Hai già un account? <span className="font-bold text-blue-600 dark:text-blue-400">Accedi</span></span>
                        }
                    </button>
                </div>
            </div>
            {showEmailVerificationModal && (
                <EmailVerificationModal
                    message={emailVerificationMessage}
                    onClose={() => setShowEmailVerificationModal(false)}
                />
            )}
        </div>
    );
};

export default AuthView;
