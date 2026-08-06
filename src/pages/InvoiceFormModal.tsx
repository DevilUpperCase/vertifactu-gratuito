import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faPlus,
  faTrash,
  faSave,
  faCheckCircle,
  faLock,
  faExclamationTriangle,
} from '../utils/icons';
import { Client, Invoice, InvoiceLine, Settings } from '../types';
import { getClients, getSettings, generateNextInvoiceNumber, saveInvoice } from '../services/database';
import { calculateInvoiceSummary, calculateLineTotals, centsToEuroNumber, formatCurrency, parseEuroToCents } from '../utils/currency';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: Invoice | null;
  onInvoiceSaved: () => void;
  theme?: 'dark' | 'light';
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  initialInvoice,
  onInvoiceSaved,
  theme = 'dark',
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const isDark = theme === 'dark';

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Invoice['status']>('Borrador');
  const [irpfPercent, setIrpfPercent] = useState<number>(0);

  const [lines, setLines] = useState<
    Array<{
      concept: string;
      quantity: number;
      price_unit: number;
      igic_rate: number;
    }>
  >([
    { concept: '', quantity: 1, price_unit: 0, igic_rate: 7 },
  ]);

  useEffect(() => {
    async function initForm() {
      const cls = await getClients();
      const stts = await getSettings();
      setClients(cls);
      setSettings(stts);

      if (initialInvoice) {
        setInvoiceNumber(initialInvoice.invoice_number);
        setSelectedClientId(initialInvoice.client_id);
        setIssueDate(initialInvoice.issue_date);
        setDueDate(initialInvoice.due_date || '');
        setStatus(initialInvoice.status);
        const hasIrpf = initialInvoice.total_irpf > 0;
        setIrpfPercent(hasIrpf ? 15 : 0);

        if (initialInvoice.lines && initialInvoice.lines.length > 0) {
          setLines(
            initialInvoice.lines.map((l) => ({
              concept: l.concept,
              quantity: l.quantity,
              price_unit: centsToEuroNumber(l.unit_price),
              igic_rate: l.igic_rate,
            }))
          );
        }
      } else {
        const defaultIgic = stts ? stts.default_igic_rate : 7;
        const defaultClient = cls.length > 0 ? cls[0] : null;
        const defaultClientId = defaultClient ? defaultClient.id : '';
        const hasClientIrpf = defaultClient ? defaultClient.default_retention_irpf : false;

        setSelectedClientId(defaultClientId);
        setIrpfPercent(hasClientIrpf ? 15 : 0);
        setLines([{ concept: '', quantity: 1, price_unit: 0, igic_rate: defaultIgic }]);

        const nextNum = await generateNextInvoiceNumber(false);
        setInvoiceNumber(nextNum);
      }
    }

    if (isOpen) {
      initForm();
    }
  }, [isOpen, initialInvoice]);

  if (!isOpen) return null;

  const isReadOnlyDueToVerifactu =
    Boolean(settings?.verifactu_enabled) &&
    Boolean(initialInvoice?.id) &&
    (initialInvoice?.status === 'Pendiente' || initialInvoice?.status === 'Pagada');

  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    const clientObj = clients.find((c) => c.id === clientId);
    if (clientObj) {
      setIrpfPercent(clientObj.default_retention_irpf ? 15 : 0);
    }
  };

  const handleAddLine = () => {
    const defaultIgic = settings ? settings.default_igic_rate : 7;
    setLines([...lines, { concept: '', quantity: 1, price_unit: 0, igic_rate: defaultIgic }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: 'concept' | 'quantity' | 'price_unit' | 'igic_rate',
    value: any
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const computedInvoiceLines: InvoiceLine[] = lines.map((l) => {
    const unitPriceCents = parseEuroToCents(l.price_unit);
    const { totalLineCents } = calculateLineTotals(l.quantity, unitPriceCents, 0, l.igic_rate);
    return {
      concept: l.concept,
      quantity: Number(l.quantity),
      unit_price: unitPriceCents,
      discount: 0,
      igic_rate: Number(l.igic_rate),
      total_line: totalLineCents,
    };
  });

  const summary = calculateInvoiceSummary(computedInvoiceLines, irpfPercent);

  const handleSubmit = async (e: React.FormEvent, targetStatus?: Invoice['status']) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Por favor ingresa un número de factura');
      return;
    }
    if (!selectedClientId) {
      alert('Por favor selecciona un cliente');
      return;
    }
    if (lines.some((l) => !l.concept.trim())) {
      alert('Todas las líneas deben tener un concepto válido');
      return;
    }

    const finalStatus = targetStatus || status;

    const invoiceData: Omit<Invoice, 'id'> & { id?: number } = {
      id: initialInvoice?.id,
      invoice_number: invoiceNumber,
      client_id: Number(selectedClientId),
      issue_date: issueDate,
      due_date: dueDate,
      status: finalStatus,
      verifactu_status: settings?.verifactu_enabled ? 'Pendiente' : 'N/A',
      total_base: summary.totalBaseCents,
      total_igic: summary.totalIgicCents,
      total_irpf: summary.totalIrpfCents,
      grand_total: summary.grandTotalCents,
      is_rectification: initialInvoice?.is_rectification || false,
      original_invoice_id: initialInvoice?.original_invoice_id || null,
    };

    try {
      await saveInvoice(invoiceData, computedInvoiceLines);
      onInvoiceSaved();
      onClose();
    } catch (err) {
      console.error('Error al guardar la factura:', err);
      alert('Error guardando la factura');
    }
  };

  const selectedClientObj = clients.find((c) => c.id === Number(selectedClientId));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-slate-800'
              : 'bg-gradient-to-r from-[#0055ff] to-[#0033aa] text-white border-blue-500'
          }`}
        >
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>
                {initialInvoice?.id ? `Editar Factura ${invoiceNumber}` : 'Nueva Factura'}
              </span>
              {isReadOnlyDueToVerifactu && (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <FontAwesomeIcon icon={faLock} /> Inmutable Verifactu
                </span>
              )}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>
              Desglose automático de Base Imponible, IGIC/IVA e IRPF
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e)} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isReadOnlyDueToVerifactu && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-amber-300 text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg shrink-0" />
              <span>
                Factura emitida bajo normativa Verifactu. Los datos están bloqueados contra modificación. Para realizar cambios o rectificaciones, emita una Factura Rectificativa desde el listado.
              </span>
            </div>
          )}

          {/* Section 1: Client & Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Número de Factura
              </label>
              <input
                type="text"
                disabled={isReadOnlyDueToVerifactu}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white font-mono font-bold text-sm focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                disabled={isReadOnlyDueToVerifactu}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                disabled={isReadOnlyDueToVerifactu}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Client Selection */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-purple-300 uppercase">
                Seleccionar Cliente *
              </label>
              {selectedClientObj && (
                <span className="text-xs text-pink-300 font-mono">
                  NIF: {selectedClientObj.nif}
                </span>
              )}
            </div>
            <select
              disabled={isReadOnlyDueToVerifactu}
              value={selectedClientId}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
            >
              <option value="">-- Seleccionar cliente registrado --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nif})
                </option>
              ))}
            </select>
            {selectedClientObj?.address && (
              <p className="text-xs text-slate-400">Dirección: {selectedClientObj.address}</p>
            )}
          </div>

          {/* Section 2: Dynamic Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Líneas de Factura (Conceptos)
              </h3>
              {!isReadOnlyDueToVerifactu && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Añadir Línea</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  {/* Concepto */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">Concepto / Servicio</label>
                    <input
                      type="text"
                      disabled={isReadOnlyDueToVerifactu}
                      placeholder="Descripción del concepto"
                      value={line.concept}
                      onChange={(e) => handleLineChange(idx, 'concept', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs text-center focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
                    />
                  </div>

                  {/* Precio Unitario (€) */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-400 mb-1">Precio Un. (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.price_unit}
                      onChange={(e) =>
                        handleLineChange(idx, 'price_unit', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs text-right focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Tipo IGIC */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">IGIC / IVA</label>
                    <select
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.igic_rate}
                      onChange={(e) =>
                        handleLineChange(idx, 'igic_rate', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-blue-300 font-semibold text-xs text-center focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    >
                      <option value="0">0% Exento</option>
                      <option value="3">3% Reducido</option>
                      <option value="7">7% IGIC General</option>
                      <option value="9.5">9.5% Incrementado</option>
                      <option value="15">15% Especial</option>
                      <option value="21">21% IVA General</option>
                    </select>
                  </div>

                  {/* Botón Eliminar */}
                  {!isReadOnlyDueToVerifactu && lines.length > 1 && (
                    <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Eliminar línea"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Tax Adjustments & Summary Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-purple-900/30">
            {/* Left: Retención IRPF Option */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-900/30 space-y-3">
              <label className="block text-xs font-semibold text-purple-300 uppercase">
                Retención IRPF a Cuenta
              </label>
              <select
                disabled={isReadOnlyDueToVerifactu}
                value={irpfPercent}
                onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-pink-500/50 disabled:opacity-60"
              >
                <option value="0">Sin Retención IRPF (0%)</option>
                <option value="7">7% Retención IRPF (Nuevos Autónomos)</option>
                <option value="15">15% Retención IRPF (Profesionales Estándar)</option>
              </select>
              <p className="text-xs text-slate-400">
                La retención IRPF se resta del importe total sobre la Base Imponible.
              </p>
            </div>

            {/* Right: Calculated Totals Summary */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Base Imponible Total:</span>
                <span className="font-semibold">{formatCurrency(summary.totalBaseCents)}</span>
              </div>

              {summary.igicBreakdown.map((b) => (
                <div key={b.rate} className="flex justify-between text-xs text-purple-300">
                  <span>Cuota IGIC ({b.rate}%):</span>
                  <span>{formatCurrency(b.igicCents)}</span>
                </div>
              ))}

              {summary.totalIrpfCents > 0 && (
                <div className="flex justify-between text-xs text-rose-400">
                  <span>Retención IRPF (-{irpfPercent}%):</span>
                  <span>-{formatCurrency(summary.totalIrpfCents)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-purple-500/30 flex justify-between items-center text-lg font-extrabold text-white">
                <span className="text-purple-200">TOTAL FACTURA:</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  {formatCurrency(summary.grandTotalCents)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-slate-900 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase">Estado:</label>
            <select
              disabled={isReadOnlyDueToVerifactu}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none disabled:opacity-60"
            >
              <option value="Borrador">Borrador</option>
              <option value="Pendiente">Pendiente de Pago</option>
              <option value="Pagada">Pagada</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            {!isReadOnlyDueToVerifactu && (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'Borrador')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-sm font-semibold flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>Guardar Borrador</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'Pendiente')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-950/50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Emitir Factura</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
