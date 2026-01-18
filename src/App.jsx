import React from 'react';
import { AppProvider } from './context/AppContext';
import AppRouter from './AppRouter';
import './index.css'; // Assicurati che gli stili siano importati

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;