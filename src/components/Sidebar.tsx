import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faFileInvoice,
  faUsers,
  faCog,
  faShieldAlt,
} from '../utils/icons';

interface SidebarProps {
  activeTab: 'dashboard' | 'invoices' | 'clients' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'invoices' | 'clients' | 'settings') => void;
  verifactuEnabled: boolean;
  onOpenGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  verifactuEnabled,
  onOpenGuide,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: faChartLine },
    { id: 'invoices', label: 'Facturas', icon: faFileInvoice },
    { id: 'clients', label: 'Clientes', icon: faUsers },
    { id: 'settings', label: 'Configuración', icon: faCog },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-purple-900/30 flex flex-col h-screen select-none z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-purple-900/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
          <FontAwesomeIcon icon={faFileInvoice} className="text-xl" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-white">
            Facturalia
          </h1>
          <p className="text-xs text-purple-300/60 font-medium">IGIC Canarias & Verifactu</p>
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
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-500/20 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`text-base ${isActive ? 'text-pink-400' : 'text-slate-500'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Verifactu Compliance Status Widget */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldAlt} className="text-pink-400 text-sm" />
            <span className="text-xs font-semibold text-purple-200">Verifactu AEAT</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              verifactuEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
        </div>
        <p className="text-xs text-slate-400 mb-3">
          {verifactuEnabled
            ? 'Modo inmutable activo según Ley Antifraude 11/2021'
            : 'Desactivado. Puedes activarlo en Configuración.'}
        </p>
        <button
          onClick={onOpenGuide}
          className="w-full text-xs py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faShieldAlt} />
          Guía Verifactu AEAT
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 text-center border-t border-purple-900/20 text-[11px] text-slate-500">
        NeutralinoJS + SQLite WASM • v1.0.0
      </div>
    </aside>
  );
};
