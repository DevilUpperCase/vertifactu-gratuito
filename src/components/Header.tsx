import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faShieldAlt, faPlus, faSun, faMoon } from '../utils/icons';

interface HeaderProps {
  title: string;
  verifactuEnabled: boolean;
  onNewInvoice: () => void;
  onOpenGuide?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  verifactuEnabled,
  onNewInvoice,
  onOpenGuide,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`h-20 backdrop-blur-md border-b px-8 flex items-center justify-between transition-colors duration-200 ${
        isDark
          ? 'bg-[#131314]/90 border-zinc-800 text-zinc-100'
          : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h1>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          España (Verifactu & IGIC/IVA) • Software Gratuito y 100% Local
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Status indicator */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isDark
              ? 'bg-[#1e1f20] border-zinc-800 text-zinc-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500" />
          <span>SQLite WASM Activo</span>
        </div>

        {/* Verifactu badge / Guide Trigger */}
        <button
          type="button"
          onClick={onOpenGuide}
          title="Abrir Guía Verifactu AEAT"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            verifactuEnabled
              ? isDark
                ? 'bg-blue-950/70 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-900/40 hover:bg-blue-900/80'
                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
              : isDark
              ? 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
          }`}
        >
          <FontAwesomeIcon
            icon={faShieldAlt}
            className={verifactuEnabled ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-slate-400'}
          />
          <span>{verifactuEnabled ? 'Verifactu ON' : 'Verifactu OFF'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all duration-200 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-sm shrink-0" />
          <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>

        {/* New Invoice Button */}
        <button
          onClick={onNewInvoice}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-950/50 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Factura</span>
        </button>
      </div>
    </header>
  );
};
