import React, { useEffect, useState } from 'react';
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
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onNewInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

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
  }, []);

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
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 text-sm"
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
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-950/50'
                  : 'bg-slate-900/80 text-slate-400 border border-purple-900/30 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st}
            </button>
          ))}
        </div>

        {/* New Invoice Button */}
        <button
          onClick={onNewInvoice}
          className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Main Invoices Table Card */}
      <div className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Listado de Facturas</h2>
              <p className="text-xs text-slate-400">Total listadas: {filteredInvoices.length}</p>
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron facturas con el criterio seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-purple-900/30">
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
              <tbody className="divide-y divide-purple-900/20">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-200">
                      {inv.invoice_number}
                      {inv.is_rectification && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Rectificativa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{inv.client_name || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{inv.issue_date}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'Pagada'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.status === 'Pendiente'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : inv.status === 'Anulada'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">{formatCurrency(inv.total_base)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ver / PDF */}
                        <button
                          onClick={() => handleOpenPdfModal(inv.id!)}
                          className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors"
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
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-colors"
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
                          className="p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 transition-colors"
                          title="Usar como plantilla para otro cliente"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>

                        {/* Generar Rectificativa (Abono) */}
                        {!inv.is_rectification && inv.status !== 'Borrador' && (
                          <button
                            onClick={() => handleCreateRectification(inv.id!, inv.invoice_number)}
                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
                            title="Generar Factura Rectificativa / Abono"
                          >
                            <FontAwesomeIcon icon={faUndo} />
                          </button>
                        )}

                        {/* Eliminar (si borrador) */}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id!)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
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

      {/* PDF View & Customization Modal (Crucial Requirement: Toggle "Mostrar columna Sin IGIC") */}
      {isPdfModalOpen && selectedInvoiceForPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-950/60 to-pink-950/40 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilePdf} className="text-pink-400" />
                  <span>Documento Factura {selectedInvoiceForPdf.invoice_number}</span>
                </h3>
                <p className="text-xs text-purple-300/70">
                  Previsualización de formato oficial de facturación
                </p>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* CRUCIAL UI REQUIREMENT: Toggle "Mostrar columna Sin IGIC" */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">Opciones de Formato PDF</h4>
                  <p className="text-xs text-slate-400">
                    Alterna el desglose explícito de la base imponible sin impuesto por línea
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-purple-300">
                    Mostrar columna Sin IGIC
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExcludingIgicColumn(!showExcludingIgicColumn)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      showExcludingIgicColumn ? 'bg-gradient-to-r from-purple-600 to-pink-500' : 'bg-slate-800'
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
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-purple-900/30 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Emisor:</span>
                    <p className="font-semibold text-white">{settings?.issuer_name}</p>
                    <p className="text-slate-400">NIF: {settings?.issuer_nif}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cliente:</span>
                    <p className="font-semibold text-white">{selectedInvoiceForPdf.client_name}</p>
                    <p className="text-slate-400">NIF: {selectedInvoiceForPdf.client_nif}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-900/30 flex justify-between items-center text-sm font-bold text-white">
                  <span>Importe Total Factura:</span>
                  <span className="text-lg text-pink-300">
                    {formatCurrency(selectedInvoiceForPdf.grand_total)}
                  </span>
                </div>
              </div>

              {/* Verifactu Compliance Preview Badge & QR */}
              {verifactuData && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center gap-4">
                  <img
                    src={verifactuData.qrCodeDataUrl}
                    alt="Verifactu QR Code"
                    className="w-20 h-20 rounded-xl bg-white p-1 border border-purple-500/40 shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-pink-400 font-semibold">
                      <FontAwesomeIcon icon={faShieldAlt} />
                      <span>Verifactu AEAT Inmutable</span>
                    </div>
                    <p className="text-slate-300">
                      Código QR oficial generado con la URL de la Sede Electrónica de la Agencia Tributaria.
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 truncate max-w-sm">
                      Hash SHA-256: {verifactuData.xmlHash}
                    </p>
                    <button
                      onClick={() => setIsXmlModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-pink-300 underline font-medium"
                    >
                      Inspeccionar Payload XML y Firma Digital →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-900 border-t border-purple-500/20 flex justify-end gap-3">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-950/50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faCopy} className="text-pink-400" />
              <span>Duplicar Factura como Plantilla</span>
            </h3>
            <p className="text-xs text-slate-300">
              Selecciona el cliente de destino. Se clonarán todas las líneas y conceptos asignando un nuevo número de factura en borrador.
            </p>

            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Cliente Destino *
              </label>
              <select
                value={templateClientId}
                onChange={(e) => setTemplateClientId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50"
              >
                <option value="">-- Seleccionar cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.nif})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-purple-900/20">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                disabled={!templateClientId}
                onClick={handleConfirmDuplicateTemplate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-sm font-semibold disabled:opacity-50"
              >
                Generar Nueva Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XML Verifactu Inspection Modal */}
      {isXmlModalOpen && verifactuData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="text-lg font-bold text-white">Estructura XML Verifactu AEAT</h3>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/30 overflow-x-auto max-h-80">
              <pre className="text-xs text-pink-300 font-mono leading-relaxed">
                {verifactuData.xmlContent}
              </pre>
            </div>

            {verifactuData.signature && (
              <div>
                <span className="text-xs font-semibold text-emerald-400">
                  Firma Digital XMLDSig (RSA-SHA256 Base64):
                </span>
                <p className="font-mono text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg truncate mt-1">
                  {verifactuData.signature}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
