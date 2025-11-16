// ...altre tue importazioni come React, Calendar, ecc.
import { supabase } from './supabaseClient'; // Assicurati che il percorso sia corretto!
// ...le tue altre importazioni
import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  Calendar, Users, Bell, Settings, LogOut, Plus, 
  ChevronLeft, ChevronRight, Menu, X, Clock,
  Download, TrendingUp, AlertCircle, CheckCircle,
  Search, Filter, Edit2, Trash2, XCircle, DollarSign, Zap
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
  return ((endH + endM/60) - (startH + startM/60)).toFixed(1);
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
  
  // (Contenuto HTML per la stampa... omesso per brevità, è lo stesso di prima)
  const printContent = `... (Stesso HTML di prima) ...`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function handleExportExcel(employees, shifts, getWeekDays, calculateWeekHours) {
  const weekDays = getWeekDays();
  // (Logica CSV... omessa per brevità, è la stessa di prima)
  let csv = 'Dipendente,Posizione... (Stesso CSV di prima) ...';

  employees.filter(e => e.isActive).forEach(employee => {
    // ... (Logica di riempimento CSV) ...
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
const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  // ... (tutti gli altri state)

  // ... (tutte le altre funzioni come showNotification, getWeekDays, ecc.)
function showNotification(message, type = 'success') {
  setNotification({ message, type, id: Date.now() });
  setTimeout(() => setNotification(null), 5000);
}

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
  async function loadData(authUser) {
  setIsLoading(true);
  try {
    // 1. Carica il profilo
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, stripe_customer_id')
      .eq('id', authUser.id)
      .single(); // Chiede un risultato singolo

    // 2. Gestisci il caso "Nessun Profilo" (es. utente vecchio)
    // L'errore 'PGRST116' significa ".single() ha restituito 0 righe"
    if (profileError && profileError.code === 'PGRST116') {
      console.warn("Attenzione: utente loggato ma nessun profilo trovato. Lo considero Non-Premium.");
      profileData = { is_premium: false }; // Imposta un profilo di default
    } else if (profileError) {
      // Altro errore DB (es. RLS bloccato, ecc.)
      throw profileError;
    }

    // 3. Unisci i dati e imposta l'utente
    setUser({
      ...authUser,    // Dati da Auth (email, id...)
      ...profileData  // Dati dal DB (is_premium...)
    });
    
    // 4. Carica il resto dei dati (turni, dipendenti, ecc.)
    // (Questa è la tua logica di mock-data, da sostituire in futuro)
    setBusiness({ id: '1', name: 'Bar Centrale', type: 'bar', address: 'Via Roma 123, Brescia' });
    setEmployees([
        { id: '1', firstName: 'Mario', lastName: 'Rossi', position: 'Barista', contractHours: 40, color: '#3B82F6', email: 'mario@test.com', phone: '333-1234567', isActive: true },
        { id: '2', firstName: 'Laura', lastName: 'Bianchi', position: 'Cameriera', contractHours: 20, color: '#EF4444', email: 'laura@test.com', phone: '333-7654321', isActive: true },
    ]);
    setShifts([
        { id: '1', employeeId: '1', date: '2025-11-17', startTime: '08:00', endTime: '16:00', type: 'morning' },
        { id: '2', employeeId: '2', date: '2025-11-17', startTime: '16:00', endTime: '23:00', type: 'evening' },
    ]);
    setRequests([
        { id: '1', employeeId: '2', type: 'time_off', startDate: '2025-11-22', endDate: '2025-11-24', reason: 'Vacanza programmata', status: 'pending', createdAt: '2025-11-15' },
    ]);

  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Errore caricamento dati', 'error');
  } finally {
    setIsLoading(false);
  }
}


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
  async function authSignUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
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
  // Qui dovresti richiamare la funzione handleExportPDF
  // passando i dati di stato (employees, shifts, getWeekDays, ecc.)
  showNotification('Funzione PDF non ancora migrata nel context.', 'error');
};

const exportExcel = () => {
  // Qui dovresti richiamare la funzione handleExportExcel
  showNotification('Funzione Excel non ancora migrata nel context.', 'error');
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
  return ((endH + endM/60) - (startH + startM/60)).toFixed(1);
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
  handleRejectRequest,
  exportPDF,
  exportExcel,

  // ==== AGGIUNGI QUESTA CHIAVE MANCANTE ====
  pendingRequestsCount
  // ========================================
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()} // Evita la chiusura cliccando sul modale
        >
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <motion.button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          <div className="p-5">
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
            className={`rounded-lg p-4 flex items-center gap-3 shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
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
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        className="inline-block h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
        animate={{ rotate: 360 }}
        transition={{ loop: Infinity, ease: "linear", duration: 1 }}
      >
      </motion.div>
      <p className="text-gray-600">Caricamento...</p>
    </div>
  </div>
);

// ============================================
// FILE: src/components/layout/Sidebar.js
// ============================================

// Dentro App.jsx, nel componente Sidebar
const Sidebar = ({ currentView, setCurrentView, onOpenPremium }) => {
  // 1. ESTRAI TUTTO IL NECESSARIO DAL CONTEXT
  const { 
    business, 
    employees, 
    pendingRequestsCount, 
    authSignOut 
  } = useAppContext();

  // 2. Definisci gli item di navigazione
  // (Ora 'employees.length' e 'pendingRequestsCount' funzioneranno)
  const navItems = [
    { id: 'dashboard', icon: Calendar, label: 'Calendario' },
    { id: 'employees', icon: Users, label: 'Dipendenti', badge: employees.length },
    { id: 'requests', icon: Bell, label: 'Richieste', badge: pendingRequestsCount },
    { id: 'settings', icon: Settings, label: 'Impostazioni' }
  ];

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">ShiftMate</span>
      </div>

      {/* 3. Ora 'business' esiste e non causerà crash */}
      {business && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">Locale</div>
          <div className="font-bold text-gray-900">{business.name}</div>
          <div className="text-xs text-gray-600 mt-1">{business.address}</div>
        </div>
      )}

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
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
        <button
          onClick={onOpenPremium} // Questo usa ancora la prop passata da App
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg mt-4"
        >
          <Zap className="w-5 h-5" />
          <span className="font-bold flex-1 text-left">Passa a Premium</span>
        </button>
      </nav>

      {/* 4. Ora 'authSignOut' esiste e funzionerà */}
      <button 
        onClick={authSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 mt-8"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Esci</span>
      </button>
    </div>
  );
};

// ============================================
// FILE: src/components/layout/Header.js
// ============================================

const Header = ({ onMenuToggle, currentViewLabel }) => {
  const { business, pendingRequestsCount } = useAppContext();
  
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {currentViewLabel}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const views = {
    'dashboard': 'Calendario Turni',
    'employees': 'Gestione Dipendenti',
    'requests': 'Richieste',
    'settings': 'Impostazioni'
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
    <div className="min-h-screen bg-gray-50 flex">
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
            className="bg-white w-64 border-r border-gray-200 fixed inset-y-0 left-0 z-50 transform"
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
      <aside className="bg-white w-64 border-r border-gray-200 hidden lg:block fixed inset-y-0 left-0 z-20">
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
    pendingRequestsCount, exportPDF, exportExcel
  } = useAppContext(); // <-- Niente più prop drilling!

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <motion.button 
          onClick={() => changeWeek(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="text-center">
          <div className="text-sm text-gray-600">Settimana</div>
          <div className="font-bold text-gray-900">
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
            Oggi
          </motion.button>
          <motion.button 
            onClick={() => changeWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="font-bold">Aggiungi Turno</div>
        </motion.button>
        
        {/* (Card statiche... omesso refactoring di animazione per brevità) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <Users className="w-6 h-6 text-gray-400 mb-2" />
           <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
           <div className="text-sm text-gray-600">Dipendenti</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <Clock className="w-6 h-6 text-gray-400 mb-2" />
           <div className="text-2xl font-bold text-gray-900">
             {shifts.filter(s => getWeekDays().some(d => d.toISOString().split('T')[0] === s.date)).length}
           </div>
           <div className="text-sm text-gray-600">Turni questa sett.</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <Bell className="w-6 h-6 text-orange-400 mb-2" />
           <div className="text-2xl font-bold text-gray-900">{pendingRequestsCount}</div>
           <div className="text-sm text-gray-600">Richieste pending</div>
        </div>
      </div>

      {/* Tabella Calendario */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            {/* ... (thead non modificato) ... */}
            <thead>
             <tr className="bg-gray-50 border-b border-gray-200">
               <th className="text-left p-4 font-semibold text-gray-700 w-48">Dipendente</th>
               {getWeekDays().map((day, idx) => {
                 const isToday = day.toDateString() === new Date().toDateString();
                 return (
                   <th key={idx} className={`text-center p-4 font-semibold ${isToday ? 'bg-blue-50' : ''}`}>
                     <div className="text-xs text-gray-500">
                       {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                     </div>
                     <div className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                       {day.getDate()} {day.toLocaleDateString('it-IT', { month: 'short' })}
                     </div>
                   </th>
                 );
               })}
               <th className="text-center p-4 font-semibold text-gray-700 w-24">Tot. Ore</th>
             </tr>
            </thead>
            <tbody>
              {employees.filter(e => e.isActive).map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
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
                         <div className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</div>
                         <div className="text-xs text-gray-500">{employee.position}</div>
                       </div>
                     </div>
                  </td>
                  {getWeekDays().map((day, dayIdx) => {
                    const dayShifts = getShiftsForDate(day).filter(s => s.employeeId === employee.id);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <td key={dayIdx} className={`p-2 align-top ${isToday ? 'bg-blue-50/50' : ''}`}>
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
                              <div className="text-gray-600 mt-1">
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
                    <div className="font-bold text-gray-900">{calculateWeekHours(employee.id)}h</div>
                    <div className="text-xs text-gray-500">/{employee.contractHours}h</div>
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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">Export PDF</span>
        </motion.button>
        <motion.button 
          onClick={exportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">Export Excel</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// FILE: src/views/EmployeesView.js
// ============================================

function EmployeesView({ onAddEmployee, onEditEmployee }) {
  const { employees, calculateWeekHours, handleDeleteEmployee } = useAppContext();
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
             placeholder="Cerca dipendente..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          Aggiungi Dipendente
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            {/* ... (thead non modificato) ... */}
            <thead>
             <tr className="bg-gray-50 border-b border-gray-200">
               <th className="text-left p-4 font-semibold text-gray-700">Nome Completo</th>
               <th className="text-left p-4 font-semibold text-gray-700">Posizione</th>
               <th className="text-center p-4 font-semibold text-gray-700">Contratto (h/sett)</th>
               <th className="text-center p-4 font-semibold text-gray-700">Ore Attuali</th>
               <th className="text-center p-4 font-semibold text-gray-700 w-28">Azioni</th>
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
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
                         <span className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</span>
                       </div>
                    </td>
                    <td className="p-4 text-gray-600">{employee.position}</td>
                    <td className="p-4 text-center text-gray-600">{employee.contractHours}h</td>
                    <td className="p-4 text-center">
                       <span className={`font-bold ${
                         calculateWeekHours(employee.id) > employee.contractHours ? 'text-red-500' : 'text-green-600'
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
                    Nessun dipendente trovato.
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
    handleApproveRequest, handleRejectRequest 
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Richieste Pendenti ({pending.length})
        </h2>
        <div className="space-y-4">
          {pending.length > 0 ? (
            pending.map((req) => {
              const employee = getEmployeeById(req.employeeId);
              return (
                <motion.div 
                  key={req.id} 
                  className="p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center"
                  layout // Anima il layout quando viene rimosso
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <div>
                    {/* ... (dettagli richiesta non modificati) ... */}
                    <div className="font-bold text-gray-900">{employee?.firstName} {employee?.lastName}</div>
                     <div className="text-sm text-gray-600 mt-1">
                       <span className="font-medium text-yellow-700">{getRequestTypeLabel(req.type)}:</span> {req.reason}
                     </div>
                     {req.startDate && (
                       <div className="text-xs text-gray-500 mt-1">
                         Periodo: {formatDate(req.startDate)}{req.endDate && req.startDate !== req.endDate ? ` - ${formatDate(req.endDate)}` : ''}
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
                      <CheckCircle className="w-4 h-4" /> Approva
                    </motion.button>
                    <motion.button
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <XCircle className="w-4 h-4" /> Rifiuta
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          ) : (
             <div className="text-center p-4 text-gray-500 border border-gray-100 rounded-lg">
               Nessuna richiesta pendente. Tutto in ordine!
             </div>
          )}
        </div>
      </div>

      {/* Storico Richieste */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* ... (Storico non modificato) ... */}
      </div>
    </motion.div>
  );
}

// ============================================
// FILE: src/views/SettingsView.js
// ============================================

function SettingsView({ onOpenPremium }) {
  const { business } = useAppContext();

  return (
    <motion.div 
      className="space-y-8 max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* ... (Dettagli azienda non modificati) ... */}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
        <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Piano di Abbonamento
        </h2>
        <p className="text-gray-700 mb-4">Attualmente sei sul piano **Base (Gratuito)**. Passa a Premium per sbloccare funzionalità avanzate.</p>
        <motion.button
          onClick={onOpenPremium}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all font-bold shadow-md"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <DollarSign className="w-5 h-5" />
          Scopri i Piani Premium
        </motion.button>
      </div>
    </motion.div>
  );
}


// ============================================
// FILE: src/components/modals/EmployeeModal.js
// ============================================

function EmployeeModal({ employee, onSave, onClose }) {
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
    <AnimatedModal title={employee ? 'Modifica Dipendente' : 'Aggiungi Dipendente'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Campi form non modificati) ... */}
        <div className="grid grid-cols-2 gap-4">
           <input type="text" name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
           <input type="text" name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
         </div>
         <input type="text" name="position" placeholder="Posizione (es. Barista)" value={formData.position} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
         <input type="number" name="contractHours" placeholder="Ore Contratto Settimanali" value={formData.contractHours} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
         <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
         <input type="tel" name="phone" placeholder="Telefono" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
        <div className="pt-4 flex justify-end">
          <motion.button 
            type="submit" 
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {employee ? 'Salva Modifiche' : 'Aggiungi Dipendente'}
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
  const { employees } = useAppContext(); // Prendi i dipendenti dal context

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
    <AnimatedModal title={shift ? 'Modifica Turno' : 'Crea Nuovo Turno'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Campi form non modificati) ... */}
        <select name="employeeId" value={formData.employeeId} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
           <option value="" disabled>Seleziona Dipendente</option>
           {employees.map(emp => (
             <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
           ))}
        </select>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
        <div className="grid grid-cols-2 gap-4">
           <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
           <input type="time" e="endTime" value={formData.endTime} onChange={handleChange} required className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
           <option value="morning">Mattina</option>
           <option value="afternoon">Pomeriggio</option>
           <option value="evening">Sera</option>
           <option value="night">Notte</option>
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
              <Trash2 className="w-4 h-4" /> Elimina
            </motion.button>
          )}
          <motion.button 
            type="submit" 
            className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {shift ? 'Salva Turno' : 'Crea Turno'}
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
  const { user, showNotification } = useAppContext(); 
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
    <AnimatedModal title="Piani ShiftMate Premium" onClose={onClose}>
      <div className="space-y-6">
        <p className="text-gray-600">Scegli il piano che meglio si adatta alle tue esigenze.</p>

        <div className="grid md:grid-cols-2 gap-4">
          
          {/* --- PIANO BASE (CORRETTO) --- */}
          <div className="border-2 border-blue-100 rounded-xl p-5 shadow-lg">
            <h4 className="text-2xl font-bold text-blue-600">Base</h4>
            <p className="text-4xl font-extrabold my-2 text-gray-900">
              €0<span className="text-base font-normal text-gray-500">/mese</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">Gestione essenziale dei turni.</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Creazione Turni Manuale</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Gestione Dipendenti</li>
              <li className="flex items-center gap-2 text-blue-600 font-semibold"><Download className="w-4 h-4" /> Export Dati (PDF & CSV)</li>
            </ul>
            <button 
              disabled 
              className="w-full mt-5 py-2 bg-blue-500 text-white rounded-lg opacity-70 cursor-not-allowed font-medium"
            >
              Piano Attuale
            </button>
          </div>

          {/* --- PIANO PREMIUM (ATTIVO) --- */}
          <motion.div 
            className="border-2 border-yellow-500 rounded-xl p-5 shadow-2xl relative bg-yellow-50"
            whileHover={!isRedirecting ? { scale: 1.02, y: -5 } : {}}
          >
            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">TOP</div>
            <h4 className="text-2xl font-bold text-yellow-700">Premium</h4>
            <p className="text-4xl font-extrabold my-2 text-gray-900">
              €19<span className="text-base font-normal text-gray-500">/mese</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">Gestione completa e ottimizzazione.</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Tutte le funzionalità Base</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-600" /> Generazione Turni Intelligente (AI)</li>
              <li className="flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-600" /> Notifiche Automatiche (SMS/Email)</li>
              <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-yellow-600" /> Reportistica Avanzata e Costi</li>
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
                  <span>Caricamento...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Attiva Premium
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (isLoginView) {
      result = await authSignIn(email, password);
    } else {
      result = await authSignUp(email, password);
      if (!result.error) {
        // Se la registrazione ha successo, mostra un messaggio
        // (Supabase invierà un'email di conferma, se l'hai attivata)
        alert('Registrazione completata! Controlla la tua email per confermare l\'account.');
        // Rimettiamo in modalità login
        setIsLoginView(true);
      }
    }

    if (result.error) {
      setError(result.error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
          {isLoginView ? 'Accedi a ShiftMate' : 'Crea un Account'}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLoginView ? 'Inserisci le tue credenziali' : 'Inizia a gestire i tuoi turni'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ loop: Infinity, ease: "linear", duration: 1 }}
              />
            ) : (
              isLoginView ? 'Accedi' : 'Registrati'
            )}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isLoginView
              ? 'Non hai un account? Registrati'
              : 'Hai già un account? Accedi'}
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