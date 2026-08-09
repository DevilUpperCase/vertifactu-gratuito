import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faFileInvoice,
  faUsers,
  faCog,
  faShieldAlt,
  faEnvelope,
} from '../utils/icons';

interface SidebarProps {
  activeTab: 'dashboard' | 'invoices' | 'clients' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'invoices' | 'clients' | 'settings') => void;
  verifactuEnabled: boolean;
  onOpenGuide?: () => void;
  theme: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  verifactuEnabled,
  theme,
}) => {
  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: faChartLine },
    { id: 'invoices', label: 'Facturas', icon: faFileInvoice },
    { id: 'clients', label: 'Clientes', icon: faUsers },
    { id: 'settings', label: 'Configuración', icon: faCog },
  ];

  return (
    <aside
      className={`w-64 backdrop-blur-xl border-r flex flex-col h-screen select-none z-20 transition-colors duration-200 ${
        isDark
          ? 'bg-[#1e1f20] border-zinc-800 text-zinc-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`p-6 border-b flex items-center gap-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0055ff] via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
          <FontAwesomeIcon icon={faFileInvoice} className="text-xl" />
        </div>
        <div>
          <h1
            className={`font-bold text-base leading-tight ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-white'
                : 'text-slate-900'
            }`}
          >
            Verifactu Gratuito
          </h1>
          <p className={`text-xs font-medium ${isDark ? 'text-blue-400/80' : 'text-blue-600'}`}>
            Taratic • Facturación Local
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/20 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-950/60 font-semibold'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm font-semibold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`text-base ${
                  isActive
                    ? isDark
                      ? 'text-blue-400'
                      : 'text-blue-600'
                    : isDark
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Verifactu Compliance Status Widget */}
      <div
        className={`p-4 m-4 rounded-2xl border shadow-xl transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black border-blue-500/20'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShieldAlt}
              className={isDark ? 'text-blue-400 text-sm' : 'text-blue-600 text-sm'}
            />
            <span className={`text-xs font-semibold ${isDark ? 'text-blue-200' : 'text-slate-800'}`}>
              Verifactu AEAT
            </span>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              verifactuEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {verifactuEnabled
            ? 'Modo inmutable activo según Ley Antifraude 11/2021'
            : 'Desactivado. Puedes activarlo en Configuración.'}
        </p>
      </div>

      {/* Footer Info & Taratic Support */}
      <div
        className={`p-4 text-center border-t text-[11px] space-y-3 ${
          isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex flex-col gap-2 w-full">
          <a
            href="https://taratic.com"
            target="_blank"
            rel="noreferrer"
            className="w-full px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 border bg-white hover:bg-blue-50 text-blue-600 border-slate-200 shadow-xs"
          >
            <img src="/taratic.webp" alt="Taratic Logo" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
            <span className="truncate">taratic.com</span>
          </a>
          <a
            href="mailto:contacto@taratic.com"
            className="w-full px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 border bg-white hover:bg-blue-50 text-blue-600 border-slate-200 shadow-xs"
          >
            <FontAwesomeIcon icon={faEnvelope} className="text-xs text-blue-600 shrink-0" />
            <span className="truncate">contacto@taratic.com</span>
          </a>
        </div>
        <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          NeutralinoJS + SQLite WASM • v1.0.0
        </div>
      </div>
    </aside>
  );
};
