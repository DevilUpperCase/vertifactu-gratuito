import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faShieldAlt, faPlus } from '../utils/icons';

interface HeaderProps {
  title: string;
  verifactuEnabled: boolean;
  onNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, verifactuEnabled, onNewInvoice }) => {
  return (
    <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-purple-900/20 px-8 flex items-center justify-between z-10">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-400">España (Verifactu & IGIC/IVA) • Software Gratuito y 100% Local</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400" />
          <span>SQLite WASM Activo</span>
        </div>

        {/* Verifactu badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
            verifactuEnabled
              ? 'bg-purple-950/60 text-pink-300 border-pink-500/40 shadow-sm shadow-pink-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <FontAwesomeIcon icon={faShieldAlt} className={verifactuEnabled ? 'text-pink-400' : 'text-slate-500'} />
          <span>{verifactuEnabled ? 'Verifactu ON' : 'Verifactu OFF'}</span>
        </div>

        {/* New Invoice Button */}
        <button
          onClick={onNewInvoice}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all hover:scale-105 active:scale-95"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Factura</span>
        </button>
      </div>
    </header>
  );
};
