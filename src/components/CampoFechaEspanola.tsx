import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '../utils/icons';
import {
  aplicarMascaraFechaEspanola,
  esFechaEspanolaValida,
  formatearFechaEspanola,
  parsearFechaEspanolaAIso,
} from '../utils/fechas';

interface CampoFechaEspanolaProps {
  label: string;
  value: string; // Puede ser ISO (YYYY-MM-DD) o DD/MM/YYYY
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  required?: boolean;
  theme?: 'dark' | 'light';
  helperText?: string;
  className?: string;
}

export const CampoFechaEspanola: React.FC<CampoFechaEspanolaProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  theme = 'dark',
  helperText,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Valor textual visible en formato español DD/MM/YYYY
  const [textoVisible, setTextoVisible] = useState(() => {
    return value ? formatearFechaEspanola(value) : '';
  });

  // Sincronizar texto visible si el valor externo cambia
  useEffect(() => {
    if (value) {
      const formatted = formatearFechaEspanola(value);
      if (formatted !== textoVisible && formatted !== '-') {
        setTextoVisible(formatted);
      }
    } else {
      setTextoVisible('');
    }
  }, [value]);

  // Manejador cuando el usuario escribe en el campo de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const conMascara = aplicarMascaraFechaEspanola(rawVal);
    setTextoVisible(conMascara);

    // Si tiene la longitud completa (10 caracteres: DD/MM/YYYY), validar y emitir ISO
    if (conMascara.length === 10) {
      if (esFechaEspanolaValida(conMascara)) {
        const iso = parsearFechaEspanolaAIso(conMascara);
        onChange(iso);
      }
    } else if (conMascara.length === 0) {
      onChange('');
    }
  };

  // Manejador cuando el usuario pierde el foco del campo
  const handleBlur = () => {
    if (textoVisible.length > 0 && textoVisible.length < 10) {
      // Si el usuario escribió por ejemplo 8 dígitos continuos (13092026) o incompleto
      const conMascara = aplicarMascaraFechaEspanola(textoVisible);
      if (conMascara.length === 10 && esFechaEspanolaValida(conMascara)) {
        setTextoVisible(conMascara);
        onChange(parsearFechaEspanolaAIso(conMascara));
      } else {
        // Restaurar al último valor válido
        setTextoVisible(value ? formatearFechaEspanola(value) : '');
      }
    }
  };

  // Abrir el selector de calendario nativo al pulsar el icono
  const handleAbrirCalendario = () => {
    if (disabled) return;
    if (hiddenDateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          hiddenDateInputRef.current.showPicker();
          return;
        } catch (e) {
          // Ignorar y caer en click
        }
      }
      hiddenDateInputRef.current.click();
    }
  };

  // Manejador cuando se selecciona fecha desde el selector de calendario
  const handleSelectorCalendarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      const espanola = formatearFechaEspanola(isoVal);
      setTextoVisible(espanola);
      onChange(isoVal);
    }
  };

  const isoParaInputOculto = parsearFechaEspanolaAIso(value || textoVisible);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          className={`block text-xs font-bold uppercase ${
            isDark ? 'text-blue-300' : 'text-blue-700'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
          }`}
        >
          DD/MM/YYYY
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          placeholder="DD/MM/YYYY (ej. 13/09/2026)"
          value={textoVisible}
          onChange={handleInputChange}
          onBlur={handleBlur}
          maxLength={10}
          className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60 font-mono ${
            isDark
              ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
              : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
          }`}
        />

        {/* Botón de selector de calendario */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleAbrirCalendario}
          className={`absolute right-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Abrir calendario para seleccionar fecha"
        >
          <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-blue-500" />
        </button>

        {/* Input tipo date nativo invisible para invocar el picker del sistema */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          tabIndex={-1}
          disabled={disabled}
          value={isoParaInputOculto}
          onChange={handleSelectorCalendarioChange}
          className="sr-only absolute opacity-0 pointer-events-none"
        />
      </div>

      {helperText ? (
        <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {helperText}
        </p>
      ) : (
        <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          Formato español: <strong className={isDark ? 'text-zinc-300' : 'text-slate-700'}>DD/MM/YYYY</strong>
        </p>
      )}
    </div>
  );
};
