import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShieldAlt, faLock, faCertificate, faQrcode, faCheckCircle, faExclamationTriangle } from '../utils/icons';

interface VerifactuGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerifactuGuideModal: React.FC<VerifactuGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-950/80">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-950/60 via-slate-900 to-pink-950/40 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-pink-400">
              <FontAwesomeIcon icon={faShieldAlt} className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Guía Oficial Verifactu AEAT & Ley Antifraude</h2>
              <p className="text-xs text-purple-300/70">Requisitos de Inmutabilidad, Certificados Digitales y Hash SHA-256</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed custom-scrollbar">
          {/* Intro callout */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex gap-4">
            <FontAwesomeIcon icon={faShieldAlt} className="text-pink-400 text-2xl mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-200 mb-1">¿Qué es el Reglamento Verifactu?</h3>
              <p className="text-xs text-slate-300">
                El Real Decreto 1007/2023 y la Ley 11/2021 obligan a todos los empresarios y profesionales que emitan facturas en España (incluyendo las Islas Canarias con el IGIC) a utilizar sistemas informáticos que garanticen la <strong>inalterabilidad</strong>, <strong>trazabilidad</strong> e <strong>inmutabilidad</strong> de los registros de facturación.
              </p>
            </div>
          </div>

          {/* Key pillars grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-pink-400 text-lg mb-2">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">1. Inmutabilidad</h4>
              <p className="text-xs text-slate-400">
                Una vez emitida una factura (estado Pendiente o Pagada), la ley prohíbe taxativamente su modificación o borrado directo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-purple-400 text-lg mb-2">
                <FontAwesomeIcon icon={faCertificate} />
              </div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">2. Firma Digital</h4>
              <p className="text-xs text-slate-400">
                Cada registro genera un XML firmado criptográficamente con certificado digital (.p12/.pfx) expedido por FNMT o Camerfirma.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-emerald-400 text-lg mb-2">
                <FontAwesomeIcon icon={faQrcode} />
              </div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">3. Código QR AEAT</h4>
              <p className="text-xs text-slate-400">
                El PDF impreso incluye un código QR único con URL de la Sede Electrónica de la Agencia Tributaria para su verificación instantánea.
              </p>
            </div>
          </div>

          {/* Rectification mechanism */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>¿Cómo corregir un error en una factura emitida?</span>
            </div>
            <p className="text-xs text-slate-300">
              Para anular o rectificar una factura ya emitida bajo Verifactu, <strong>NUNCA</strong> debe eliminarse ni alterarse la original. La única vía legal aceptada por la AEAT es emitir una <strong>Factura Rectificativa</strong> (o Factura de Abono), especificando el número de la factura original y asignando la serie correspondiente (ej. <code>REC-2026-001</code>).
            </p>
          </div>

          {/* Detailed requirements list */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-base">Requisitos técnicos integrados en Facturalia:</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Encadenamiento de Hash SHA-256:</strong> Cada factura calcula su huella digital incluyendo el hash de la factura anterior, formando una cadena inalterable idéntica a blockchain.</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Registro de Auditoría Local (AuditLog):</strong> Todas las operaciones de emisión, rectificación y firma se guardan en la tabla SQLite de auditoría local.</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Integración de Certificado en Cliente:</strong> Los archivos de certificado <code>.p12</code>/<code>.pfx</code> son leídos de forma segura con <code>Neutralino.filesystem</code> y procesados con <code>node-forge</code> sin enviar claves privadas a ningún servidor remoto.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-purple-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium text-sm shadow-lg shadow-purple-950/50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
