import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faShieldAlt,
  faCertificate,
  faSave,
  faCheckCircle,
  faUpload,
  faLock,
  faInfoCircle,
  faGlobe,
  faEnvelope,
} from '../utils/icons';
import { Settings } from '../types';
import { getSettings, saveSettings } from '../services/database';

interface SettingsPageProps {
  onOpenGuide: () => void;
  onSettingsUpdated: () => void;
  theme?: 'dark' | 'light';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenGuide,
  onSettingsUpdated,
  theme = 'dark',
}) => {
  const [settings, setSettingsData] = useState<Settings>({
    id: 1,
    issuer_nif: '',
    issuer_name: '',
    issuer_address: '',
    issuer_iban: '',
    default_igic_rate: 7.0,
    verifactu_enabled: false,
    cert_path: '',
    cert_password: '',
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const stts = await getSettings();
        if (stts) setSettingsData(stts);
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    }
    loadSettingsData();
  }, []);

  const handleSelectCertFile = async () => {
    if (window.Neutralino && window.Neutralino.os) {
      try {
        const entries = await window.Neutralino.os.showOpenDialog(
          'Seleccionar Certificado Digital (.p12 / .pfx)',
          {
            filters: [{ name: 'Certificados Digitales PKCS#12 (*.p12, *.pfx)', extensions: ['p12', 'pfx'] }],
          }
        );

        if (entries && entries.length > 0) {
          setSettingsData((prev) => ({ ...prev, cert_path: entries[0] }));
        }
      } catch (err) {
        console.error('Error en showOpenDialog de Neutralino:', err);
      }
    } else {
      const path = prompt('Introduce la ruta local del archivo .p12 / .pfx:', 'C:/certificados/empresa.p12');
      if (path) {
        setSettingsData((prev) => ({ ...prev, cert_path: path }));
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await saveSettings(settings);
      setSavedSuccess(true);
      onSettingsUpdated();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar la configuración:', err);
      alert('Error guardando los datos de configuración.');
    } finally {
      setSaving(false);
    }
  };

  const cardBgClass = isDark
    ? 'bg-[#1e1f20] border-zinc-800 shadow-xl text-zinc-100'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className={`border rounded-3xl p-6 backdrop-blur-xl flex items-center justify-between shadow-xl ${cardBgClass}`}>
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
              isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <FontAwesomeIcon icon={faCog} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Configuración de Facturación y Fiscalidad
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Datos del emisor, impuestos por defecto y cumplimiento Verifactu AEAT
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Configuración Guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveForm} className="space-y-8">
        {/* Section 1: Issuer Details */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6 ${cardBgClass}`}>
          <h3
            className={`text-base font-bold uppercase tracking-wider border-b pb-3 ${
              isDark ? 'text-blue-300 border-slate-800' : 'text-blue-700 border-slate-200'
            }`}
          >
            1. Datos Fiscales del Emisor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                NIF / CIF del Emisor *
              </label>
              <input
                type="text"
                required
                placeholder="ej. B35000000"
                value={settings.issuer_nif}
                onChange={(e) => setSettingsData({ ...settings, issuer_nif: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Empresa Ejemplo S.L."
                value={settings.issuer_name}
                onChange={(e) => setSettingsData({ ...settings, issuer_name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Dirección Fiscal Completa
              </label>
              <input
                type="text"
                placeholder="ej. Calle Gran Vía 45, Madrid"
                value={settings.issuer_address}
                onChange={(e) => setSettingsData({ ...settings, issuer_address: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Cuenta Bancaria (IBAN de Pago)
              </label>
              <input
                type="text"
                placeholder="ej. ES91 2100 0418 4502 0005 1234"
                value={settings.issuer_iban}
                onChange={(e) => setSettingsData({ ...settings, issuer_iban: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                Tipo IGIC / IVA General por Defecto
              </label>
              <select
                value={settings.default_igic_rate}
                onChange={(e) =>
                  setSettingsData({ ...settings, default_igic_rate: parseFloat(e.target.value) })
                }
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="0">0% IGIC/IVA Exento</option>
                <option value="3">3% IGIC Reducido</option>
                <option value="7">7% IGIC General Canarias</option>
                <option value="9.5">9.5% IGIC Incrementado</option>
                <option value="15">15% IGIC Especial</option>
                <option value="21">21% IVA General Península</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Verifactu Toggle & Certificate Options */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6 ${cardBgClass}`}>
          <div
            className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                }`}
              >
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Cumplimiento Verifactu AEAT
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Activación de inmutabilidad, huellas hash SHA-256 y firma digital PKCS#12
                </p>
              </div>
            </div>

            {/* Verifactu Switch Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {settings.verifactu_enabled ? 'Modo Inmutable (ACTIVADO)' : 'Modo Estándar (DESACTIVADO)'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSettingsData({
                    ...settings,
                    verifactu_enabled: !settings.verifactu_enabled,
                  })
                }
                className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  settings.verifactu_enabled
                    ? 'bg-gradient-to-r from-[#0055ff] to-blue-600 shadow-lg shadow-blue-500/30'
                    : isDark ? 'bg-slate-800' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    settings.verifactu_enabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Integrated Guía Verifactu Markdown Box */}
          {settings.verifactu_enabled && (
            <div
              className={`p-6 rounded-2xl border space-y-4 animate-fade-in ${
                isDark
                  ? 'bg-blue-950/30 border-blue-500/30 text-white'
                  : 'bg-blue-50 border-blue-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-500">
                  <FontAwesomeIcon icon={faLock} />
                  <span>Modo Verifactu Activo - Requisitos AEAT</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>Ver Guía Completa Verifactu</span>
                </button>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Al activar el modo Verifactu, todas las facturas emitidas quedan <strong>bloqueadas contra alteración o eliminación directa</strong> según la Ley 11/2021. Cualquier corrección deberá realizarse mediante Factura Rectificativa.
              </p>
            </div>
          )}

          {/* Digital Certificate (.p12 / .pfx) Selector */}
          <div
            className={`p-4 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h4
              className={`font-semibold text-xs uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}
            >
              <FontAwesomeIcon icon={faCertificate} className="text-blue-500" />
              <span>Certificado Digital PKCS#12 (.p12 / .pfx)</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                readOnly
                placeholder="No se ha seleccionado ningún archivo de certificado"
                value={settings.cert_path || ''}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={handleSelectCertFile}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <FontAwesomeIcon icon={faUpload} />
                <span>Seleccionar .p12/.pfx</span>
              </button>
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Contraseña del Certificado (Guardada Localmente)
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={settings.cert_password || ''}
                onChange={(e) => setSettingsData({ ...settings, cert_password: e.target.value })}
                className={`w-full md:w-80 px-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Soporte y Referencia Taratic */}
        <div
          className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-blue-500/30 text-white'
              : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 border-blue-500 text-white shadow-xl'
          }`}
        >
          <div>
            <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faGlobe} />
              <span>Desarrollado y Mantenido por Taratic</span>
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>
              Verifactu Gratuito es un software gratuito, completamente local y de código abierto para pymes y autónomos de España.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <a
              href="https://taratic.com"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/40'
              }`}
            >
              <img src="/taratic.webp" alt="Taratic" className="w-4 h-4 rounded-full object-cover shrink-0" />
              <span>taratic.com</span>
            </a>
            <a
              href="mailto:contacto@taratic.com"
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/40'
              }`}
            >
              <FontAwesomeIcon icon={faEnvelope} />
              <span>contacto@taratic.com</span>
            </a>
          </div>
        </div>

        {/* Form Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-950/50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
