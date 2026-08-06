import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faCopy,
  faUndo,
  faFilePdf,
  faDownload,
  faShieldAlt,
  faQrcode,
  faTimes,
  faLock,
} from '../utils/icons';
import { Client, Invoice, Settings } from '../types';
import {
  createRectificationInvoice,
  deleteInvoice,
  duplicateInvoiceAsTemplate,
  getClients,
  getInvoiceById,
  getInvoices,
  getSettings,
} from '../services/database';
import { formatCurrency } from '../utils/currency';
import { generateInvoicePdf } from '../services/pdfGenerator';
import { processVerifactuInvoice, VerifactuResult } from '../services/verifactu';

interface InvoicesPageProps {
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  refreshTrigger?: number;
  onInvoiceSaved?: () => void;
  theme?: 'dark' | 'light';
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  onNewInvoice,
  onEditInvoice,
  refreshTrigger,
  onInvoiceSaved,
  theme = 'dark',
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // PDF Preview & Options Modal State
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [showExcludingIgicColumn, setShowExcludingIgicColumn] = useState(false);
  const [verifactuData, setVerifactuData] = useState<VerifactuResult | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Quick Template Modal State
  const [templateInvoiceId, setTemplateInvoiceId] = useState<number | null>(null);
  const [templateClientId, setTemplateClientId] = useState<number | ''>('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // XML Verifactu Inspection Modal
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  const loadInvoicesData = async () => {
    try {
      const invs = await getInvoices();
      const cls = await getClients();
      const stts = await getSettings();
      setInvoices(invs);
      setClients(cls);
      setSettings(stts);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    }
  };

  useEffect(() => {
    loadInvoicesData();
  }, [refreshTrigger]);

  // Abrir vista previa y generación de PDF
  const handleOpenPdfModal = async (invoiceId: number) => {
    const fullInvoice = await getInvoiceById(invoiceId);
    if (!fullInvoice || !settings) return;

    setSelectedInvoiceForPdf(fullInvoice);

    // Si Verifactu está activo, procesar XML y código QR oficial
    if (settings.verifactu_enabled) {
      try {
        let certBinary: ArrayBuffer | undefined = undefined;
        if (settings.cert_path && window.Neutralino?.filesystem) {
          try {
            certBinary = await window.Neutralino.filesystem.readBinaryFile(settings.cert_path);
          } catch (e) {
            console.warn('Certificado no encontrado en la ruta especificada:', e);
          }
        }
        const vResult = await processVerifactuInvoice(fullInvoice, settings, certBinary);
        setVerifactuData(vResult);
      } catch (err) {
        console.error('Error procesando Verifactu:', err);
      }
    } else {
      setVerifactuData(null);
    }

    setIsPdfModalOpen(true);
  };

  // Descarga del archivo PDF
  const handleDownloadPdf = () => {
    if (!selectedInvoiceForPdf || !settings) return;
    const pdfDoc = generateInvoicePdf(selectedInvoiceForPdf, settings, {
      showExcludingIgicColumn,
      qrCodeDataUrl: verifactuData?.qrCodeDataUrl,
      xmlHash: verifactuData?.xmlHash,
    });
    pdfDoc.save(`Factura_${selectedInvoiceForPdf.invoice_number}.pdf`);
  };

  // Duplicar Factura como Plantilla
  const handleConfirmDuplicateTemplate = async () => {
    if (!templateInvoiceId || !templateClientId) return;
    try {
      await duplicateInvoiceAsTemplate(templateInvoiceId, Number(templateClientId));
      setIsTemplateModalOpen(false);
      setTemplateInvoiceId(null);
      await loadInvoicesData();
      onInvoiceSaved?.();
    } catch (err) {
      console.error('Error duplicando factura:', err);
      alert('Error creando la factura desde plantilla');
    }
  };

  // Emitir Factura Rectificativa
  const handleCreateRectification = async (invoiceId: number, num: string) => {
    if (
      confirm(
        `¿Deseas emitir una Factura Rectificativa de Abono para la factura ${num}? Se invertirá el importe y se mantendrá el registro inalterable.`
      )
    ) {
      try {
        await createRectificationInvoice(invoiceId);
        await loadInvoicesData();
        onInvoiceSaved?.();
      } catch (err) {
        console.error('Error al rectificar factura:', err);
        alert('No se pudo generar la factura rectificativa');
      }
    }
  };

  // Eliminar factura
  const handleDeleteInvoice = async (invoiceId: number) => {
    const res = await deleteInvoice(invoiceId);
    if (!res.success) {
      alert(res.message);
    } else {
      await loadInvoicesData();
      onInvoiceSaved?.();
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cardBgClass = isDark
    ? 'bg-[#1e1f20] border-zinc-800 shadow-xl text-zinc-100'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['ALL', 'Borrador', 'Pendiente', 'Pagada', 'Anulada'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-[#0055ff] to-blue-600 text-white shadow-md shadow-blue-950/50'
                  : isDark
                  ? 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 shadow-sm'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st}
            </button>
          ))}
        </div>

        {/* New Invoice Button */}
        <button
          onClick={onNewInvoice}
          className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 shrink-0 transition-transform hover:scale-105"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Main Invoices Table Card */}
      <div className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Listado de Facturas
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Total listadas: {filteredInvoices.length}
              </p>
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron facturas con el criterio seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={`text-xs uppercase border-b ${
                  isDark
                    ? 'text-slate-400 bg-black/40 border-slate-800'
                    : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Número</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Emisión</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Base Imponible</th>
                  <th className="py-3.5 px-4 text-right">Total Factura</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}
              >
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className={`py-3.5 px-4 font-mono font-bold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      {inv.invoice_number}
                      {inv.is_rectification && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            isDark
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          Rectificativa
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {inv.client_name || 'N/A'}
                    </td>
                    <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {inv.issue_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          inv.status === 'Pagada'
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : inv.status === 'Pendiente'
                            ? isDark
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                            : inv.status === 'Anulada'
                            ? isDark
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formatCurrency(inv.total_base)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ver / PDF */}
                        <button
                          onClick={() => handleOpenPdfModal(inv.id!)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                          title="Ver / PDF con QR Verifactu"
                        >
                          <FontAwesomeIcon icon={faFilePdf} />
                        </button>

                        {/* Editar (si borrador o sin bloqueo Verifactu) */}
                        <button
                          onClick={async () => {
                            const full = await getInvoiceById(inv.id!);
                            if (full) onEditInvoice(full);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                          title="Editar factura"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>

                        {/* Duplicar como Plantilla */}
                        <button
                          onClick={() => {
                            setTemplateInvoiceId(inv.id!);
                            setIsTemplateModalOpen(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300'
                              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                          }`}
                          title="Usar como plantilla para otro cliente"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>

                        {/* Generar Rectificativa (Abono) */}
                        {!inv.is_rectification && inv.status !== 'Borrador' && (
                          <button
                            onClick={() => handleCreateRectification(inv.id!, inv.invoice_number)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            }`}
                            title="Generar Factura Rectificativa / Abono"
                          >
                            <FontAwesomeIcon icon={faUndo} />
                          </button>
                        )}

                        {/* Eliminar (si borrador) */}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id!)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                          title="Eliminar factura"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF View & Customization Modal */}
      {isPdfModalOpen && selectedInvoiceForPdf && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
              isDark ? 'bg-[#1e1f20] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'bg-[#131314] border-zinc-800 text-white'
                  : 'bg-gradient-to-r from-[#0055ff] to-blue-700 text-white border-blue-600'
              }`}
            >
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilePdf} className={isDark ? 'text-blue-400' : 'text-blue-100'} />
                  <span>Documento Factura {selectedInvoiceForPdf.invoice_number}</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-blue-100'}`}>
                  Previsualización de formato oficial de facturación
                </p>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {/* Toggle "Mostrar columna Sin IGIC" */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Opciones de Formato PDF
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Alterna el desglose explícito de la base imponible sin impuesto por línea
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    Mostrar columna Sin IGIC
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExcludingIgicColumn(!showExcludingIgicColumn)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      showExcludingIgicColumn ? 'bg-[#0055ff]' : 'bg-slate-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        showExcludingIgicColumn ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Invoice Summary Details Box */}
              <div
                className={`p-6 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Emisor:</span>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{settings?.issuer_name}</p>
                    <p className={isDark ? 'text-zinc-400' : 'text-slate-600'}>NIF: {settings?.issuer_nif}</p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Cliente:</span>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedInvoiceForPdf.client_name}</p>
                    <p className={isDark ? 'text-zinc-400' : 'text-slate-600'}>NIF: {selectedInvoiceForPdf.client_nif}</p>
                  </div>
                </div>

                <div
                  className={`pt-4 border-t flex justify-between items-center text-sm font-bold ${
                    isDark ? 'border-zinc-800 text-white' : 'border-slate-200 text-slate-900'
                  }`}
                >
                  <span>Importe Total Factura:</span>
                  <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-700 font-extrabold'}`}>
                    {formatCurrency(selectedInvoiceForPdf.grand_total)}
                  </span>
                </div>
              </div>

              {/* Verifactu Compliance Preview Badge & QR */}
              {verifactuData && (
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <img
                    src={verifactuData.qrCodeDataUrl}
                    alt="Verifactu QR Code"
                    className="w-20 h-20 rounded-xl bg-white p-1 border border-slate-300 shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                      <FontAwesomeIcon icon={faShieldAlt} />
                      <span>Verifactu AEAT Inmutable</span>
                    </div>
                    <p className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                      Código QR oficial generado con la URL de la Sede Electrónica de la Agencia Tributaria.
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 truncate max-w-sm">
                      Hash SHA-256: {verifactuData.xmlHash}
                    </p>
                    <button
                      onClick={() => setIsXmlModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Inspeccionar Payload XML y Firma Digital →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t flex justify-end gap-3 ${
                isDark ? 'bg-[#131314] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                Cerrar
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-950/50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Template Selection Modal */}
      {isTemplateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-[#1e1f20] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FontAwesomeIcon icon={faCopy} className="text-blue-500" />
              <span>Duplicar Factura como Plantilla</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Selecciona el cliente de destino. Se clonarán todas las líneas y conceptos asignando un nuevo número de factura en borrador.
            </p>

            <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Cliente Destino *
              </label>
              <select
                value={templateClientId}
                onChange={(e) => setTemplateClientId(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
                }`}
              >
                <option value="">-- Seleccionar cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.nif})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicateTemplate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-950/50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCopy} />
                <span>Duplicar Factura</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* XML Verifactu Inspector Modal */}
      {isXmlModalOpen && verifactuData && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#1e1f20] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'bg-[#131314] border-zinc-800 text-white'
                  : 'bg-gradient-to-r from-[#0055ff] to-blue-700 text-white border-blue-600'
              }`}
            >
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>Payload XML Verifactu & Cadena Hash</span>
              </h3>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono custom-scrollbar">
              <div>
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Huella Hash SHA-256:</span>
                <p className={`p-2.5 rounded-xl border mt-1 select-all ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-blue-300' : 'bg-slate-100 border-slate-300 text-blue-800'
                }`}>
                  {verifactuData.xmlHash}
                </p>
              </div>

              <div>
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>URL Sede Electrónica AEAT:</span>
                <p className={`p-2.5 rounded-xl border mt-1 break-all select-all ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}>
                  {verifactuData.qrUrl}
                </p>
              </div>

              <div>
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Estructura XML Verifactu:</span>
                <pre className={`p-3 rounded-xl border mt-1 overflow-x-auto text-[11px] leading-relaxed ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}>
                  {verifactuData.xmlContent}
                </pre>
              </div>
            </div>

            <div
              className={`p-4 border-t flex justify-end ${
                isDark ? 'bg-[#131314] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
