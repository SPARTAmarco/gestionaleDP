# Gestionale DP (Shiftmate) 📅📦

Un sistema di gestione aziendale leggero e moderno costruito in React. L'applicazione offre un'interfaccia unica, intuitiva e reattiva per amministrare dipendenti, turni settimanali, ferie/permessi e l'inventario del magazzino.

## 🚀 Funzionalità Principali

### 👥 Gestione Dipendenti
- Aggiunta, modifica e dismissione del personale.
- Registrazione dei dettagli e calcolo ore settimanali del contratto.
- Interfaccia dedicata (Area Personale) accessibile tramite un link unico e sicuro per ogni dipendente.
- I dipendenti possono visualizzare i propri turni settimanali e inviare richieste rapide dal proprio smartphone senza scaricare app terze.

### 🕒 Pianificazione Turni
- Comoda vista settimanale con calendario e riepilogo orario.
- Copia multi-settimana: copia la pianificazione attuale per N settimane future con un click.
- Avvisi visivi e conteggio in tempo reale delle ore assegnate ai vari membri dello staff.
- **Esportazione PDF / Excel** della programmazione per stampa o distribuzione manuale.

### ✉️ Gestione Richieste (Assenze e Ferie)
- Sistema centralizzato per ricevere e smistare rapidamente richieste di malattia, ferie o permessi extra inviate dallo staff.
- Approvazione/Rifiuto con 1 click.

### 📦 Magazzino
- Monitoraggio quantità inventario (carico/scarico di merce).
- Creazione e cancellazione di Categorie Prodotti.
- **Alert scorte basse**: ogni articolo può avere una soglia minima; superata la soglia il prodotto diventa rosso.
- Sistema di log per ogni movimento (chi, cosa e quanto è stato aggiunto/inviato).
- Gestione costi e lista fornitori (appunti testuali) rapida.

### 🌐 Impostazioni & Utilities
- Temi visivi Dark Mode 🌙 e Light Mode ☀️.
- Multilingua integrato (Italiano e Inglese).
- Layout mobile-first, ottimizzato per uso su tablet e telefono durante il servizio.

## 🛠️ Stack Tecnologico

Questo progetto è costruito con le migliori e più recenti tecnologie web:
- **[React 19](https://react.dev/)** + **[Vite](https://vitejs.dev/)**: Per un'interfaccia fulminea e reattiva.
- **[Tailwind CSS](https://tailwindcss.com/)**: Per uno stile elegante, coerente e customizzabile.
- **[Supabase](https://supabase.com/)**: Per un database PostgreSQL pronto all'uso con autenticazione e Policy di sicurezza.
- **[Framer Motion](https://www.framer.com/motion/)**: Animazioni di pagina micro-interattive fluide.
- **Librerie UI**: [Lucide React](https://lucide.dev/) (Icons), `jspdf` e `xlsx` per stampe ed esportazioni analitiche.

## ⚙️ Installazione Locale

Vuoi provare il progetto localmente?
Assicurati di avere `Node.js` installato e un nuovo progetto Supabase creato.

1. **Clona la repo**
   ```bash
   git clone https://github.com/tuo-username/gestionale-dp.git
   cd gestionale-dp
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Apri Supabase e vai nell'SQL Editor.
   - Esegui lo script che trovi in `database_scripts/nuovo_database.sql`
   - Esegui lo script aggiuntivo in `database_scripts/create_warehouse_categories.sql` per abilitare le categorie del magazzino.

4. **Variabili d'ambiente**
   - Rinomina o crea un file `.env` copiando i dati del tuo progetto Supabase:
   ```env
   VITE_SUPABASE_URL=https://tuo-url.supabase.co
   VITE_SUPABASE_ANON_KEY=la-tua-chiave-anonima
   ```

5. **Lancia il server locale!**
   ```bash
   npm run dev
   ```

## 🤝 Contributi
Problemi o richieste di nuove funzionalità? Sentiti libero di aprire un'*Issue* o inviare una *Pull Request* in qualunque momento.

## 📄 Licenza
Rilasciato per uso privato. Copyright © 2024-2026.
