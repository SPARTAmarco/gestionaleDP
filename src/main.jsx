import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. CAMBIA QUESTA IMPORTAZIONE
import ProvidedApp from './App.jsx' // <-- NUOVA IMPORTAZIONE
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. CAMBIA QUESTO RENDER */}
    <ProvidedApp /> {/* <-- NUOVO RENDER */}
  </React.StrictMode>,
)