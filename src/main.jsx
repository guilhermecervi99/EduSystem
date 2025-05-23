import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🎬 main.jsx loading...');

ReactDOM.createRoot(document.getElementById('root')).render(
  // ✅ REMOVIDO React.StrictMode temporariamente para eliminar dupla execução
  <App />
)

console.log('✅ React app mounted');