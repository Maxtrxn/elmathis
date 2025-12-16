import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Si tu as gardé le CSS, sinon supprime cette ligne
import { BrowserRouter } from 'react-router-dom' // <--- IMPORT IMPORTANT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- ENVELOPPE TON APP ICI */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)