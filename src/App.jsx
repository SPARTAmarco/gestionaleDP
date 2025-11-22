import { supabase } from './supabaseClient';
import SettingsView from './components/views/SettingsView';
import { translations } from './utils/translations';
import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  Calendar, Users, Bell, Settings, LogOut, Plus,
  ChevronLeft, ChevronRight, Menu, X, Clock,
  Download, TrendingUp, AlertCircle, CheckCircle,
  Search, Filter, Edit2, Trash2, XCircle, DollarSign, Zap, Moon, Sun, Lock, Globe, Shield, Mail, User
} from 'lucide-react';
// Importa i componenti di framer-motion
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// FILE: src/utils/dateUtils.js
// (Spostiamo le utility in un file separato)
// ============================================

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return ((endH + endM / 60) - (startH + startM / 60)).toFixed(1);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateShort(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short'
  });
}

// ============================================
// FILE: src/utils/exportUtils.js
// (Spostiamo le funzioni di export)
// ============================================

function handleExportPDF(employees, shifts, getWeekDays, business, calculateWeekHours) {
  const weekDays = getWeekDays();
  const weekStart = formatDateShort(weekDays[0]);
  const weekEnd = formatDateShort(weekDays[6]);

  const printContent = `
    <html>
      <head>
        <title>Turni ${weekStart} - ${weekEnd}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { bg-color: #f2f2f2; }
          .shift { font-size: 12px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>Turni Settimanali: ${weekStart} - ${weekEnd}</h1>
        <h2>${business?.name || 'ShiftMate Business'}</h2>
        <table>
          <thead>
            <tr>
              <th>Dipendente</th>
              ${weekDays.map(d => `<th>${d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</th>`).join('')}
              <th>Totale Ore</th>
            </tr>
          </thead>
          <tbody>
            ${employees.filter(e => e.isActive).map(emp => `
              <tr>
                <td>${emp.firstName} ${emp.lastName}<br><small>${emp.position}</small></td>
                ${weekDays.map(day => {
    const dayShifts = shifts.filter(s => s.employeeId === emp.id && s.date === day.toISOString().split('T')[0]);
    return `<td>${dayShifts.map(s => `<div class="shift">${s.startTime} - ${s.endTime}</div>`).join('')}</td>`;
  }).join('')}
                <td>${calculateWeekHours(emp.id)}h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function handleExportExcel(employees, shifts, getWeekDays, calculateWeekHours) {
  const weekDays = getWeekDays();
  const header = ['Dipendente', 'Posizione', ...weekDays.map(d => d.toLocaleDateString('it-IT')), 'Totale Ore'];
  let csv = header.join(',') + '\n';

  employees.filter(e => e.isActive).forEach(emp => {
    const row = [
      `${emp.firstName} ${emp.lastName}`,
      emp.position,
      ...weekDays.map(day => {
        const dayShifts = shifts.filter(s => s.employeeId === emp.id && s.date === day.toISOString().split('T')[0]);
        return dayShifts.map(s => `${s.startTime}-${s.endTime}`).join('; ');
      }),
      calculateWeekHours(emp.id)
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `turni_${weekDays[0].toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// FILE: src/context/AppContext.js
// (Il nostro nuovo gestore di stato)
// ============================================

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- Questi state restano gli stessi ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Parte come true!
  const [business, setBusiness] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [shifts, setShifts] = useState([]);
  const [requests, setRequests] = useState([]);

  // ==== AGGIUNGI QUESTO STATO MANCANTE ====
  const [notification, setNotification] = useState(null);
  // ======================================
  // ==== THEME STATE ====
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  // ======================================
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

  const [settings, setSettings] = useState({
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
  });

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // showNotification('Impostazione aggiornata'); // Optional: too noisy?
  };

  const toggleNotification = (type) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [type]: !prev.emailNotifications[type]
      }
    }));
  };
  // ========================

  // ... (tutte le altre funzioni come showNotification, getWeekDays, ecc.)
  function showNotification(message, type = 'success') {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  }

  // ==== THEME LOGIC ====
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  // ====================

  // ============================================
  // ==== AGGIUNGI QUESTE FUNZIONI MANCANTI ====
  // ============================================
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
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
    if (direction === 0) { // "Oggi"
      setCurrentWeekStart(getWeekStart(new Date()));
    } else {
      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() + (direction * 7));
      setCurrentWeekStart(getWeekStart(newDate));
    }
  }
  // ============================================
  // --- NUOVA FUNZIONE PER CARICARE I DATI DELL'UTENTE ---
  // (L'avevamo definita prima, ora la usiamo)
  // --- 1. FUNZIONE DI CARICAMENTO DATI (Aggiornata) ---
  async function loadData(authUser) {
    setIsLoading(true);
    try {
      // --- 1. CARICAMENTO PROFILO (Corretto per evitare ReferenceError) ---

      // Inizializziamo profileData con un valore di default.
      // Così se la chiamata al DB fallisce o non trova nulla, la variabile ESISTE COMUNQUE.
      let finalProfileData = { is_premium: false };

      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, stripe_customer_id')
        .eq('id', authUser.id)
        .maybeSingle(); // Usa maybeSingle per evitare errori 406

      if (profileError) {
        console.warn("Errore lettura profilo (uso default):", profileError.message);
      }

      // Se abbiamo trovato il profilo nel DB, sovrascriviamo il default
      if (fetchedProfile) {
        finalProfileData = fetchedProfile;
      }

      // Ora possiamo usare finalProfileData senza paura che sia undefined
      setUser({
        ...authUser,
        ...finalProfileData
      });

      // --- 2. CARICAMENTO DATI ATTIVITÀ (Business) ---

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', authUser.id)
        .maybeSingle();

      if (businessData) {
        // Normalizziamo il nome (gestiamo sia 'name' che 'business_name')
        const normalizedBusiness = {
          ...businessData,
          name: businessData.name || businessData.business_name || ''
        };
        setBusiness(normalizedBusiness);
      } else {
        // Fallback visivo se non c'è ancora un'attività
        setBusiness({ name: 'La tua Attività', address: 'Indirizzo non impostato' });
      }

      // --- 3. CARICAMENTO DIPENDENTI (MOCK - Come avevi prima) ---
      // In futuro qui metterai la chiamata a supabase.from('employees')...
      setEmployees([
        { id: '1', firstName: 'Mario', lastName: 'Rossi', position: 'Barista', contractHours: 40, color: '#3B82F6', email: 'mario@test.com', phone: '333-1234567', isActive: true },
        { id: '2', firstName: 'Laura', lastName: 'Bianchi', position: 'Cameriera', contractHours: 20, color: '#EF4444', email: 'laura@test.com', phone: '333-7654321', isActive: true },
      ]);

      // Mock shifts
      setShifts([
        { id: '1', employeeId: '1', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '16:00', type: 'morning' },
      ]);

      // Mock requests
      setRequests([]);

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Errore caricamento dati', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // --- 2. FUNZIONE AGGIORNAMENTO PROFILO & BUSINESS (Aggiornata) ---
  // --- FUNZIONE ROBUSTA PER AGGIORNARE TUTTO ---
  const updateProfile = async (formData) => {
    try {
      setIsLoading(true);

      // 1. Aggiorna Auth (Nome Utente)
      const updates = {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      };
      if (formData.email && formData.email !== user.email) {
        updates.email = formData.email;
      }

      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      // 2. AGGIORNA O CREA DATI BUSINESS
      // Verifica se esiste già un business per questo utente
      const { data: existingBusiness, error: checkError } = await supabase
        .from('businesses')
        .select('*') // Selezioniamo tutto per controllare i nomi delle colonne
        .eq('owner_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Errore controllo business:", checkError);
        throw checkError;
      }

      let updatedBusinessData;
      let busError;

      // Determina il nome della colonna per il nome attività
      // Se esiste 'business_name' usiamo quello, altrimenti 'name'
      // Se è un nuovo inserimento, proviamo a indovinare o usiamo 'name' come default, 
      // ma se fallisce l'insert ci darà info. Per ora assumiamo 'name' se non c'è record,
      // oppure 'business_name' se è quello comune.
      // Strategia: se existingBusiness c'è, controlliamo le chiavi.

      let nameColumn = 'name';
      if (existingBusiness && 'business_name' in existingBusiness) {
        nameColumn = 'business_name';
      }

      const businessPayload = {
        address: formData.address,
        phone: formData.phone
      };
      businessPayload[nameColumn] = formData.businessName;

      if (existingBusiness) {
        // UPDATE
        console.log(`Updating business using column: ${nameColumn}`);
        const { data, error } = await supabase
          .from('businesses')
          .update(businessPayload)
          .eq('owner_id', user.id)
          .select()
          .single();

        updatedBusinessData = data;
        busError = error;
      } else {
        // INSERT
        // Proviamo con 'name', se fallisce potremmo dover riprovare con 'business_name'
        // Ma per sicurezza, proviamo a vedere se possiamo essere più smart.
        // Per ora usiamo 'name' standard, o 'business_name' se preferiamo.
        // Mettiamo 'name' come default.
        const insertPayload = {
          owner_id: user.id,
          name: formData.businessName,
          address: formData.address,
          phone: formData.phone
        };

        const { data, error } = await supabase
          .from('businesses')
          .insert(insertPayload)
          .select()
          .single();

        updatedBusinessData = data;
        busError = error;
      }

      if (busError) {
        console.error("Errore Supabase Business:", busError);
        throw busError;
      }

      console.log("Dati salvati nel DB:", updatedBusinessData);

      // 3. Aggiorna Stato Locale
      setUser(prev => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          first_name: formData.firstName,
          last_name: formData.lastName
        },
        email: formData.email
      }));

      // Aggiorna la Sidebar immediatamente con i dati freschi
      // Normalizziamo anche qui
      if (updatedBusinessData) {
        const normalizedBusiness = {
          ...updatedBusinessData,
          name: updatedBusinessData.name || updatedBusinessData.business_name || ''
        };
        setBusiness(normalizedBusiness);
      }

      showNotification('Salvato con successo!');
      return true;

    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Errore: ' + error.message, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  // --- MODIFICA useEffect PER L'AUTH REALE ---
  // Sostituisci il vecchio useEffect (quello con setUser(mockUser)) con questo:
  useEffect(() => {
    setIsLoading(true);
    // 1. Controlla la sessione corrente al caricamento
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Utente già loggato, carica i suoi dati
        loadData(session.user);
      } else {
        // Nessun utente, smetti di caricare
        setIsLoading(false);
      }
    });

    // 2. Ascolta i cambiamenti di stato (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          // L'utente ha appena fatto login/registrazione
          loadData(session.user);
        } else if (event === 'SIGNED_OUT') {
          // L'utente ha fatto logout
          setUser(null);
        }
      }
    );

    // Pulisci il listener quando il componente viene smontato
    return () => authListener.subscription.unsubscribe();
  }, []); // Esegui solo all'avvio


  // --- NUOVE FUNZIONI AUTH DA ESPORRE ---
  // Modifica authSignUp per accettare l'oggetto con tutti i dati
  async function authSignUp(formData) {
    // Estraiamo i dati
    const { email, password, firstName, lastName, businessName, address, phone } = formData;

    try {
      // 1. Registra l'utente e salva TUTTO nei metadata (user_metadata)
      // Non facciamo più l'insert manuale in 'businesses' qui!
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            business_name: businessName, // Salviamo qui temporaneamente
            business_address: address,   // Salviamo qui temporaneamente
            business_phone: phone        // Salviamo qui temporaneamente
          }
        }
      });

      if (error) throw error;

      return { data };

    } catch (error) {
      console.error("Errore registrazione:", error);
      return { error };
    }
  }

  async function authSignIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function authSignOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
  // ============================================
  // ==== AGGIUNGI QUESTE FUNZIONI CRUD MANCANTI ====
  // ============================================

  // (Aggiungiamo anche questa, che serve a handleSaveEmployee)
  function generateRandomColor() {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async function handleSaveEmployee(formData, selectedEmployee) {
    try {
      if (selectedEmployee) {
        setEmployees(prev => prev.map(emp =>
          emp.id === selectedEmployee.id ? { ...emp, ...formData } : emp
        ));
        showNotification('Dipendente aggiornato');
      } else {
        const newEmployee = {
          id: Date.now().toString(),
          ...formData,
          isActive: true,
          color: generateRandomColor()
        };
        setEmployees(prev => [...prev, newEmployee]);
        showNotification('Dipendente aggiunto');
      }
      return true; // Successo
    } catch (error) {
      showNotification('Errore nel salvare il dipendente', 'error');
      return false; // Fallimento
    }
  }

  async function handleDeleteEmployee(id) {
    // Sostituzione di confirm() con messaggio di avviso
    showNotification('Azione di eliminazione simulata.', 'error');
    // In futuro, qui potresti mettere:
    // setEmployees(prev => prev.filter(emp => emp.id !== id));
  }

  async function handleSaveShift(formData, selectedShift) {
    try {
      if (selectedShift) {
        setShifts(prev => prev.map(shift =>
          shift.id === selectedShift.id ? { ...shift, ...formData } : shift
        ));
        showNotification('Turno aggiornato');
      } else {
        const newShift = {
          id: Date.now().toString(),
          ...formData
        };
        setShifts(prev => [...prev, newShift]);
        showNotification('Turno creato');
      }
      return true; // Successo
    } catch (error) {
      showNotification('Errore nel salvare il turno', 'error');
      return false; // Fallimento
    }
  }

  async function handleDeleteShift(id) {
    showNotification('Eliminazione turno simulata.', 'error');
    // In futuro, qui potresti mettere:
    // setShifts(prev => prev.filter(shift => shift.id !== id));
  }

  async function handleApproveRequest(id) {
    try {
      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'approved' } : req
      ));
      showNotification('Richiesta approvata');
    } catch (error) {
      showNotification('Errore nell\'approvare la richiesta', 'error');
    }
  }

  async function handleRejectRequest(id) {
    try {
      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' } : req
      ));
      showNotification('Richiesta rifiutata');
    } catch (error) {
      showNotification('Errore nel rifiutare la richiesta', 'error');
    }
  }

  // Funzioni per l'export (le mettiamo qui così hanno accesso ai dati)
  const exportPDF = () => {
    handleExportPDF(employees, shifts, getWeekDays, business, calculateWeekHours);
  };

  const exportExcel = () => {
    handleExportExcel(employees, shifts, getWeekDays, calculateWeekHours);
  };
  // ============================================
  // ============================================
  // ==== AGGIUNGI QUESTE FUNZIONI HELPER MANCANTI ====
  // ============================================

  function getShiftsForDate(date) {
    // Nota: 'shifts' è disponibile qui perché è nello scope di AppProvider
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr);
  }

  function getEmployeeById(id) {
    // Nota: 'employees' è disponibile qui
    return employees.find(e => e.id === id);
  }

  function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return 0; // Aggiunto controllo di sicurezza
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return ((endH + endM / 60) - (startH + startM / 60)).toFixed(1);
  }

  function calculateWeekHours(employeeId) {
    // Nota: 'getWeekDays' e 'getShiftsForDate' sono disponibili qui
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
  // ============================================

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  // --- Valore fornito dal Context ---
  // Ora assicurati che l'oggetto 'value' includa TUTTE queste funzioni:
  const value = {
    user,
    isLoading,
    business,
    employees,
    shifts,
    requests,
    notification,
    setNotification,
    showNotification,
    currentWeekStart,
    getWeekDays,
    changeWeek,
    getShiftsForDate,
    calculateWeekHours,
    calculateHours,
    getEmployeeById,
    authSignUp,
    authSignIn,
    authSignOut,
    handleSaveEmployee,
    handleDeleteEmployee,
    handleSaveShift,
    handleDeleteShift,
    handleApproveRequest,
    exportExcel,
    t: (key) => {
      const lang = settings.language || 'it';
      return translations[lang][key] || key;
    },
    updateProfile: async (data) => {
      try {
        // Prepara l'oggetto di aggiornamento
        const updates = {
          data: {
            first_name: data.firstName,
            last_name: data.lastName
          }
        };

        // Se l'email è cambiata, aggiungila agli aggiornamenti
        // NOTA: Supabase invierà una mail di conferma al nuovo indirizzo
        if (data.email && data.email !== user.email) {
          updates.email = data.email;
        }

        const { error } = await supabase.auth.updateUser(updates);

        if (error) throw error;

        // Aggiorna lo stato locale immediatamente per la UI
        setUser(prev => ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            first_name: data.firstName,
            last_name: data.lastName
          },
          email: data.email // Aggiorniamo anche l'email in locale
        }));

        showNotification('Profilo aggiornato con successo');
        return true;
      } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Errore aggiornamento profilo: ' + error.message, 'error');
        return false;
      }
    },
    changePassword: async (oldPwd, newPwd) => {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        if (error) throw error;
        showNotification('Password aggiornata con successo');
        return true;
      } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Errore durante il cambio password', 'error');
        return false;
      }
    },

    // ==== AGGIUNGI QUESTA CHIAVE MANCANTE ====
    pendingRequestsCount,

    // ==== SETTINGS EXPORTS ====
    settings,
    updateSettings,
    toggleNotification,
    // ==========================
    // ========================================
    theme,
    toggleTheme
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizzato per usare il context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ============================================
// FILE: src/components/ui/AnimatedModal.js
// (Un modale animato riutilizzabile)
// ============================================

const AnimatedModal = ({ children, onClose, title }) => {
  // Animazioni per il backdrop
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Animazioni per il contenuto del modale
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9 },
  };

  return (
    // AnimatePresence è fondamentale per animare l'uscita (exit)
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose} // Chiudi cliccando sul backdrop
      >
        <motion.div
          className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-colors"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()} // Evita la chiusura cliccando sul modale
        >
          <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <motion.button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          <div className="p-5 text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// FILE: src/components/ui/Notification.js
// (Un componente Notifica animato)
// ============================================

const Notification = () => {
  const { notification, setNotification } = useAppContext();

  const variants = {
    hidden: { opacity: 0, y: -50, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 0.8 },
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100]">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`rounded-lg p-4 flex items-center gap-3 shadow-lg ${notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={notification.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {notification.message}
            </span>
            <button onClick={() => setNotification(null)} className="ml-auto">
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// FILE: src/components/ui/LoadingSpinner.js
// (Spinner di caricamento animato)
// ============================================

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center transition-colors">
    <div className="text-center">
      <motion.div
        className="inline-block h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
        animate={{ rotate: 360 }}
        transition={{ loop: Infinity, ease: "linear", duration: 1 }}
      >
      </motion.div>
      <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
    </div>
  </div>
);

// ============================================
// FILE: src/components/layout/Sidebar.js
// ============================================

const Sidebar = ({ currentView, setCurrentView, onOpenPremium }) => {
  const {
    business,
    employees,
    pendingRequestsCount,
    authSignOut,
    user,
    t // Use t helper
  } = useAppContext();

  const isPremium = user?.is_premium;

  const navItems = [
    { id: 'dashboard', icon: Calendar, label: t('calendar') },
    { id: 'employees', icon: Users, label: t('employees'), badge: employees.length },
    { id: 'requests', icon: Bell, label: t('requests'), badge: pendingRequestsCount },
    { id: 'settings', icon: Settings, label: t('settings') }
  ];

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">ShiftMate</span>
      </div>

      {business && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('venue')}</div>
          <div className="font-bold text-gray-900 dark:text-white">{business.name}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{business.address}</div>
        </div>
      )}

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === item.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">{item.label}</span>
            {item.badge > 0 && item.id === 'requests' && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        {isPremium ? (
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 mt-4">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" />
            <span className="font-bold flex-1 text-left text-yellow-700 dark:text-yellow-400">{t('premium_member')}</span>
          </div>
        ) : (
          <button
            onClick={onOpenPremium}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg mt-4"
          >
            <Zap className="w-5 h-5" />
            <span className="font-bold flex-1 text-left">{t('premium_upgrade')}</span>
          </button>
        )}
      </nav>

      <button
        onClick={authSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 mt-8"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">{t('logout')}</span>
      </button>
    </div>
  );
};

// ============================================
// FILE: src/components/ui/ThemeToggle.js
// ============================================

const ThemeToggle = () => {
  const { theme, toggleTheme } = useAppContext();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors ${theme === 'dark'
        ? 'bg-dark-surface text-yellow-400 hover:bg-gray-700'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode='wait'>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

// ============================================
// FILE: src/components/layout/Header.js
// ============================================

const Header = ({ onMenuToggle, currentViewLabel }) => {
  const { business, pendingRequestsCount } = useAppContext();

  return (
    <header className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-full"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
          {currentViewLabel}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          {pendingRequestsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {business?.name?.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

// ============================================
// FILE: src/components/layout/Layout.js
// (Il nostro nuovo "guscio" persistente)
// ============================================

const Layout = ({ children, currentView, setCurrentView, onLogout, onOpenPremium }) => {
  const { t } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const views = {
    'dashboard': t('calendar'),
    'employees': t('employees'),
    'requests': t('requests'),
    'settings': t('settings')
  };

  const currentViewLabel = views[currentView] || 'ShiftMate';

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleSetView = (view) => {
    setCurrentView(view);
    closeMenu();
  };

  const handleOpenPremium = () => {
    onOpenPremium();
    closeMenu();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex transition-colors duration-300">
      {/* Overlay Mobile Animato */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Mobile Animata */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            className="bg-white dark:bg-dark-surface w-64 border-r border-gray-200 dark:border-dark-border fixed inset-y-0 left-0 z-50 transform"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
          >
            <Sidebar
              currentView={currentView}
              setCurrentView={handleSetView}
              onLogout={() => { onLogout(); closeMenu(); }}
              onOpenPremium={handleOpenPremium}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop */}
      <aside className="bg-white dark:bg-dark-surface w-64 border-r border-gray-200 dark:border-dark-border hidden lg:block fixed inset-y-0 left-0 z-20 transition-colors duration-300">
        <Sidebar
          currentView={currentView}
          setCurrentView={handleSetView}
          onLogout={onLogout}
          onOpenPremium={onOpenPremium}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          currentViewLabel={currentViewLabel}
        />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};


// ============================================
// FILE: src/views/DashboardView.js
// (Ora usa useAppContext e riceve meno props)
// ============================================

function DashboardView({ onAddShift, onEditShift }) {
  const {
    currentWeekStart, getWeekDays, changeWeek,
    employees, shifts, getShiftsForDate, calculateWeekHours,
    pendingRequestsCount, exportPDF, exportExcel, t, settings
  } = useAppContext(); // <-- Niente più prop drilling!

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between transition-colors">
        <motion.button
          onClick={() => changeWeek(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors text-gray-600 dark:text-gray-300"
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('week')}</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {formatDateShort(getWeekDays()[0])} - {formatDateShort(getWeekDays()[6])}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => changeWeek(0)} // Passa 0 per "Oggi"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('today')}
          </motion.button>
          <motion.button
            onClick={() => changeWeek(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.button
          onClick={onAddShift}
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer shadow"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6 mb-2" />
          <div className="font-bold">{t('add_shift')}</div>
        </motion.button>

        {/* (Card statiche... omesso refactoring di animazione per brevità) */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border transition-colors">
          <Users className="w-6 h-6 text-gray-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('employees')}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border transition-colors">
          <Clock className="w-6 h-6 text-gray-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {shifts.filter(s => getWeekDays().some(d => d.toISOString().split('T')[0] === s.date)).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('shifts_this_week')}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border transition-colors">
          <Bell className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequestsCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('pending_requests_stat')}</div>
        </div>
      </div>

      {/* Tabella Calendario */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            {/* ... (thead non modificato) ... */}
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border transition-colors">
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-48">{t('employee')}</th>
                {getWeekDays().map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <th key={idx} className={`text-center p-4 font-semibold ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'short' })}
                      </div>
                      <div className={`text-sm ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                        {day.getDate()} {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { month: 'short' })}
                      </div>
                    </th>
                  );
                })}
                <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-24">{t('total_hours')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.filter(e => e.isActive).map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors duration-150">
                  <td className="p-4">
                    {/* ... (info dipendente non modificate) ... */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: employee.color }}
                      >
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{employee.position}</div>
                      </div>
                    </div>
                  </td>
                  {getWeekDays().map((day, dayIdx) => {
                    const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === employee.id);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <td key={dayIdx} className={`p-2 align-top ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <div className="space-y-1">
                          {dayShifts.map((shift) => (
                            <motion.div
                              key={shift.id}
                              className="text-xs p-2 rounded-lg cursor-pointer"
                              style={{
                                backgroundColor: employee.color + '20',
                                borderLeft: `3px solid ${employee.color}`
                              }}
                              onClick={() => onEditShift(shift)}
                              whileHover={{ scale: 1.05, shadow: 'lg' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                              <div className="font-semibold" style={{ color: employee.color }}>
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 mt-1">
                                {calculateHours(shift.startTime, shift.endTime)}h
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center">
                    {/* ... (ore totali non modificate) ... */}
                    <div className="font-bold text-gray-900 dark:text-white">{calculateWeekHours(employee.id)}h</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">/{employee.contractHours}h</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <motion.button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors shadow-sm text-gray-700 dark:text-gray-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">{t('export_pdf')}</span>
        </motion.button>
        <motion.button
          onClick={exportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">{t('export_excel')}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// FILE: src/views/EmployeesView.js
// ============================================

function EmployeesView({ onAddEmployee, onEditEmployee }) {
  const { employees, calculateWeekHours, handleDeleteEmployee, t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.isActive && (
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Varianti per animare la lista
  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Applica un ritardo a ogni figlio
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* ... (Barra di ricerca non modificata) ... */}
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder={t('search_employee')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <motion.button
          onClick={onAddEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          {t('add_employee')}
        </motion.button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            {/* ... (thead non modificato) ... */}
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border transition-colors">
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">{t('full_name')}</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">{t('position')}</th>
                <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">{t('contract_hours')}</th>
                <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">{t('current_hours')}</th>
                <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-28">{t('actions')}</th>
              </tr>
            </thead>
            <motion.tbody
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors duration-150"
                    variants={listItemVariants}
                  >
                    {/* ... (td non modificati) ... */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ backgroundColor: employee.color }}
                        >
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{employee.position}</td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">{employee.contractHours}h</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${calculateWeekHours(employee.id) > employee.contractHours ? 'text-red-500' : 'text-green-600'
                        }`}>
                        {calculateWeekHours(employee.id)}h
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-1">
                      <motion.button
                        onClick={() => onEditEmployee(employee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {t('no_employees_found')}
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// FILE: src/views/RequestsView.js
// ============================================

function RequestsView() {
  const {
    requests, getEmployeeById,
    handleApproveRequest, handleRejectRequest, t
  } = useAppContext();

  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getRequestTypeLabel = (type) => { /* ... (stessa funzione) ... */ };
  const getStatusStyles = (status) => { /* ... (stessa funzione) ... */ };

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
        {/* ... (Storico non modificato) ... */}
      </div>
    </motion.div>
  );
}






// ============================================
// FILE: src/components/modals/EmployeeModal.js
// ============================================

function EmployeeModal({ employee, onSave, onClose }) {
  const { t } = useAppContext();
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    position: employee?.position || '',
    contractHours: employee?.contractHours || 40,
    email: employee?.email || '',
    phone: employee?.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, contractHours: Number(formData.contractHours) });
  };

  return (
    <AnimatedModal title={employee ? t('edit_employee') : t('create_employee')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Campi form non modificati) ... */}
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          <input type="text" name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <input type="text" name="position" placeholder="Posizione (es. Barista)" value={formData.position} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <input type="number" name="contractHours" placeholder="Ore Contratto Settimanali" value={formData.contractHours} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <input type="tel" name="phone" placeholder="Telefono" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <div className="pt-4 flex justify-end">
          <motion.button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {employee ? t('save_changes') : t('save_employee')}
          </motion.button>
        </div>
      </form>
    </AnimatedModal>
  );
}

// ============================================
// FILE: src/components/modals/ShiftModal.js
// ============================================

function ShiftModal({ shift, onSave, onDelete, onClose }) {
  const { employees, t } = useAppContext(); // Prendi i dipendenti dal context

  const [formData, setFormData] = useState({
    employeeId: shift?.employeeId || employees[0]?.id || '',
    date: shift?.date || new Date().toISOString().split('T')[0],
    startTime: shift?.startTime || '09:00',
    endTime: shift?.endTime || '17:00',
    type: shift?.type || 'morning',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatedModal title={shift ? t('edit_shift') : t('create_shift')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Campi form non modificati) ... */}
        <select name="employeeId" value={formData.employeeId} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="" disabled>{t('select_employee')}</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
          ))}
        </select>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <div className="grid grid-cols-2 gap-4">
          <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="morning">{t('morning')}</option>
          <option value="afternoon">{t('afternoon')}</option>
          <option value="evening">{t('evening')}</option>
          <option value="night">{t('night')}</option>
        </select>

        <div className="pt-4 flex justify-between">
          {onDelete && (
            <motion.button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-1 shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" /> {t('delete')}
            </motion.button>
          )}
          <motion.button
            type="submit"
            className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {shift ? t('save_shift') : t('create_shift')}
          </motion.button>
        </div>
      </form>
    </AnimatedModal>
  );
}

// ============================================
// FILE: src/components/modals/PremiumModal.js
// ============================================

// ============================================
// PREMIUM MODAL (NUOVA VERSIONE CON STRIPE)
// ============================================

function PremiumModal({ onClose }) {
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
      // 1. CHIAMA IL BACKEND (come prima)
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: JSON.stringify({ email: user.email })
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
              <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold"><Download className="w-4 h-4" /> {t('feature_export')}</li>
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
}

// ============================================
// FILE: src/App.js
// (Il componente App principale, ora molto più pulito)
// ============================================

// ============================================
// IL COMPONENTE APP PRINCIPALE
// ============================================

function App() {
  // 1. PRENDI LO STATO GLOBALE
  const { user, isLoading, showNotification } = useAppContext();

  // 2. STATO DI NAVIGAZIONE (Rimane qui)
  const [currentView, setCurrentView] = useState('dashboard');

  // 3. STATO DEI MODALI (Rimane qui)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);

  // 4. FUNZIONI HELPER PER I MODALI (Rimangono qui)
  //    (Prendiamo le funzioni di salvataggio dal context)
  const { handleSaveEmployee, handleSaveShift, handleDeleteShift } = useAppContext();

  const openAddEmployee = () => { setSelectedEmployee(null); setShowEmployeeModal(true); };
  const openEditEmployee = (emp) => { setSelectedEmployee(emp); setShowEmployeeModal(true); };

  const openAddShift = () => { setSelectedShift(null); setShowShiftModal(true); };
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
  //    (Rimane qui)
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} />;
      case 'employees':
        return <EmployeesView onAddEmployee={openAddEmployee} onEditEmployee={openEditEmployee} />;
      case 'requests':
        return <RequestsView />;
      case 'settings':
        return <SettingsView onOpenPremium={() => setShowPremiumModal(true)} />;
      default:
        return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} />;
    }
  };

  // 6. EFFETTO PER I REDIRECT DI STRIPE
  //    (Aggiunto)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.has('payment') && queryParams.get('payment') === 'success') {
      // Usiamo showNotification (dal context) per mostrare il messaggio
      showNotification('Benvenuto in Premium! Il tuo account è stato aggiornato.', 'success');
      // Pulisce l'URL
      window.history.replaceState(null, null, window.location.pathname);
    }
    if (queryParams.has('payment') && queryParams.get('payment') === 'cancel') {
      showNotification('Pagamento annullato. Sei ancora sul piano Base.', 'error');
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, [showNotification]); // Dipende da showNotification


  // 7. NUOVA LOGICA DI RENDERING (IL "ROUTER")
  //    (Sostituisce il tuo vecchio 'return')

  if (isLoading) {
    // Mostra lo spinner MENTRE controlliamo se l'utente è loggato
    return <LoadingSpinner />;
  }

  if (!user) {
    // Se NON c'è utente, mostra la pagina di Login/Registro
    return <AuthView />;
  }

  // Se l'utente C'È, mostra la app principale
  return (
    <>
      <Layout
        currentView={currentView}
        setCurrentView={setCurrentView}
        // onLogout non serve più, Sidebar lo gestisce da solo
        onOpenPremium={() => setShowPremiumModal(true)}
      >
        {renderView()}
      </Layout>

      <Notification />

      {/* Modali (rimangono uguali) */}
      {showEmployeeModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onSave={onSaveEmployee}
          onClose={() => setShowEmployeeModal(false)}
        />
      )}

      {showShiftModal && (
        <ShiftModal
          shift={selectedShift}
          onSave={onSaveShift}
          onDelete={selectedShift ? onDeleteShift : null}
          onClose={() => setShowShiftModal(false)}
        />
      )}

      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </>
  );
}

import { LogIn } from 'lucide-react'; // Assicurati di importare LogIn

function AuthView() {
  const { authSignIn, authSignUp } = useAppContext();

  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);

    let result;
    if (isLoginView) {
      result = await authSignIn(formData.email, formData.password);
    } else {
      result = await authSignUp(formData);

      if (!result.error) {
        alert('Registrazione completata! Controlla la tua email.');
        setIsLoginView(true);
      }
    }

    if (result && result.error) {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-dark-surface p-8 rounded-xl shadow-lg w-full max-w-md transition-colors">

        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          {isLoginView ? 'Accedi a ShiftMate' : 'Registra la tua Attività'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {!isLoginView && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="firstName"
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full"
                />
                <input
                  name="lastName"
                  placeholder="Cognome"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Dati Attività</p>
                <input
                  name="businessName"
                  placeholder="Nome Attività (es. Bar Centrale)"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="mb-3 p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full"
                />
                <input
                  name="address"
                  placeholder="Via, Città e Provincia"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="mb-3 p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full"
                />
                <input
                  name="phone"
                  placeholder="Telefono Attività"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white w-full"
                />
              </div>
            </>
          )}

          {/* Email e Password (sempre visibili) */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white"
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
          >
            {loading ? 'Caricamento...' : (isLoginView ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => { setIsLoginView(!isLoginView); setError(null); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLoginView ? 'Non hai un account? Registrati ora' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILE: src/index.js
// (Il file principale che avvia l'app)
// ============================================

// Dovresti wrappare la tua App con il Provider
// export default function MainApp() {
//   return (
//     <AppProvider>
//       <App />
//     </AppProvider>
//   );
// }

// Per questo file singolo, esportiamo il provider wrappato
export default function ProvidedApp() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}