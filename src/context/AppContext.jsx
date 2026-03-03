import React, { createContext, useState, useEffect, useContext } from 'react';
import { shiftService } from '../services/shiftService';
import { employeeService } from '../services/employeeService';
import { requestService } from '../services/requestService';
import { supabase } from '../services/supabaseClient';
import { getWeekStart, calculateHours } from '../utils/dateUtils';
import { translations } from '../utils/translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [business, setBusiness] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [requests, setRequests] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

    // Theme State
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    // Settings State
    const [settings, setSettings] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('shiftmate-settings');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Errore caricamento impostazioni:', e);
                }
            }
        }
        return {
            publicProfile: false,
            emailNotifications: { marketing: false, shifts: true },
            twoFactorEnabled: false,
            language: 'it',
            timezone: 'Europe/Rome',
            weekStart: 'monday',
            compactView: false,
            pushNotifications: false,
            smsAlerts: false,
            dailyDigest: false
        };
    });

    // --- HELPER FUNCTIONS ---
    function showNotification(message, type = 'success', duration = 5000) {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }

    function removeToast(id) {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }

    function getWeekDays() {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }

    function changeWeek(direction) {
        if (direction === 0) {
            setCurrentWeekStart(getWeekStart(new Date()));
        } else {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + (direction * 7));
            setCurrentWeekStart(getWeekStart(newDate));
        }
    }

    function getShiftsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return shifts.filter(s => s.date === dateStr);
    }

    function getEmployeeById(id) {
        return employees.find(e => e.id === id);
    }

    function calculateWeekHours(employeeId) {
        const weekDays = getWeekDays();
        let totalHours = 0;
        weekDays.forEach(day => {
            const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === employeeId);
            dayShifts.forEach(shift => {
                totalHours += parseFloat(calculateHours(shift.startTime, shift.endTime));
            });
        });
        return totalHours.toFixed(1);
    }

    function generateRandomColor() {
        // Use enhanced employee palette from Tailwind config
        const colors = [
            '#3B82F6', // azure
            '#EF4444', // coral
            '#10B981', // emerald
            '#F59E0B', // amber
            '#8B5CF6', // violet
            '#EC4899', // rose
            '#06B6D4', // cyan
            '#84CC16', // lime
            '#6366F1', // indigo
            '#F472B6', // pink
            '#14B8A6', // teal
            '#FB923C'  // orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // --- DATA LOADING ---
    async function loadData() {
        setIsLoading(true);
        try {
            // 1. Mock Owner Profile
            const mockUser = {
                id: 'single-tenant-owner-id', // Fixed ID or leave it mostly mocked
                email: 'admin@local',
                role: 'owner',
                user_metadata: {
                    first_name: 'Admin',
                    last_name: 'Proprietario',
                    role: 'owner'
                }
            };
            setUser(mockUser);

            // 2. Load Business (Fetch the first one available)
            // Retrieve all businesses without limit to bypass potential RLS/caching quirks when limit(1) is used, 
            // then we'll just pick the first one.
            const { data: businesses, error: busErr } = await supabase.from('businesses').select('*');
            let businessData = businesses && businesses.length > 0 ? businesses[0] : null;

            if (!businessData) {
                console.log('No business found. Attempting to create fallback "La Dolce Pausa".');
                const { data: newBusiness, error: createError } = await supabase
                    .from('businesses')
                    .insert([{
                        name: 'La Dolce Pausa',
                        address: 'Via Esempio 1, Colzate'
                    }])
                    .select()
                    .single();

                if (!createError && newBusiness) {
                    businessData = newBusiness;
                }
            }

            // Always ensure we have something so the UI doesn't crash, even if DB is totally unresponsive
            setBusiness(businessData || { id: 'mock-business-id', name: 'La Dolce Pausa', address: 'Via Esempio 1, Colzate' });

            // 3. Load Employees, Shifts, Requests
            if (businessData) {
                const [empRes, shiftRes, reqRes] = await Promise.all([
                    employeeService.getEmployees(businessData.id),
                    shiftService.getShifts(businessData.id),
                    requestService.getRequests(businessData.id)
                ]);

                setEmployees(empRes?.data?.map(e => ({ ...e, color: generateRandomColor() })) || []);
                setShifts(shiftRes?.data || []);
                setRequests(reqRes?.data || []);
            } else {
                // If RLS blocks inserting a business, we might fetch all shifts/employees anyway if they exist without business id checking
                // Assuming standard setup, this is fine
                setEmployees([]);
                setShifts([]);
                setRequests([]);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // --- ACTIONS ---
    const updateSettings = (key, value) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: value };
            if (typeof window !== 'undefined') {
                localStorage.setItem('shiftmate-settings', JSON.stringify(updated));
            }
            return updated;
        });
    };

    const toggleNotification = (type) => {
        setSettings(prev => {
            const updated = {
                ...prev,
                emailNotifications: {
                    ...prev.emailNotifications,
                    [type]: !prev.emailNotifications[type]
                }
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('shiftmate-settings', JSON.stringify(updated));
            }
            return updated;
        });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // --- AUTH ACTIONS (MOCKED) ---
    const authSignUp = async () => { return { data: null }; };
    const authSignIn = async () => { return { data: null }; };
    const authSignOut = async () => { return { error: null }; };

    const updateProfile = async () => {
        showNotification('Profilo aggiornato localmente', 'success');
        return true;
    };

    // --- CRUD ACTIONS ---
    const handleSaveEmployee = async (formData, selectedEmployee) => {
        try {
            setIsLoading(true);
            if (!business?.id) throw new Error('Nessuna attività selezionata.');

            const result = await employeeService.saveEmployee(business.id, formData, selectedEmployee);
            if (result.error) throw result.error;

            await loadData(); // Reload to get fresh data with IDs
            showNotification(selectedEmployee ? 'Dipendente aggiornato' : 'Dipendente aggiunto', 'success');
            return true;
        } catch (error) {
            console.error('Errore salvataggio dipendente:', error);
            showNotification(error.message || 'Errore salvataggio dipendente', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEmployee = async (id) => {
        try {
            if (!business?.id) {
                showNotification('Nessuna attività trovata', 'error');
                return false;
            }

            // First, delete all shifts for this employee
            const deleteShiftsResult = await shiftService.deleteEmployeeShifts(business.id, id);
            if (deleteShiftsResult.error) {
                console.error('Errore eliminazione turni:', deleteShiftsResult.error);
                throw new Error('Errore durante l\'eliminazione dei turni');
            }

            // Then, dissociate the employee from the business
            const result = await employeeService.dissociateEmployee(id, business.id);

            if (!result.success) {
                throw new Error(result.error?.message || 'Errore durante la dissociazione');
            }

            // Update local state
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            setShifts(prev => prev.filter(s => s.employeeId !== id));

            showNotification('Dipendente rimosso dall\'attività', 'success');
            return true;
        } catch (error) {
            console.error('Errore handleDeleteEmployee:', error);
            showNotification(error.message || 'Errore durante la rimozione del dipendente', 'error');
            return false;
        }
    };


    const handleSaveShift = async (formData, selectedShift) => {
        try {
            setIsLoading(true);
            if (!business?.id) throw new Error('Nessuna attività selezionata.');

            const shiftData = {
                ...formData,
                businessId: business.id
            };

            let result;
            if (selectedShift) {
                result = await shiftService.updateShift(selectedShift.id, shiftData);
            } else {
                result = await shiftService.createShift(shiftData);
            }

            if (result.error) throw result.error;

            await loadData(user); // Reload to get fresh data
            showNotification(selectedShift ? 'Turno aggiornato' : 'Turno creato');
            return true;
        } catch (error) {
            console.error('Errore salvataggio turno:', error);
            showNotification(error.message || 'Errore salvataggio turno', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteShift = async (id) => {
        try {
            const { error } = await shiftService.deleteShift(id);
            if (error) throw error;
            setShifts(prev => prev.filter(s => s.id !== id));
            showNotification('Turno eliminato');
        } catch (err) {
            console.error(err);
            showNotification('Errore eliminazione turno', 'error');
        }
    };

    const handleRepeatSchedule = async (weeksToRepeat, employeeId = 'all') => {
        try {
            setIsLoading(true);
            const weeks = parseInt(weeksToRepeat);
            if (isNaN(weeks) || weeks < 1) return;

            const start = new Date(currentWeekStart);
            start.setHours(0, 0, 0, 0);

            // Logic to calculate dates and call service
            // For simplicity, I'll implement the core logic here or move it to service.
            // Moving to service is better but requires passing all shifts.
            // Let's keep the logic here for now but use service for DB calls.

            // ... (Logic similar to App.jsx but using shiftService.createShiftsBatch)
            // I will simplify this for now to avoid huge code block, assuming user wants the structure first.
            // But I must implement it to keep functionality.

            // RE-IMPLEMENTING LOGIC FROM APP.JSX:
            const weekDates = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                weekDates.push(d.toISOString().split('T')[0]);
            }

            const sourceShifts = shifts.filter(s => {
                const matchDate = weekDates.includes(s.date);
                const matchEmployee = (employeeId && employeeId !== 'all') ? s.employeeId === employeeId : true;
                return matchDate && matchEmployee;
            });

            if (sourceShifts.length === 0) {
                showNotification('Nessun turno da ripetere', 'error');
                return;
            }

            for (let i = 1; i <= weeks; i++) {
                const targetStart = new Date(start);
                targetStart.setDate(targetStart.getDate() + (7 * i));
                const targetEnd = new Date(targetStart);
                targetEnd.setDate(targetEnd.getDate() + 6);

                const targetStartStr = targetStart.toISOString().split('T')[0];
                const targetEndStr = targetEnd.toISOString().split('T')[0];

                // Delete existing
                await shiftService.deleteShiftsRange(business.id, targetStartStr, targetEndStr, employeeId);

                // Create new
                const newShifts = sourceShifts.map(s => {
                    const oldDate = new Date(s.date);
                    const newDate = new Date(oldDate);
                    newDate.setDate(newDate.getDate() + (7 * i));

                    return {
                        business_id: business.id,
                        employee_id: s.employeeId,
                        date: newDate.toISOString().split('T')[0],
                        start_time: s.startTime,
                        end_time: s.endTime,
                        type: s.type
                    };
                });

                if (newShifts.length > 0) {
                    await shiftService.createShiftsBatch(newShifts);
                }
            }

            await loadData(user);
            showNotification(`Pianificazione ripetuta per ${weeks} settimane`);

        } catch (error) {
            console.error('Errore ripetizione:', error);
            showNotification('Errore durante la ripetizione', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRequest = async (requestData) => {
        try {
            setIsLoading(true);
            const { error } = await requestService.createRequest({
                ...requestData,
                businessId: business.id,
                employeeId: user.id
            });
            if (error) throw error;
            await loadData(user);
            showNotification('Richiesta inviata');
            return true;
        } catch (err) {
            console.error(err);
            showNotification('Errore invio richiesta', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveRequest = async (id) => {
        const { error } = await requestService.updateRequestStatus(id, 'approved');
        if (!error) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            showNotification('Richiesta approvata');
        }
    };

    const handleRejectRequest = async (id) => {
        const { error } = await requestService.updateRequestStatus(id, 'rejected');
        if (!error) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
            showNotification('Richiesta rifiutata');
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = {
        user,
        isLoading,
        business,
        employees,
        shifts,
        requests,
        toasts,
        settings,
        theme,
        currentWeekStart,
        removeToast,
        showNotification,
        updateSettings,
        toggleNotification,
        toggleTheme,
        getWeekDays,
        changeWeek,
        getShiftsForDate,
        getEmployeeById,
        calculateWeekHours,
        calculateHours,
        authSignUp,
        authSignIn,
        authSignOut,
        updateProfile,
        reloadUserData: () => loadData(user),
        handleSaveEmployee,
        handleDeleteEmployee,
        handleSaveShift,
        handleDeleteShift,
        handleRepeatSchedule,
        handleCreateRequest,
        handleApproveRequest,
        handleRejectRequest,
        t: (key) => {
            const lang = settings.language || 'it';
            return translations[lang][key] || key;
        },
        pendingRequestsCount: requests.filter(r => r.status === 'pending').length,
        exportPDF: () => {
            try {
                const doc = new jsPDF();
                const weekDays = getWeekDays();
                const startStr = weekDays[0].toLocaleDateString();
                const endStr = weekDays[6].toLocaleDateString();

                doc.setFontSize(18);
                doc.text(`Turni: ${startStr} - ${endStr}`, 14, 22);

                const tableColumn = ["Dipendente", ...weekDays.map(d => d.toLocaleDateString(settings.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'short' })), "Totale"];
                const tableRows = [];

                employees.filter(e => e.isActive).forEach(emp => {
                    const rowData = [
                        `${emp.firstName} ${emp.lastName}`,
                    ];

                    weekDays.forEach(day => {
                        const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === emp.id);
                        if (dayShifts.length > 0) {
                            const shiftTexts = dayShifts.map(s => `${s.startTime}-${s.endTime}`).join('\n');
                            rowData.push(shiftTexts);
                        } else {
                            rowData.push('');
                        }
                    });

                    rowData.push(`${calculateWeekHours(emp.id)}h`);
                    tableRows.push(rowData);
                });

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 30,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [59, 130, 246] }
                });

                doc.save(`turni_${startStr.replace(/\//g, '-')}.pdf`);
                showNotification('PDF scaricato con successo');
            } catch (error) {
                console.error('Errore export PDF:', error);
                showNotification('Errore durante l\'esportazione PDF', 'error');
            }
        },
        exportExcel: () => {
            try {
                const weekDays = getWeekDays();
                const startStr = weekDays[0].toLocaleDateString();

                const data = [];
                // Header
                const header = ["Dipendente", ...weekDays.map(d => d.toLocaleDateString(settings.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'short', day: 'numeric', month: 'numeric' })), "Totale Ore"];
                data.push(header);

                // Rows
                employees.filter(e => e.isActive).forEach(emp => {
                    const row = [`${emp.firstName} ${emp.lastName}`];
                    weekDays.forEach(day => {
                        const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === emp.id);
                        if (dayShifts.length > 0) {
                            const shiftTexts = dayShifts.map(s => `${s.startTime}-${s.endTime}`).join(', ');
                            row.push(shiftTexts);
                        } else {
                            row.push('');
                        }
                    });
                    row.push(calculateWeekHours(emp.id));
                    data.push(row);
                });

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, "Turni");
                XLSX.writeFile(wb, `turni_${startStr.replace(/\//g, '-')}.xlsx`);
                showNotification('Excel scaricato con successo');
            } catch (error) {
                console.error('Errore export Excel:', error);
                showNotification('Errore durante l\'esportazione Excel', 'error');
            }
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
