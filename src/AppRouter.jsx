import React, { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { supabase } from './services/supabaseClient';

// Views
import AuthView from './components/views/AuthView';
import JoinTeamView from './components/views/JoinTeamView';
import DashboardView from './components/views/DashboardView';
import EmployeesView from './components/views/EmployeesView';
import RequestsView from './components/views/RequestsView';
import SettingsView from './components/views/SettingsView';

// Layout & UI
import Layout from './components/layout/Layout';
import Notification from './components/ui/Notification';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Modals
import EmployeeModal from './components/modals/EmployeeModal';
import ShiftModal from './components/modals/ShiftModal';
import PremiumModal from './components/modals/PremiumModal';
import RepeatWeeksModal from './components/modals/RepeatWeeksModal';

const AppRouter = () => {
    // 1. PRENDI LO STATO GLOBALE
    const {
        user,
        isLoading,
        business,
        showNotification,
        reloadUserData,
        handleSaveEmployee,
        handleSaveShift,
        handleDeleteShift,
        handleRepeatSchedule
    } = useAppContext();

    // 2. STATO DI NAVIGAZIONE
    const [currentView, setCurrentView] = useState('dashboard');

    // 3. STATO DEI MODALI
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [modalInitialDate, setModalInitialDate] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);
    const [showRepeatWeeksModal, setShowRepeatWeeksModal] = useState(false);

    // 4. FUNZIONI HELPER PER I MODALI
    const openAddEmployee = () => { setSelectedEmployee(null); setShowEmployeeModal(true); };
    const openEditEmployee = (emp) => { setSelectedEmployee(emp); setShowEmployeeModal(true); };
    const openViewDetails = (emp) => { setSelectedEmployee(emp); setShowEmployeeModal(true); };

    const openAddShift = (date = null) => {
        setModalInitialDate(date);
        setSelectedShift(null);
        setShowShiftModal(true);
    };
    const openEditShift = (shift) => { setSelectedShift(shift); setShowShiftModal(true); };

    const onSaveEmployee = async (formData) => {
        const success = await handleSaveEmployee(formData, selectedEmployee);
        if (success) {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
        }
    };

    const onSaveShift = async (formData) => {
        const success = await handleSaveShift(formData, selectedShift);
        if (success) {
            setShowShiftModal(false);
            setSelectedShift(null);
        }
    };

    const onDeleteShift = async () => {
        if (selectedShift) {
            await handleDeleteShift(selectedShift.id);
            setShowShiftModal(false);
            setSelectedShift(null);
        }
    };

    // 5. FUNZIONE PER RENDERIZZARE LA VISTA CORRETTA
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} onOpenRepeatWeeksModal={() => setShowRepeatWeeksModal(true)} />;
            case 'employees':
                return <EmployeesView onAddEmployee={openAddEmployee} onViewDetails={openViewDetails} />;
            case 'requests':
                return <RequestsView />;
            case 'settings':
                return <SettingsView onOpenPremium={() => setShowPremiumModal(true)} />;
            default:
                return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} onOpenRepeatWeeksModal={() => setShowRepeatWeeksModal(true)} />;
        }
    };

    // 6. EFFETTO PER I REDIRECT DI STRIPE
    useEffect(() => {
        const currentPath = window.location.pathname;
        const queryParams = new URLSearchParams(window.location.search);
        const sessionId = queryParams.get('session_id');
        const wasCanceled = queryParams.get('canceled');

        const needsCleanup =
            currentPath.includes('/success') ||
            currentPath.includes('/declined') ||
            currentPath.includes('/canceled') ||
            currentPath.includes('/failed');

        if (needsCleanup) {
            window.history.replaceState(null, null, '/');
        }

        if (sessionId) {
            const verifyPayment = async () => {
                try {
                    console.log('🔍 Verifica pagamento per session_id:', sessionId);

                    const { data, error } = await supabase.functions.invoke(
                        'verify-payment',
                        {
                            body: JSON.stringify({ session_id: sessionId })
                        }
                    );

                    if (error) {
                        console.error('❌ Errore nella chiamata verify-payment:', error);
                        throw new Error(error.message || error.error || 'Errore sconosciuto');
                    }

                    if (data && data.success) {
                        console.log('✅ Pagamento verificato con successo!');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await reloadUserData();

                        const { data: { session } } = await supabase.auth.getSession();
                        if (session && session.user) {
                            const { data: profileCheck } = await supabase
                                .from('profiles')
                                .select('is_premium')
                                .eq('id', session.user.id)
                                .single();

                            if (profileCheck && profileCheck.is_premium) {
                                showNotification('🎉 Benvenuto in Premium! Il tuo account è stato aggiornato.', 'success');
                            } else {
                                // Fallback: aggiorna direttamente dal frontend
                                await supabase
                                    .from('profiles')
                                    .update({ is_premium: true })
                                    .eq('id', session.user.id);

                                await reloadUserData();
                                showNotification('🎉 Benvenuto in Premium! Il tuo account è stato aggiornato.', 'success');
                            }
                        }
                    } else {
                        console.warn('⚠️ Pagamento non completato:', data);
                        showNotification(data?.message || 'Il pagamento non è stato completato.', 'error');
                    }
                } catch (error) {
                    console.error("❌ Errore nella verifica del pagamento:", error);
                    showNotification(`Errore: ${error.message}. Contatta il supporto se il problema persiste.`, 'error');
                } finally {
                    window.history.replaceState(null, null, '/');
                }
            };

            verifyPayment();
        } else if (wasCanceled === 'true') {
            console.log('❌ Pagamento annullato dall\'utente');
            showNotification('Pagamento annullato. Puoi sempre attivare Premium in seguito!', 'info');
            window.history.replaceState(null, null, '/');
        }
    }, [showNotification, reloadUserData]);

    // --- ROUTING LOGIC ---

    if (isLoading) return <LoadingSpinner />;

    // 1. Se non sei loggato -> Login
    if (!user) return <AuthView />;

    // 2. DETERMINAZIONE RUOLO
    const isOwner =
        (user?.role === 'owner') ||
        (user?.user_metadata?.role === 'owner') ||
        (business?.owner_id === user?.id);

    const hasBusiness = user?.business_id || user?.user_metadata?.business_id;

    // --- CASO A: SEI UN TITOLARE ---
    if (isOwner) {
        return (
            <>
                <Layout
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    onOpenPremium={() => setShowPremiumModal(true)}
                >
                    {renderView()}
                </Layout>

                <Notification />

                {/* Modali del Titolare */}
                {showEmployeeModal && (
                    <EmployeeModal
                        employee={selectedEmployee}
                        onSave={onSaveEmployee}
                        onClose={() => setShowEmployeeModal(false)}
                        readOnly={!!selectedEmployee}
                    />
                )}
                {showShiftModal && (
                    <ShiftModal
                        shift={selectedShift}
                        initialDate={modalInitialDate}
                        onSave={onSaveShift}
                        onDelete={selectedShift ? onDeleteShift : null}
                        onClose={() => setShowShiftModal(false)}
                    />
                )}
                {showPremiumModal && (
                    <PremiumModal onClose={() => setShowPremiumModal(false)} />
                )}
                {showRepeatWeeksModal && (
                    <RepeatWeeksModal
                        onConfirm={(weeks, employeeId) => {
                            handleRepeatSchedule(weeks.toString(), employeeId);
                            setShowRepeatWeeksModal(false);
                        }}
                        onClose={() => setShowRepeatWeeksModal(false)}
                    />
                )}
            </>
        );
    }

    // --- CASO B: SEI UN DIPENDENTE ---
    // Se non hai ancora un team -> Schermata "Unisciti al Team"
    if (!hasBusiness) {
        return (
            <JoinTeamView
                onCreateBusiness={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                }}
            />
        );
    }

    // Se hai un team -> Dashboard Dipendente
    // Nota: EmployeeDashboard è un componente a parte, non una "View" nel Layout del titolare
    // Potremmo doverlo importare.
    // App.jsx importava EmployeeDashboard.
    // Ma aspetta, EmployeeDashboard è importato?
    // Sì, in App.jsx c'era `import EmployeeDashboard from './components/views/EmployeeDashboard';`
    // Ma qui non l'ho importato. Aggiungo import.

    // Ho bisogno di importare EmployeeDashboard!
    // Lo faccio dinamicamente o aggiungo l'import sopra.
    // Per ora uso require o aggiungo l'import.
    // Riscrivo il file con l'import corretto.

    return (
        <>
            <EmployeeDashboardWrapper />
            <Notification />
        </>
    );
};

// Wrapper per lazy load o import diretto
import EmployeeDashboard from './components/views/EmployeeDashboard';
const EmployeeDashboardWrapper = () => <EmployeeDashboard />;

export default AppRouter;
