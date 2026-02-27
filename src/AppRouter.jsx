import React, { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { supabase } from './services/supabaseClient';

// Views
// Views
import WarehouseView from './components/views/WarehouseView'; // [NEW]

// Layout & UI
import Layout from './components/layout/Layout';
import Notification from './components/ui/Notification';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Modals
import EmployeeModal from './components/modals/EmployeeModal';
import ShiftModal from './components/modals/ShiftModal';
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
            case 'warehouse': // [NEW]
                return <WarehouseView />;
            case 'requests':
                return <RequestsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} onOpenRepeatWeeksModal={() => setShowRepeatWeeksModal(true)} />;
        }
    };

    // --- RENDERING APP ---
    // In single-tenant mode, everyone is the owner
    return (
        <>
            <Layout
                currentView={currentView}
                setCurrentView={setCurrentView}
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
};

export default AppRouter;
