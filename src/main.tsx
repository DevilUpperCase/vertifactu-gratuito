import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Neutralino from '@neutralinojs/lib';
import App from './App.tsx';
import './index.css';

Neutralino.init();
window.Neutralino = Neutralino; // Expose globally for existing code

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
