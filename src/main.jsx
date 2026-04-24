import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// BASE_URL lo define Vite a partir de `base` en vite.config.js.
// Lo usamos para que React Router funcione en subdirectorios (GitHub Pages).
const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || undefined;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
