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
} from '../utils/icons';
import { Settings } from '../types';
import { getSettings, saveSettings } from '../services/database';

interface SettingsPageProps {
  onOpenGuide: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenGuide, onSettingsUpdated }) => {
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

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const stts = await getSettings();
        setSettingsData(stts);
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
          setSettingsData({ ...settings, cert_path: entries[0] });
        }
      } catch (err) {
        console.error('Error en showOpenDialog de Neutralino:', err);
      }
    } else {
      // Fallback para navegador web
      const path = prompt('Introduce la ruta local del archivo .p12 / .pfx:', 'C:/certificados/empresa.p12');
      if (path) {
        setSettingsData({ ...settings, cert_path: path });
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(settings);
      setSavedSuccess(true);
      onSettingsUpdated();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-950/50">
            <FontAwesomeIcon icon={faCog} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configuración de Facturación y Fiscalidad</h2>
            <p className="text-xs text-slate-400">
              Datos del emisor, tipos de IGIC por defecto y cumplimiento Verifactu AEAT
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Configuración Guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveForm} className="space-y-8">
        {/* Section 1: Issuer Details */}
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white uppercase tracking-wider text-purple-300 border-b border-purple-900/30 pb-3">
            1. Datos Fiscales del Emisor (Canarias)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                NIF / CIF del Emisor *
              </label>
              <input
                type="text"
                required
                placeholder="ej. B35000000"
                value={settings.issuer_nif}
                onChange={(e) => setSettingsData({ ...settings, issuer_nif: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Empresa Demo Canarias S.L."
                value={settings.issuer_name}
                onChange={(e) => setSettingsData({ ...settings, issuer_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Dirección Fiscal Completa
              </label>
              <input
                type="text"
                placeholder="ej. Calle Triana 45, Las Palmas de Gran Canaria"
                value={settings.issuer_address}
                onChange={(e) => setSettingsData({ ...settings, issuer_address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Cuenta Bancaria (IBAN de Pago)
              </label>
              <input
                type="text"
                placeholder="ej. ES91 2100 0418 4502 0005 1234"
                value={settings.issuer_iban}
                onChange={(e) => setSettingsData({ ...settings, issuer_iban: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Tipo IGIC General por Defecto
              </label>
              <select
                value={settings.default_igic_rate}
                onChange={(e) =>
                  setSettingsData({ ...settings, default_igic_rate: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50"
              >
                <option value="0">0% IGIC Exento</option>
                <option value="3">3% IGIC Reducido</option>
                <option value="7">7% IGIC General Canarias (Estándar)</option>
                <option value="9.5">9.5% IGIC Incrementado</option>
                <option value="15">15% IGIC Especial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Verifactu Toggle & Certificate Options */}
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2. Cumplimiento Verifactu AEAT</h3>
                <p className="text-xs text-slate-400">
                  Activación de inmutabilidad, huellas hash SHA-256 y firma digital PKCS#12
                </p>
              </div>
            </div>

            {/* Verifactu Switch Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-purple-200">
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
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-pink-500/30'
                    : 'bg-slate-800'
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
            <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
                  <FontAwesomeIcon icon={faLock} />
                  <span>Modo Verifactu Activo - Requisitos AEAT</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-xs text-purple-300 hover:text-pink-300 font-medium underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>Ver Guía Completa Verifactu</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al activar el modo Verifactu, todas las facturas emitidas quedan <strong>bloqueadas contra alteración o eliminación directa</strong> según la Ley 11/2021. Cualquier corrección deberá realizarse mediante Factura Rectificativa.
              </p>
            </div>
          )}

          {/* Digital Certificate (.p12 / .pfx) Selector */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-900/30 space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faCertificate} className="text-pink-400" />
              <span>Certificado Digital PKCS#12 (.p12 / .pfx)</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                readOnly
                placeholder="No se ha seleccionado ningún archivo de certificado"
                value={settings.cert_path || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white placeholder-slate-600 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSelectCertFile}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold shrink-0 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faUpload} />
                <span>Seleccionar .p12/.pfx</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Contraseña del Certificado (Guardada Localmente)
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={settings.cert_password || ''}
                onChange={(e) => setSettingsData({ ...settings, cert_password: e.target.value })}
                className="w-full md:w-80 px-4 py-2 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>
        </div>

        {/* Form Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-purple-950/50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
