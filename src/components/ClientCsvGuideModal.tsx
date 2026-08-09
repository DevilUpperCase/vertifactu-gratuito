import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faDownload,
  faUpload,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faFilePdf,
} from '../utils/icons';
import { Client } from '../types';
import {
  generateClientCsvTemplate,
  parseAndValidateClientCsv,
  ParsedCsvResult,
} from '../utils/csvClientHelper';

interface ClientCsvGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClients: (clients: Omit<Client, 'id'>[]) => Promise<void>;
  theme?: 'dark' | 'light';
}

export const ClientCsvGuideModal: React.FC<ClientCsvGuideModalProps> = ({
  isOpen,
  onClose,
  onImportClients,
  theme = 'dark',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedCsvResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = parseAndValidateClientCsv(content);
        setParsedResult(result);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult || parsedResult.validClients.length === 0) return;

    setIsProcessing(true);
    try {
      await onImportClients(parsedResult.validClients);
      setSelectedFile(null);
      setParsedResult(null);
      onClose();
    } catch (err) {
      console.error('Error al importar clientes:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#18191a] border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera del Modal */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <FontAwesomeIcon icon={faUpload} className="text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Importar y Guía de Formato CSV de Clientes</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Aprende la estructura de columnas requerida y sube tu listado de clientes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Cerrar modal"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Bloque 1: Especificación de Columnas */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-sm" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">
                  Estructura de Columnas y Requisitos
                </h3>
              </div>
              <button
                type="button"
                onClick={generateClientCsvTemplate}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                  isDark
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                }`}
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Descargar Plantilla CSV de Ejemplo</span>
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              El archivo CSV debe incluir una fila de cabecera en la primera línea. Se aceptan delimitadores por <strong>punto y coma (;)</strong> o <strong>coma (,)</strong>.
            </p>

            {/* Tabla de Especificaciones de Campos */}
            <div className="overflow-x-hidden w-full rounded-xl border border-zinc-800/40">
              <table className="w-full text-left text-xs whitespace-normal">
                <thead
                  className={`uppercase font-semibold ${
                    isDark ? 'bg-black/40 text-zinc-400' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-3">Columna</th>
                    <th className="py-2.5 px-3 text-center">Requisito</th>
                    <th className="py-2.5 px-3">Descripción y Alias Aceptados</th>
                    <th className="py-2.5 px-3">Ejemplo</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'}`}>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">nif</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        OBLIGATORIO
                      </span>
                    </td>
                    <td className="py-2.5 px-3 break-words">
                      NIF, CIF o documento fiscal. (Alias: <code>nif</code>, <code>cif</code>, <code>documento</code>)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">B35999999</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">nombre</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        OBLIGATORIO
                      </span>
                    </td>
                    <td className="py-2.5 px-3 break-words">
                      Nombre o Razón Social del cliente. (Alias: <code>nombre</code>, <code>name</code>, <code>razon_social</code>)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Servicios Canaria S.L.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">direccion</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        Opcional
                      </span>
                    </td>
                    <td className="py-2.5 px-3 break-words">
                      Dirección postal fiscal completa. (Alias: <code>direccion</code>, <code>address</code>, <code>direccion_fiscal</code>)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Av. Anaga 12, Santa Cruz</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">email</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        Opcional
                      </span>
                    </td>
                    <td className="py-2.5 px-3 break-words">
                      Correo electrónico de facturación. (Alias: <code>email</code>, <code>correo</code>, <code>mail</code>)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">info@empresa.es</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">retencion_irpf</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        Opcional
                      </span>
                    </td>
                    <td className="py-2.5 px-3 break-words">
                      Aplica retención IRPF del 15% por defecto. Valores válidos: <code>Sí</code>, <code>No</code>, <code>1</code>, <code>0</code>. (Alias: <code>retencion_irpf</code>, <code>irpf</code>)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">1 o Sí</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque 2: Zona de Subida y Análisis de CSV */}
          <div className="space-y-3">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              Subir Archivo CSV
            </h3>

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-8 border-2 border-dashed rounded-3xl text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                    : isDark
                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  id="csv-file-input"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    <FontAwesomeIcon icon={faUpload} className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Haz clic aquí para seleccionar o arrastra tu archivo CSV</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Soporta codificación UTF-8 y formatos delimitados por coma o punto y coma (.csv)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUpload} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{selectedFile.name}</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • Archivo cargado
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cambiar Archivo
                  </button>
                </div>

                {/* Resumen del Análisis del CSV */}
                {parsedResult && (
                  <div className="space-y-3">
                    {/* Alerta de Errores de Validación */}
                    {parsedResult.errors.length > 0 && (
                      <div
                        className={`p-4 rounded-xl border space-y-2 text-xs ${
                          isDark
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-rose-400">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <span>Se detectaron {parsedResult.errors.length} incidencias en el archivo:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {parsedResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resumen de Filas Válidas */}
                    {parsedResult.validClients.length > 0 && (
                      <div
                        className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                          isDark
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400" />
                          <span>
                            Se procesarán <strong>{parsedResult.validClients.length}</strong> clientes válidos de un total de {parsedResult.totalRows} filas.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div
          className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancelar
          </button>

          {parsedResult && parsedResult.validClients.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isProcessing
                  ? 'opacity-50 cursor-not-allowed bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>
                {isProcessing
                  ? 'Importando...'
                  : `Confirmar e Importar ${parsedResult.validClients.length} Clientes`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
