import JoinTeamView from './components/views/JoinTeamView';
import EmployeeDashboard from './components/views/EmployeeDashboard';
import EmployeesView from './components/views/EmployeesView'; // Assicurati che ci sia
import { supabase } from './supabaseClient';
import SettingsView from './components/views/SettingsView';
import { translations } from './utils/translations';
import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  Calendar, Users, Bell, Settings, LogOut, Plus,
  ChevronLeft, ChevronRight, Menu, X, Clock,
  Download, TrendingUp, AlertCircle, CheckCircle,
  Search, Filter, Edit2, Trash2, XCircle, DollarSign, Zap, Moon, Sun, Lock, Globe, Shield, Mail, User, FileSpreadsheet, LogIn, Briefcase
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
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });
  // ======================================
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

  // Carica le impostazioni dal localStorage all'avvio
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

  const updateSettings = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      // Salva nel localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('shiftmate-settings', JSON.stringify(updated));
      }
      return updated;
    });
    // showNotification('Impostazione aggiornata'); // Optional: too noisy?
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
      // Salva nel localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('shiftmate-settings', JSON.stringify(updated));
      }
      return updated;
    });
  };
  // ========================

  // ==== NOTIFICHE EMAIL E PUSH ====
  // Funzione per inviare email notifiche (simulata - in produzione usare un servizio reale)
  const sendShiftEmailNotification = async (employee, shift, action) => {
    if (!settings.emailNotifications?.shifts) return;

    try {
      // In produzione, qui chiameresti un servizio email (EmailJS, SendGrid, Supabase Edge Function, ecc.)
      // Per ora simuliamo l'invio mostrando un log
      const shiftDate = new Date(shift.date).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      const emailContent = {
        to: employee.email,
        subject: action === 'created'
          ? `Nuovo turno assegnato - ${shiftDate}`
          : action === 'updated'
            ? `Turno modificato - ${shiftDate}`
            : `Turno cancellato - ${shiftDate}`,
        body: action === 'created'
          ? `Ciao ${employee.firstName},\n\nTi è stato assegnato un nuovo turno:\n\nData: ${shiftDate}\nOrario: ${shift.startTime} - ${shift.endTime}\nTipo: ${shift.type}\n\nBuon lavoro!\n\nShiftMate`
          : action === 'updated'
            ? `Ciao ${employee.firstName},\n\nIl tuo turno è stato modificato:\n\nData: ${shiftDate}\nOrario: ${shift.startTime} - ${shift.endTime}\nTipo: ${shift.type}\n\nBuon lavoro!\n\nShiftMate`
            : `Ciao ${employee.firstName},\n\nIl tuo turno del ${shiftDate} (${shift.startTime} - ${shift.endTime}) è stato cancellato.\n\nShiftMate`
      };

      // Simulazione: in produzione sostituire con chiamata API reale
      console.log('📧 Email inviata:', emailContent);

      // Esempio di integrazione con un servizio email (da scommentare e configurare):
      // await fetch('https://api.emailservice.com/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(emailContent)
      // });

      return true;
    } catch (error) {
      console.error('Errore invio email:', error);
      return false;
    }
  };

  // Funzione per mostrare notifiche push del browser
  const sendPushNotification = async (title, options = {}) => {
    if (!settings.pushNotifications) return;

    // Verifica se il browser supporta le notifiche
    if (!('Notification' in window)) {
      console.warn('Questo browser non supporta le notifiche push');
      return;
    }

    // Richiedi permesso se non già concesso
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permesso notifiche negato');
        return;
      }
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico', // Aggiungi un'icona se disponibile
          badge: '/favicon.ico',
          tag: 'shiftmate-notification',
          requireInteraction: false,
          ...options
        });

        // Chiudi automaticamente dopo 5 secondi
        setTimeout(() => notification.close(), 5000);

        // Gestisci il click sulla notifica
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      } catch (error) {
        console.error('Errore notifica push:', error);
        return false;
      }
    }
  };

  // Funzione helper per notificare cambiamenti turni
  const notifyShiftChange = async (employee, shift, action) => {
    // Notifica email
    if (settings.emailNotifications?.shifts && employee?.email) {
      await sendShiftEmailNotification(employee, shift, action);
    }

    // Notifica push (solo se l'utente corrente è il dipendente interessato)
    if (settings.pushNotifications && user?.id === employee?.id) {
      const shiftDate = new Date(shift.date).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
      });

      const title = action === 'created'
        ? 'Nuovo turno assegnato'
        : action === 'updated'
          ? 'Turno modificato'
          : 'Turno cancellato';

      const body = action === 'created'
        ? `${shiftDate}: ${shift.startTime} - ${shift.endTime}`
        : action === 'updated'
          ? `${shiftDate}: ${shift.startTime} - ${shift.endTime}`
          : `Turno del ${shiftDate} cancellato`;

      await sendPushNotification(title, { body });
    }
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

  // ==== GESTIONE PERMESSI NOTIFICHE PUSH ====
  // Spostato dopo le definizioni delle funzioni
  // ===========================================

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
      // 1. CARICAMENTO PROFILO
      let finalProfileData = { is_premium: false, role: 'employee' }; // Default prudente

      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        // AGGIUNTA FONDAMENTALE: includi 'role' e 'business_id' nella select
        .select('is_premium, stripe_customer_id, role, business_id, first_name, last_name')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchedProfile) {
        finalProfileData = fetchedProfile;
      }

      // Aggiorniamo lo stato User includendo ruolo e business_id
      // Questo è FONDAMENTALE per il routing in App.jsx
      const completeUser = {
        ...authUser,
        ...finalProfileData
      };
      setUser(completeUser);

      // --- 2. CARICAMENTO DATI ATTIVITÀ (Business) ---

      let businessData = null;
      let businessError = null;
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', authUser.id)
          .maybeSingle();

        if (error) throw error;
        businessData = data;
      } catch (err) {
        console.warn("Impossibile caricare business (forse sei dipendente o errore DB):", err.message);
      }

      if (businessData) {
        console.log("Sto cercando dipendenti per il business:", businessData.id);

        const { data: realEmployees, error: empError } = await supabase
          .from('profiles')
          .select('*')
          .eq('business_id', businessData.id) // Prendi chiunque sia in questo business
          .neq('id', authUser.id); // Escludi me stesso (titolare)

        if (empError) {
          console.error("Errore database dipendenti:", empError);
        } else {
          console.log("Dipendenti trovati nel DB (Grezzi):", realEmployees);
        }

        if (realEmployees && realEmployees.length > 0) {
          // Mappatura CRUCIALE: Database (snake_case) -> App (camelCase)
          const formattedEmployees = realEmployees.map(emp => ({
            id: emp.id,
            firstName: emp.first_name || 'Nome',
            lastName: emp.last_name || 'Cognome',
            email: emp.email, // Aggiunto email
            position: emp.position || 'Dipendente',
            contractHours: emp.contract_hours || 40,
            isActive: true, // Assumiamo attivi se sono nel DB
            color: generateRandomColor()
          }));

          console.log("Dipendenti formattati per la grafica:", formattedEmployees);
          setEmployees(formattedEmployees);
        } else {
          setEmployees([]);
        }
      } else {
        setEmployees([]); // Nessun business, nessun dipendente
      }

      // LOGICA BIVIO: Sei dipendente o titolare?
      if (finalProfileData.role === 'employee' && finalProfileData.business_id) {
        // CASO DIPENDENTE: Carica l'azienda a cui sei stato assegnato
        const response = await supabase
          .from('businesses')
          .select('*')
          .eq('id', finalProfileData.business_id) // Cerca per ID azienda
          .maybeSingle();
        businessData = response.data;
        businessError = response.error;

      } else {
        // CASO TITOLARE (Default): Carica l'azienda che possiedi
        const response = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', authUser.id) // Cerca per Owner ID
          .maybeSingle();
        businessData = response.data;
        businessError = response.error;
      }

      if (businessError) console.error("Errore caricamento business:", businessError);

      if (businessData) {
        setBusiness(businessData);
      } else {
        // Non impostare un business fittizio - se non c'è business nel DB, deve essere null
        // Questo forzerà l'utente a creare un business prima di poter creare turni
        setBusiness(null);
      }

      // --- 3. CARICAMENTO TURNI E RICHIESTE (Placeholder) ---
      // --- D. CARICA TURNI (SHIFTS) ---
      if (businessData) {
        const { data: realShifts, error: shiftError } = await supabase
          .from('shifts')
          .select('*')
          .eq('business_id', businessData.id); // Prende tutti i turni del locale

        console.log("DEBUG: Shifts fetched for business", businessData.id, realShifts); // DEBUG LOG

        if (realShifts) {
          // Mappiamo da DB (start_time) a App (startTime)
          const formattedShifts = realShifts.map(s => ({
            id: s.id,
            employeeId: s.employee_id,
            date: s.date,
            startTime: s.start_time?.slice(0, 5), // Toglie i secondi (09:00:00 -> 09:00)
            endTime: s.end_time?.slice(0, 5),
            type: s.type
            // Nota: 'notes' rimosso perché non esiste nella tabella shifts
          }));

          setShifts(formattedShifts);
        }
      } else {
        setShifts([]);
      }

      // --- E. CARICA RICHIESTE (REQUESTS) ---
      if (businessData) {
        const { data: realRequests, error: reqError } = await supabase
          .from('requests')
          .select('*')
          .eq('business_id', businessData.id);

        if (realRequests) {
          const formattedRequests = realRequests.map(r => ({
            id: r.id,
            employeeId: r.employee_id,
            type: r.type,
            reason: r.reason, // Usiamo 'reason' come messaggio/motivo
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
            createdAt: r.created_at
          }));
          setRequests(formattedRequests);
        }
      } else {
        setRequests([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
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

      // 2. AGGIORNA O CREA DATI BUSINESS (La correzione è qui)
      // Usiamo upsert: se non esiste, lo crea.
      const { data: updatedBusinessData, error: busError } = await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id, // La chiave per capire chi siamo
          name: formData.businessName,
          address: formData.address,
          phone: formData.phone
        }, { onConflict: 'owner_id' }) // Se trovi questo owner_id, aggiorna, altrimenti inserisci
        .select()
        .single();

      if (busError) {
        console.error("Errore Supabase Business:", busError); // Debug console
        throw busError;
      }

      console.log("Dati salvati nel DB:", updatedBusinessData); // Verifica che i dati tornino

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
      if (updatedBusinessData) {
        setBusiness(updatedBusinessData);
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
    // Estraiamo i dati, incluso il ruolo (che arriva da AuthView)
    const { email, password, firstName, lastName, businessName, address, phone, role } = formData;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role, // Salviamo 'owner' o 'employee'
            // Questi campi saranno vuoti se è un dipendente, e va bene così:
            business_name: businessName,
            business_address: address,
            business_phone: phone
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
      setIsLoading(true);

      // Validazione dati
      if (!business || !business.id) {
        throw new Error('Nessuna attività selezionata. Assicurati di essere loggato come titolare.');
      }

      if (!formData.employeeId) {
        throw new Error('Seleziona un dipendente per il turno.');
      }

      if (!formData.date || !formData.startTime || !formData.endTime) {
        throw new Error('Compila tutti i campi obbligatori (data, orario inizio, orario fine).');
      }

      // Prepariamo i dati per il DB (snake_case)
      const shiftData = {
        business_id: business.id,         // Fondamentale: collega il turno al bar
        employee_id: formData.employeeId,
        date: formData.date,
        start_time: formData.startTime,   // DB usa snake_case (start_time)
        end_time: formData.endTime,
        type: formData.type || 'morning'   // Default se non specificato
        // Nota: 'notes' rimosso perché non esiste nella tabella shifts
      };

      console.log('Dati turno da salvare:', shiftData); // Debug

      let result;
      let error;

      if (selectedShift) {
        // --- MODIFICA TURNO ESISTENTE ---
        console.log('Modifica turno esistente:', selectedShift.id);
        const { data, error: updateError } = await supabase
          .from('shifts')
          .update(shiftData)
          .eq('id', selectedShift.id)
          .select();
        result = data;
        error = updateError;
      } else {
        // --- CREA NUOVO TURNO ---
        console.log('Creazione nuovo turno');
        const { data, error: insertError } = await supabase
          .from('shifts')
          .insert([shiftData])
          .select();
        result = data;
        error = insertError;
      }

      if (error) {
        console.error('Errore Supabase completo:', error);
        console.error('Dettagli errore:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(error.message || error.details || 'Errore nel salvare il turno nel database');
      }

      console.log('Turno salvato con successo:', result);

      // Ricarichiamo TUTTI i dati per vedere le modifiche aggiornate
      await loadData(user);

      // ==== INVIO NOTIFICHE ====
      // Trova il dipendente interessato
      const employee = employees.find(emp => emp.id === formData.employeeId);
      if (employee) {
        const shiftForNotification = {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type || 'morning'
          // Nota: 'notes' rimosso perché non esiste nella tabella shifts
        };
        // Invio notifiche in modo asincrono (non blocca il salvataggio)
        notifyShiftChange(employee, shiftForNotification, selectedShift ? 'updated' : 'created').catch(err => {
          console.warn('Errore invio notifiche:', err);
          // Non blocchiamo il salvataggio se le notifiche falliscono
        });
      }
      // ========================

      showNotification(selectedShift ? 'Turno aggiornato' : 'Turno creato');
      return true;

    } catch (error) {
      console.error('Errore salvataggio turno:', error);
      const errorMessage = error.message || 'Errore nel salvare il turno';
      showNotification(errorMessage, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Già che ci siamo, sistemiamo anche la CANCELLAZIONE
  async function handleDeleteShift(id) {
    try {
      // Trova il turno prima di eliminarlo per le notifiche
      const shiftToDelete = shifts.find(s => s.id === id);

      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;

      // Rimuoviamo localmente per fare prima
      setShifts(prev => prev.filter(s => s.id !== id));

      // ==== INVIO NOTIFICHE ====
      if (shiftToDelete) {
        const employee = employees.find(emp => emp.id === shiftToDelete.employeeId);
        if (employee) {
          await notifyShiftChange(employee, shiftToDelete, 'deleted');
        }
      }
      // ========================

      showNotification('Turno eliminato');
    } catch (error) {
      showNotification('Errore eliminazione turno', 'error');
    }
  }



  async function handleApproveRequest(id) {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'approved' } : req
      ));
      showNotification('Richiesta approvata');
    } catch (error) {
      console.error('Errore approvazione richiesta:', error);
      showNotification('Errore nell\'approvare la richiesta', 'error');
    }
  }

  async function handleRejectRequest(id) {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' } : req
      ));
      showNotification('Richiesta rifiutata');
    } catch (error) {
      console.error('Errore rifiuto richiesta:', error);
      showNotification('Errore nel rifiutare la richiesta', 'error');
    }
  }

  async function handleCreateRequest(requestData) {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('requests')
        .insert([{
          business_id: business.id,
          employee_id: user.id,
          type: requestData.type, // 'ferie', 'permesso', 'malattia', 'altro'
          reason: requestData.reason,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          status: 'pending'
        }]);

      if (error) throw error;

      await loadData(user); // Ricarica per vedere la nuova richiesta
      showNotification('Richiesta inviata con successo');
      return true;
    } catch (error) {
      console.error('Errore creazione richiesta:', error);
      showNotification('Errore invio richiesta', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRepeatSchedule(weeksToRepeat) {
    try {
      setIsLoading(true);
      const weeks = parseInt(weeksToRepeat);
      if (isNaN(weeks) || weeks < 1) return;

      const sourceWeekStart = new Date(currentWeekStart);
      const sourceWeekEnd = new Date(sourceWeekStart);
      sourceWeekEnd.setDate(sourceWeekEnd.getDate() + 6);

      // 1. Get source shifts
      const sourceShifts = shifts.filter(s => {
        const d = new Date(s.date);
        return d >= sourceWeekStart && d <= sourceWeekEnd;
      });

      if (sourceShifts.length === 0) {
        showNotification('Nessun turno da ripetere in questa settimana', 'error');
        return;
      }

      for (let i = 1; i <= weeks; i++) {
        const targetStart = new Date(sourceWeekStart);
        targetStart.setDate(targetStart.getDate() + (7 * i));

        const targetEnd = new Date(targetStart);
        targetEnd.setDate(targetEnd.getDate() + 6);

        // 2. Delete existing shifts in target week
        const { error: deleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('business_id', business.id)
          .gte('date', targetStart.toISOString().split('T')[0])
          .lte('date', targetEnd.toISOString().split('T')[0]);

        if (deleteError) throw deleteError;

        // 3. Prepare new shifts
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
            type: s.type,
            notes: s.notes || null
          };
        });

        // 4. Insert new shifts
        if (newShifts.length > 0) {
          const { error: insertError } = await supabase
            .from('shifts')
            .insert(newShifts);

          if (insertError) throw insertError;
        }
      }

      await loadData(user);
      showNotification(`Pianificazione ripetuta per ${weeks} settimane`);

    } catch (error) {
      console.error('Errore ripetizione turni:', error);
      showNotification('Errore durante la ripetizione', 'error');
    } finally {
      setIsLoading(false);
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
    handleRejectRequest,
    handleRejectRequest,
    handleCreateRequest, // <--- NUOVA FUNZIONE
    handleRepeatSchedule, // <--- NUOVA FUNZIONE
    exportPDF,
    exportExcel,
    t: (key) => {
      const lang = settings.language || 'it';
      return translations[lang][key] || key;
    },
    updateProfile: async (data) => {
      try {
        setIsLoading(true);

        // 1. Aggiorna Auth (Nome Utente)
        const updates = {
          data: {
            first_name: data.firstName,
            last_name: data.lastName
          }
        };
        if (data.email && data.email !== user.email) {
          updates.email = data.email;
        }

        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw authError;

        // 2. AGGIORNA O CREA DATI BUSINESS (solo se businessName, address o phone sono presenti)
        if (data.businessName !== undefined || data.address !== undefined || data.phone !== undefined) {
          const { data: updatedBusinessData, error: busError } = await supabase
            .from('businesses')
            .upsert({
              owner_id: user.id,
              name: data.businessName,
              address: data.address,
              phone: data.phone
            }, { onConflict: 'owner_id' })
            .select()
            .single();

          if (busError) {
            console.error("Errore Supabase Business:", busError);
            throw busError;
          }

          console.log("Dati salvati nel DB:", updatedBusinessData);

          // Aggiorna la Sidebar immediatamente con i dati freschi
          if (updatedBusinessData) {
            setBusiness(updatedBusinessData);
          }
        }

        // 3. Aggiorna Stato Locale
        setUser(prev => ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            first_name: data.firstName,
            last_name: data.lastName
          },
          email: data.email
        }));

        showNotification('Salvato con successo!');
        return true;

      } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Errore: ' + error.message, 'error');
        return false;
      } finally {
        setIsLoading(false);
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
    toggleTheme,
    // Funzione per ricaricare i dati dell'utente
    reloadUserData: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await loadData(session.user);
      }
    }
  };

  // ==== GESTIONE PERMESSI NOTIFICHE PUSH ====
  useEffect(() => {
    // Quando pushNotifications viene attivato, richiedi i permessi
    if (settings.pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Permesso notifiche push concesso');
            // Mostra una notifica di test
            sendPushNotification('Notifiche attivate!', {
              body: 'Riceverai notifiche quando i tuoi turni cambiano.'
            });
          } else if (permission === 'denied') {
            console.warn('Permesso notifiche negato');
            // Disattiva automaticamente se l'utente nega
            updateSettings('pushNotifications', false);
            showNotification('Permesso notifiche negato. Attiva le notifiche nelle impostazioni del browser.', 'error');
          }
        });
      } else if (Notification.permission === 'denied') {
        // Se i permessi sono stati negati in precedenza, disattiva
        updateSettings('pushNotifications', false);
        showNotification('Permesso notifiche negato. Attiva le notifiche nelle impostazioni del browser.', 'error');
      }
    }
  }, [settings.pushNotifications]);
  // ===========================================

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

function DashboardView({ onAddShift, onEditShift, onOpenRepeatWeeksModal }) {
  const {
    currentWeekStart, getWeekDays, changeWeek,
    employees, shifts, getShiftsForDate, calculateWeekHours,
    pendingRequestsCount, exportPDF, exportExcel, t, settings,
    handleRepeatSchedule // <--- Added
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

        <motion.button
          onClick={onOpenRepeatWeeksModal}
          className="bg-white dark:bg-dark-surface text-blue-600 dark:text-blue-400 p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer shadow border border-blue-100 dark:border-blue-900"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex flex-col items-center">
            <TrendingUp className="w-6 h-6 mb-2" />
            <div className="font-bold text-sm">Ripeti Turni</div>
          </div>
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
                    <th key={idx} className={`text-center p-4 font-semibold group relative ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { weekday: 'short' })}
                      </div>
                      <div className={`text-sm ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                        {day.getDate()} {day.toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'it-IT', { month: 'short' })}
                      </div>

                      {/* Quick Add Button */}
                      <motion.button
                        onClick={() => onAddShift(day.toISOString().split('T')[0])}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full transition-opacity"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={t('add_shift')}
                      >
                        <Plus className="w-3 h-3" />
                      </motion.button>
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
                                {shift.notes && <span className="ml-1 text-xs">💬</span>}
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
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors shadow-sm text-gray-700 dark:text-gray-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-500" />
          <span className="font-medium">{t('export_excel')}</span>
        </motion.button>
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          {t('requests_history') || 'Storico Richieste'}
        </h2>
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((req) => {
              const employee = getEmployeeById(req.employeeId);
              return (
                <div key={req.id} className="p-4 border border-gray-100 dark:border-dark-border rounded-lg flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{employee?.firstName} {employee?.lastName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className={`font-medium ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {req.status === 'approved' ? (t('approved') || 'Approvata') : (t('rejected') || 'Rifiutata')}
                      </span>
                      : {req.reason}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500">{t('no_history') || 'Nessuna richiesta nello storico'}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}






// ============================================
// FILE: src/components/modals/EmployeeModal.js
// ============================================

function EmployeeModal({ employee, onSave, onClose, readOnly = false }) {
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
    if (readOnly) return;
    onSave({ ...formData, contractHours: Number(formData.contractHours) });
  };

  return (
    <AnimatedModal title={employee ? (readOnly ? (t('employee_details') || 'Dettagli Dipendente') : t('edit_employee')) : t('create_employee')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input disabled={readOnly} type="text" name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
          <input disabled={readOnly} type="text" name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required className="p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <input disabled={readOnly} type="text" name="position" placeholder="Posizione (es. Barista)" value={formData.position} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
        <input disabled={readOnly} type="number" name="contractHours" placeholder="Ore Contratto Settimanali" value={formData.contractHours} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
        <input disabled={readOnly} type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
        <input disabled={readOnly} type="tel" name="phone" placeholder="Telefono" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />

        {!readOnly && (
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
        )}
      </form>
    </AnimatedModal>
  );
}

// ============================================
// FILE: src/components/modals/EmailVerificationModal.js
// ============================================

function EmailVerificationModal({ message, onClose }) {
  return (
    <AnimatedModal title="Verifica Email" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300 text-lg">
          {message}
        </p>
        <div className="pt-4 flex justify-center">
          <motion.button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ho capito
          </motion.button>
        </div>
      </div>
    </AnimatedModal>
  );
}

// ============================================
// FILE: src/components/modals/RepeatWeeksModal.js
// ============================================

function RepeatWeeksModal({ onConfirm, onClose }) {
  const [weeks, setWeeks] = useState('');
  const { t } = useAppContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    const weeksNum = parseInt(weeks);
    if (!isNaN(weeksNum) && weeksNum > 0) {
      onConfirm(weeksNum);
      onClose();
    }
  };

  return (
    <AnimatedModal title="Ripeti Pianificazione" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Per quante settimane future vuoi ripetere questa pianificazione?
        </p>
        <input
          type="number"
          min="1"
          max="52"
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
          placeholder="Es. 1, 4, 8..."
          required
          className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-2xl font-bold"
          autoFocus
        />
        <div className="pt-4 flex justify-between">
          <motion.button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Annulla
          </motion.button>
          <motion.button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Conferma
          </motion.button>
        </div>
      </form>
    </AnimatedModal>
  );
}

// ============================================
// FILE: src/components/modals/ShiftModal.js
// ============================================

function ShiftModal({ shift, initialDate, onSave, onDelete, onClose }) {
  const { employees, t } = useAppContext(); // Prendi i dipendenti dal context

  const [formData, setFormData] = useState({
    employeeId: shift?.employeeId || employees[0]?.id || '',
    date: shift?.date || initialDate || new Date().toISOString().split('T')[0],
    startTime: shift?.startTime || '09:00',
    endTime: shift?.endTime || '17:00',
    type: shift?.type || 'morning'
    // Nota: 'notes' rimosso perché non esiste nella tabella shifts del database
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
        {/* Campo notes rimosso perché non esiste nella tabella shifts del database */}

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
  // All'inizio della funzione AppProvider o App:
  const [business, setBusiness] = useState(null); // Deve essere inizializzato a null, non undefined
  // 1. PRENDI LO STATO GLOBALE
  const { user, isLoading, showNotification, reloadUserData } = useAppContext();

  // 2. STATO DI NAVIGAZIONE (Rimane qui)
  const [currentView, setCurrentView] = useState('dashboard');

  // 3. STATO DEI MODALI (Rimane qui)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null); // Nuovo stato per la data iniziale
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [showRepeatWeeksModal, setShowRepeatWeeksModal] = useState(false);

  // 4. FUNZIONI HELPER PER I MODALI (Rimangono qui)
  //    (Prendiamo le funzioni di salvataggio dal context)
  const { handleSaveEmployee, handleSaveShift, handleDeleteShift, handleRepeatSchedule } = useAppContext();

  const openAddEmployee = () => { setSelectedEmployee(null); setShowEmployeeModal(true); };
  const openEditEmployee = (emp) => { setSelectedEmployee(emp); setShowEmployeeModal(true); };

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
  //    (Rimane qui)
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} onOpenRepeatWeeksModal={() => setShowRepeatWeeksModal(true)} />;
      case 'employees':
        // ECCOLO QUI:
        return <EmployeesView onAddEmployee={openAddEmployee} onEditEmployee={openEditEmployee} />;
      case 'requests':
        return <RequestsView />;
      case 'settings':
        return <SettingsView onOpenPremium={() => setShowPremiumModal(true)} />;
      default:
        return <DashboardView onAddShift={openAddShift} onEditShift={openEditShift} onOpenRepeatWeeksModal={() => setShowRepeatWeeksModal(true)} />;
    }
  };

  // 6. EFFETTO PER I REDIRECT DI STRIPE
  //    Gestisce redirect da Stripe Checkout e aggiorna is_premium
  useEffect(() => {
    const currentPath = window.location.pathname;
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get('session_id');
    const wasCanceled = queryParams.get('canceled'); // Stripe può aggiungere questo parametro

    // Pulisci subito l'URL da path non desiderati (success, declined, canceled, ecc.)
    const needsCleanup =
      currentPath.includes('/success') ||
      currentPath.includes('/declined') ||
      currentPath.includes('/canceled') ||
      currentPath.includes('/failed');

    if (needsCleanup) {
      window.history.replaceState(null, null, '/');
    }

    // CASO 1: Ritorno da Stripe con session_id (pagamento completato o tentato)
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

          console.log('📥 Risposta verify-payment:', { data, error });

          if (error) {
            console.error('❌ Errore nella chiamata verify-payment:', error);
            console.error('Dettagli errore:', JSON.stringify(error, null, 2));
            throw new Error(error.message || error.error || 'Errore sconosciuto');
          }

          if (data && data.success) {
            console.log('✅ Pagamento verificato con successo!');
            console.log('Dettagli risposta:', data);

            // Aspetta un momento per assicurarsi che il database sia aggiornato
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Ricarica i dati dell'utente per ottenere i dati aggiornati
            console.log('🔄 Ricarico dati utente...');
            await reloadUserData();

            // Verifica che is_premium sia stato aggiornato - se non lo è, aggiorna direttamente
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
              const { data: profileCheck, error: checkError } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', session.user.id)
                .single();

              console.log('🔍 Verifica finale is_premium:', profileCheck);
              console.log('Errore verifica:', checkError);

              if (profileCheck && profileCheck.is_premium) {
                showNotification('🎉 Benvenuto in Premium! Il tuo account è stato aggiornato.', 'success');
              } else {
                console.warn('⚠️ is_premium non ancora aggiornato, aggiorno direttamente dal frontend...');

                // Fallback: aggiorna direttamente dal frontend
                const { error: directUpdateError, data: directUpdateData } = await supabase
                  .from('profiles')
                  .update({ is_premium: true })
                  .eq('id', session.user.id)
                  .select();

                console.log('Risultato aggiornamento diretto:', { directUpdateError, directUpdateData });

                if (directUpdateError) {
                  console.error('Errore aggiornamento diretto:', directUpdateError);
                  showNotification('Pagamento completato ma errore nell\'aggiornamento. Contatta il supporto.', 'error');
                } else {
                  // Ricarica i dati dopo l'aggiornamento diretto
                  await reloadUserData();
                  showNotification('🎉 Benvenuto in Premium! Il tuo account è stato aggiornato.', 'success');
                }
              }
            }
          } else {
            // Pagamento fallito o non completato
            console.warn('⚠️ Pagamento non completato:', data);
            const message = data?.message || 'Il pagamento non è stato completato.';
            showNotification(message, 'error');
          }
        } catch (error) {
          console.error("❌ Errore nella verifica del pagamento:", error);
          console.error("Stack trace:", error.stack);
          showNotification(`Errore: ${error.message}. Contatta il supporto se il problema persiste.`, 'error');
        } finally {
          // Pulisce l'URL rimuovendo tutti i parametri query
          window.history.replaceState(null, null, '/');
        }
      };

      verifyPayment();
    }
    // CASO 2: Ritorno da Stripe con cancellazione esplicita
    else if (wasCanceled === 'true') {
      // L'utente ha annullato il pagamento su Stripe
      console.log('❌ Pagamento annullato dall\'utente');
      showNotification('Pagamento annullato. Puoi sempre attivare Premium in seguito!', 'info');
      // Pulisce l'URL
      window.history.replaceState(null, null, '/');
    }
  }, [showNotification, reloadUserData]); // Dipende da showNotification e reloadUserData


  // 7. NUOVA LOGICA DI RENDERING (IL "ROUTER")
  //    (Sostituisce il tuo vecchio 'return')

  // ... (codice precedente di App.jsx) ...

  // --- BLOCCO DI ROUTING DEFINITIVO ---

  if (isLoading) return <LoadingSpinner />;

  // 1. Se non sei loggato -> Login
  if (!user) return <AuthView />;

  // 2. DETERMINAZIONE RUOLO (Logica Rafforzata)
  // Sei un Titolare SE:
  // - Il DB dice che il tuo ruolo è 'owner'
  // - OPPURE i metadata di registrazione dicono 'owner'
  /// CORREZIONE QUI: Uso il ?. (optional chaining) per evitare il crash se business è null
  const isOwner =
    (user?.role === 'owner') ||
    (user?.user_metadata?.role === 'owner') ||
    (business?.owner_id === user?.id); // <--- Questo punto interrogativo salva l'app

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
            onConfirm={(weeks) => {
              handleRepeatSchedule(weeks.toString());
              setShowRepeatWeeksModal(false);
            }}
            onClose={() => setShowRepeatWeeksModal(false)}
          />
        )}
      </>
    );
  }

  // --- CASO B: SEI UN DIPENDENTE ---
  // Se il codice arriva qui, significa che isOwner è false.

  // Se non hai ancora un team -> Schermata "Unisciti al Team"
  if (!hasBusiness) {
    return (
      <JoinTeamView
        onCreateBusiness={async () => {
          // Usa direttamente 'supabase' che è importato in cima al file
          await supabase.auth.signOut();
          window.location.reload();
        }}
      />
    );
  }

  // Se hai un team -> Dashboard Dipendente
  return (
    <>
      <EmployeeDashboard />
      <Notification />
    </>
  );

} // Fine della funzione App



function AuthView() {
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
      <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors">

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