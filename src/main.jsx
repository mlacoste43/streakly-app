import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './redesign/redesign.css'
import { initTelegram } from './telegram.js'
import { SettingsProvider } from './context/SettingsContext.jsx'

initTelegram()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
)
