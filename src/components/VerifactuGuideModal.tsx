import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShieldAlt, faLock, faCertificate, faQrcode, faCheckCircle, faExclamationTriangle, faGlobe, faEnvelope } from '../utils/icons';

interface VerifactuGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const VerifactuGuideModal: React.FC<VerifactuGuideModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`border rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl ${
          isDark ? 'bg-[#1e1f20] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-slate-800'
              : 'bg-gradient-to-r from-[#0055ff] to-[#0033aa] text-white border-blue-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-500/20 text-cyan-400' : 'bg-white/20 text-white'
              }`}
            >
              <FontAwesomeIcon icon={faShieldAlt} className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Guía Verifactu AEAT</h2>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>
                Normativa RD 1007/2023, Ley Antifraude 11/2021 y Especificaciones Técnicas AEAT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed custom-scrollbar">
          {/* Intro callout */}
          <div
            className={`p-4 rounded-2xl border flex gap-4 ${
              isDark
                ? 'bg-blue-950/30 border-blue-500/30 text-slate-300'
                : 'bg-blue-50 border-blue-200 text-slate-800'
            }`}
          >
            <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500 text-2xl mt-1 shrink-0" />
            <div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                ¿Qué es el Reglamento Verifactu?
              </h3>
              <p className="text-xs">
                El Real Decreto 1007/2023 y la Ley 11/2021 obligan a todos los empresarios y profesionales que emitan facturas en España (incluyendo las Islas Canarias con el IGIC) a utilizar sistemas informáticos que garanticen la <strong>inalterabilidad</strong>, <strong>trazabilidad</strong> e <strong>inmutabilidad</strong> de los registros de facturación.
              </p>
            </div>
          </div>

          {/* Key pillars grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-blue-500 text-lg mb-2">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <h4 className={`font-bold text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Inmutabilidad
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Una vez emitida una factura (estado Pendiente o Pagada), la ley prohíbe taxativamente su modificación o borrado directo.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-cyan-500 text-lg mb-2">
                <FontAwesomeIcon icon={faCertificate} />
              </div>
              <h4 className={`font-bold text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                2. Firma Digital
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Cada registro genera un XML firmado criptográficamente con certificado digital (.p12/.pfx) expedido por FNMT o Camerfirma.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-emerald-500 text-lg mb-2">
                <FontAwesomeIcon icon={faQrcode} />
              </div>
              <h4 className={`font-bold text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3. Código QR AEAT
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                El PDF impreso incluye un código QR único con URL de la Sede Electrónica de la Agencia Tributaria para su verificación instantánea.
              </p>
            </div>
          </div>

          {/* Rectification mechanism */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-amber-950/30 border-amber-500/30 text-slate-300'
                : 'bg-amber-50 border-amber-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm mb-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>¿Cómo corregir un error en una factura emitida?</span>
            </div>
            <p className="text-xs">
              Para anular o rectificar una factura ya emitida bajo Verifactu, <strong>NUNCA</strong> debe eliminarse ni alterarse la original. La única vía legal aceptada por la AEAT es emitir una <strong>Factura Rectificativa</strong> (o Factura de Abono), especificando el número de la factura original y asignando la serie correspondiente (ej. <code>REC-2026-001</code>).
            </p>
          </div>

          {/* Detailed requirements list */}
          <div className="space-y-3">
            <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Requisitos técnicos integrados en Verifactu-Gratuito-Taratic:
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Encadenamiento de Hash SHA-256:</strong> Cada factura calcula su huella digital incluyendo el hash de la factura anterior, formando una cadena inalterable idéntica a blockchain.</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Registro de Auditoría Local (AuditLog):</strong> Todas las operaciones de emisión, rectificación y firma se guardan en la tabla SQLite de auditoría local.</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>Integración de Certificado en Cliente:</strong> Los archivos de certificado <code>.p12</code>/<code>.pfx</code> son leídos de forma segura con <code>Neutralino.filesystem</code> y procesados con <code>node-forge</code> sin enviar claves privadas a ningún servidor remoto.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-[#131314] border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 text-xs bg-white text-black border border-slate-300 px-3.5 py-2 rounded-2xl shadow-sm font-bold">
            <a
              href="https://taratic.com"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-black hover:text-slate-700 transition-colors flex items-center gap-1.5 hover:underline"
            >
              <img src="/taratic.webp" alt="Taratic Logo" className="w-4 h-4 rounded-full object-cover shrink-0" />
              <span>taratic.com</span>
            </a>
            <span className="text-slate-400">•</span>
            <a
              href="mailto:contacto@taratic.com"
              className="font-bold text-black hover:text-slate-700 transition-colors flex items-center gap-1.5 hover:underline"
            >
              <FontAwesomeIcon icon={faEnvelope} className="text-[10px] text-black" />
              <span>contacto@taratic.com</span>
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-950/50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
