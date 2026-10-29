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
  faShieldAlt,
  faInfoCircle,
  faRotateLeft,
  faFilePdf,
} from '../utils/icons';
import { Client, Invoice, InvoiceLine, Settings } from '../types';
import {
  getClients,
  getSettings,
  generateNextInvoiceNumber,
  saveInvoice,
  saveClient,
  getRecentConcepts,
  ConceptoRecurrente,
  addAuditLogEntry,
} from '../services/database';
import { processVerifactuInvoice } from '../services/verifactu';
import { generateInvoicePdf } from '../services/pdfGenerator';
import { calculateInvoiceSummary, calculateLineTotals, centsToEuroNumber, formatCurrency, parseEuroToCents } from '../utils/currency';
import { parsearFechaEspanolaAIso } from '../utils/fechas';
import { CampoFechaEspanola } from '../components/CampoFechaEspanola';

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
  const [status, setStatus] = useState<Invoice['status']>('Pagada');
  const [irpfPercent, setIrpfPercent] = useState<number>(0);
  const [autoDownloadPdf, setAutoDownloadPdf] = useState<boolean>(true);

  // Estados para creación rápida de cliente
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientNif, setNewClientNif] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientIrpf, setNewClientIrpf] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [clientError, setClientError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMsg, setSubmittingMsg] = useState('');

  const [availableConcepts, setAvailableConcepts] = useState<ConceptoRecurrente[]>([]);
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
      const [cls, stts, recentConcepts] = await Promise.all([
        getClients(),
        getSettings(),
        getRecentConcepts(),
      ]);
      setClients(cls);
      setSettings(stts);
      setAvailableConcepts(recentConcepts);

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
        setStatus('Pagada');
        setLines([{ concept: '', quantity: 1, price_unit: 0, igic_rate: defaultIgic }]);

        const nextNum = await generateNextInvoiceNumber();
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
    initialInvoice?.verifactu_status === 'Enviado';

  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    const clientObj = clients.find((c) => c.id === clientId);
    if (clientObj) {
      setIrpfPercent(clientObj.default_retention_irpf ? 15 : 0);
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClientNif.trim() || !newClientName.trim()) {
      setClientError('El NIF/CIF y el Nombre o Razón Social son campos obligatorios.');
      return;
    }
    try {
      setSavingClient(true);
      setClientError('');
      const newId = await saveClient({
        nif: newClientNif.trim().toUpperCase(),
        name: newClientName.trim(),
        address: newClientAddress.trim(),
        email: newClientEmail.trim(),
        default_retention_irpf: newClientIrpf,
      });

      // Recargar lista actualizada de clientes desde la base de datos
      const updatedClients = await getClients();
      setClients(updatedClients);

      // Asignar inmediatamente el nuevo cliente a la factura actual
      setSelectedClientId(newId);
      setIrpfPercent(newClientIrpf ? 15 : 0);

      // Limpiar formulario y cerrar panel rápido
      setNewClientNif('');
      setNewClientName('');
      setNewClientAddress('');
      setNewClientEmail('');
      setNewClientIrpf(false);
      setIsCreatingClient(false);
    } catch (err: any) {
      console.error('Error al crear cliente rápido:', err);
      setClientError(err?.message || 'Error al guardar el nuevo cliente.');
    } finally {
      setSavingClient(false);
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

  const handleApplyConcept = (index: number, conceptName: string) => {
    if (!conceptName) return;
    const match = availableConcepts.find(
      (c) => c.concept.toLowerCase() === conceptName.toLowerCase()
    );
    if (match) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        concept: match.concept,
        price_unit: centsToEuroNumber(match.unit_price),
        igic_rate: match.igic_rate,
      };
      setLines(newLines);
    } else {
      handleLineChange(index, 'concept', conceptName);
    }
  };

  const handleLineChange = (
    index: number,
    field: 'concept' | 'quantity' | 'price_unit' | 'igic_rate',
    value: any
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Si el usuario escribe o autocompleta un concepto conocido y el precio actual es 0, auto-rellenar precio e IGIC
    if (field === 'concept' && typeof value === 'string') {
      const match = availableConcepts.find(
        (c) => c.concept.trim().toLowerCase() === value.trim().toLowerCase()
      );
      if (match && newLines[index].price_unit === 0) {
        newLines[index].price_unit = centsToEuroNumber(match.unit_price);
        newLines[index].igic_rate = match.igic_rate;
      }
    }

    setLines(newLines);
  };

  const computedInvoiceLines: Omit<InvoiceLine, 'id' | 'invoice_id'>[] = lines.map((l) => {
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

  const handleSubmit = async (e: React.FormEvent, sendToVerifactu: boolean = false) => {
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

    try {
      setIsSubmitting(true);
      setSubmittingMsg(
        sendToVerifactu
          ? autoDownloadPdf
            ? 'Firmando, remitiendo a Verifactu y descargando PDF...'
            : 'Firmando y remitiendo a Verifactu...'
          : autoDownloadPdf
          ? 'Guardando factura y descargando PDF...'
          : 'Guardando factura...'
      );

      // Si se selecciona "Guardar y enviar a Verifactu", el estado de Verifactu pasa a "Enviado".
      // Si se pulsa "Guardar factura", se mantiene su estado previo o "Pendiente"/"N/A".
      const targetVerifactuStatus = sendToVerifactu
        ? 'Enviado'
        : initialInvoice?.verifactu_status || (settings?.verifactu_enabled ? 'Pendiente' : 'N/A');

      const finalIssueDate =
        parsearFechaEspanolaAIso(issueDate) || new Date().toISOString().split('T')[0];
      const finalDueDate = parsearFechaEspanolaAIso(dueDate) || finalIssueDate;

      const invoiceData: Omit<Invoice, 'id'> & { id?: number } = {
        id: initialInvoice?.id,
        invoice_number: invoiceNumber,
        client_id: Number(selectedClientId),
        issue_date: finalIssueDate,
        due_date: finalDueDate,
        status: status,
        verifactu_status: targetVerifactuStatus,
        total_base: summary.totalBaseCents,
        total_igic: summary.totalIgicCents,
        total_irpf: summary.totalIrpfCents,
        grand_total: summary.grandTotalCents,
        is_rectification: initialInvoice?.is_rectification || false,
        original_invoice_id: initialInvoice?.original_invoice_id || null,
      };

      const savedInvoiceId = await saveInvoice(invoiceData, computedInvoiceLines);

      // Cargar configuración activa y datos del cliente para Verifactu y PDF
      const activeSettings = settings || (await getSettings());
      const clientObj =
        clients.find((c) => c.id === Number(selectedClientId)) ||
        (await getClients()).find((c) => c.id === Number(selectedClientId));

      const fullInvoice: Invoice = {
        ...invoiceData,
        id: savedInvoiceId,
        client_name: clientObj?.name || '',
        client_nif: clientObj?.nif || '',
        client_address: clientObj?.address || '',
        lines: computedInvoiceLines as InvoiceLine[],
      };

      let qrCodeDataUrl: string | undefined = undefined;
      let xmlHash: string | undefined = undefined;

      // Si se solicitó enviar a Verifactu o si Verifactu está activado globalmente
      if (activeSettings && (sendToVerifactu || activeSettings.verifactu_enabled)) {
        let certBinary: ArrayBuffer | undefined = undefined;
        if (activeSettings.cert_path && window.Neutralino?.filesystem) {
          try {
            certBinary = await window.Neutralino.filesystem.readBinaryFile(activeSettings.cert_path);
          } catch (e) {
            console.warn('Certificado no encontrado en la ruta especificada:', e);
          }
        }

        try {
          const vResult = await processVerifactuInvoice(fullInvoice, activeSettings, certBinary);
          qrCodeDataUrl = vResult.qrCodeDataUrl;
          xmlHash = vResult.xmlHash;

          if (sendToVerifactu) {
            await addAuditLogEntry({
              action: 'SEND_VERIFACTU',
              invoice_id: savedInvoiceId,
              timestamp: new Date().toISOString(),
              xml_hash: vResult.xmlHash,
            });
          }
        } catch (vErr) {
          console.error('Error al procesar huella Verifactu:', vErr);
        }
      }

      // Descargar directamente el PDF de la factura si la opción está activada
      if (autoDownloadPdf) {
        const fallbackSettings: Settings = activeSettings || {
          id: 1,
          issuer_nif: '',
          issuer_name: 'Empresa Emisora',
          issuer_address: '',
          issuer_iban: '',
          default_igic_rate: 7,
          verifactu_enabled: false,
          cert_path: '',
        };

        try {
          const pdfDoc = generateInvoicePdf(fullInvoice, fallbackSettings, {
            showExcludingIgicColumn: false,
            qrCodeDataUrl,
            xmlHash,
          });
          const sanitizedNum = (invoiceNumber || 'factura').trim().replace(/[/\\?%*:|"<>]/g, '_');
          pdfDoc.save(`Factura_${sanitizedNum}.pdf`);
        } catch (pdfErr) {
          console.error('Error al generar y descargar el PDF de la factura:', pdfErr);
        }
      }

      onInvoiceSaved();
      onClose();
    } catch (err) {
      console.error('Error al guardar la factura:', err);
      alert('Error guardando la factura');
    } finally {
      setIsSubmitting(false);
      setSubmittingMsg('');
    }
  };

  const selectedClientObj = clients.find((c) => c.id === Number(selectedClientId));

  const labelClass = `block text-xs font-bold uppercase mb-1 ${
    isDark ? 'text-blue-300' : 'text-blue-700'
  }`;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60 ${
    isDark
      ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${
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
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-blue-100'}`}>
              Desglose de Base Imponible e IGIC/IVA para el cliente, con control fiscal de IRPF para el operador
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e)} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isReadOnlyDueToVerifactu && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                isDark
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg shrink-0" />
              <span>
                Factura emitida bajo normativa Verifactu. Los datos están bloqueados contra modificación. Para realizar cambios o rectificaciones, emita una Factura Rectificativa desde el listado.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Número de Factura</label>
              <input
                type="text"
                disabled={isReadOnlyDueToVerifactu}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`${inputClass} font-mono font-bold`}
              />
            </div>
            <CampoFechaEspanola
              label="Fecha de Emisión"
              value={issueDate}
              onChange={(iso) => setIssueDate(iso)}
              disabled={isReadOnlyDueToVerifactu}
              theme={theme}
              required
            />
            <CampoFechaEspanola
              label="Fecha Vencimiento"
              value={dueDate}
              onChange={(iso) => setDueDate(iso)}
              disabled={isReadOnlyDueToVerifactu}
              theme={theme}
            />
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className={labelClass}>Seleccionar Cliente *</label>
              <div className="flex items-center gap-2">
                {selectedClientObj && (
                  <span className={`text-xs font-mono font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    NIF: {selectedClientObj.nif}
                  </span>
                )}
                {!isReadOnlyDueToVerifactu && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingClient((prev) => !prev);
                      setClientError('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                      isCreatingClient
                        ? isDark
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        : isDark
                        ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={isCreatingClient ? faTimes : faPlus} className="text-[10px]" />
                    <span>{isCreatingClient ? 'Cerrar' : '+ Nuevo Cliente'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Formulario Rápido para Crear Cliente */}
            {isCreatingClient && (
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 animate-fade-in ${
                  isDark
                    ? 'bg-zinc-950 border-blue-500/40 shadow-xl'
                    : 'bg-white border-blue-300 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-dashed border-zinc-700/40">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                    Registrar y Asignar Nuevo Cliente
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Se guardará en la base de datos y quedará asignado a la factura
                  </span>
                </div>

                {clientError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-rose-400 shrink-0" />
                    <span>{clientError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1 text-slate-400">
                      NIF / CIF *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. B35123456"
                      value={newClientNif}
                      onChange={(e) => setNewClientNif(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1 text-slate-400">
                      Nombre o Razón Social *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Comercial Canaria S.L."
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1 text-slate-400">
                      Dirección Fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Calle Mayor 12, Las Palmas"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase mb-1 text-slate-400">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      placeholder="Ej. facturas@empresa.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newClientIrpf}
                      onChange={(e) => setNewClientIrpf(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 rounded-sm"
                    />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Aplicar retención IRPF por defecto (15%)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingClient(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        isDark
                          ? 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={savingClient}
                      onClick={handleSaveNewClient}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        savingClient ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                      } ${
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/60'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={faSave} />
                      <span>{savingClient ? 'Guardando...' : 'Guardar y Asignar Cliente'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <select
              disabled={isReadOnlyDueToVerifactu}
              value={selectedClientId}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className={inputClass}
            >
              <option value="">-- Seleccionar cliente registrado --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nif})
                </option>
              ))}
            </select>
            {selectedClientObj?.address && (
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Dirección: {selectedClientObj.address}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Líneas de Factura (Conceptos)
              </h3>
              {!isReadOnlyDueToVerifactu && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  }`}
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
                  className={`p-4 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-3 items-center ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <label className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Concepto / Servicio
                      </label>
                      {availableConcepts.length > 0 && !isReadOnlyDueToVerifactu && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleApplyConcept(idx, e.target.value);
                            }
                          }}
                          className={`text-[10px] py-0.5 px-1.5 rounded-lg border transition-colors cursor-pointer max-w-[170px] truncate ${
                            isDark
                              ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:text-blue-300'
                              : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                          }`}
                          title="Reutilizar concepto guardado de facturas previas"
                        >
                          <option value="">↺ Reutilizar...</option>
                          {availableConcepts.map((c, i) => (
                            <option key={i} value={c.concept}>
                              {c.concept} ({centsToEuroNumber(c.unit_price).toFixed(2)}€ | {c.igic_rate}%)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input
                      type="text"
                      list="concept-suggestions"
                      disabled={isReadOnlyDueToVerifactu}
                      placeholder="Descripción del concepto"
                      value={line.concept}
                      onChange={(e) => handleLineChange(idx, 'concept', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-[11px] mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className={`${inputClass} text-center`}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className={`block text-[11px] mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Precio Un. (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.price_unit}
                      onChange={(e) =>
                        handleLineChange(idx, 'price_unit', parseFloat(e.target.value) || 0)
                      }
                      className={`${inputClass} text-right`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-[11px] mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      IGIC / IVA
                    </label>
                    <select
                      disabled={isReadOnlyDueToVerifactu}
                      value={line.igic_rate}
                      onChange={(e) =>
                        handleLineChange(idx, 'igic_rate', parseFloat(e.target.value) || 0)
                      }
                      className={`${inputClass} text-center font-semibold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      <option value="0">0% Exento</option>
                      <option value="3">3% Reducido</option>
                      <option value="7">7% IGIC General</option>
                      <option value="9.5">9.5% Incrementado</option>
                      <option value="15">15% Especial</option>
                      <option value="21">21% IVA General</option>
                    </select>
                  </div>
                  {!isReadOnlyDueToVerifactu && lines.length > 1 && (
                    <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Eliminar línea"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sugerencias de conceptos reutilizados para autocompletado en el input */}
            <datalist id="concept-suggestions">
              {availableConcepts.map((c, i) => (
                <option key={i} value={c.concept}>
                  {centsToEuroNumber(c.unit_price).toFixed(2)} € (IGIC {c.igic_rate}%)
                </option>
              ))}
            </datalist>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            {/* Panel Exclusivo del Operador: Régimen Fiscal IRPF */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/70 border-amber-500/20' : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-xs" />
                  <span>Panel Exclusivo Operador</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isDark
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  Uso Interno
                </span>
              </div>

              <div>
                <label className={labelClass}>Retención IRPF a Cuenta (Emisor)</label>
                <select
                  disabled={isReadOnlyDueToVerifactu}
                  value={irpfPercent}
                  onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                >
                  <option value="0">Sin Retención IRPF (0%)</option>
                  <option value="7">7% Retención IRPF (Nuevos Autónomos)</option>
                  <option value="15">15% Retención IRPF (Profesionales Estándar)</option>
                </select>
              </div>

              <div
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                  isDark ? 'bg-zinc-950/60 text-zinc-400' : 'bg-white/80 text-slate-600 border border-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-amber-500 text-xs mt-0.5 shrink-0" />
                <span>
                  El cliente solo abona Base + IGIC/IVA. Esta sección es exclusiva para el control contable y fiscal del operador.
                </span>
              </div>

              {summary.totalIrpfCents > 0 && (
                <div
                  className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                    isDark
                      ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-rose-500 font-medium">Retención IRPF ({irpfPercent}%):</span>
                    <span className="font-semibold text-rose-500">-{formatCurrency(summary.totalIrpfCents)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-700/40 font-medium">
                    <span>Rendimiento neto estimado operador:</span>
                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                      {formatCurrency(summary.operatorNetCents)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Totales Factura (Cliente) */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 text-sm ${
                isDark
                  ? 'bg-blue-950/30 border-blue-500/30'
                  : 'bg-blue-50/80 border-blue-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-500 pb-1 border-b border-blue-500/20">
                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                <span>Totales Factura (Cliente)</span>
              </div>

              <div className={`flex justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <span>Base Imponible Total:</span>
                <span className="font-semibold">{formatCurrency(summary.totalBaseCents)}</span>
              </div>
              {summary.igicBreakdown.map((b) => (
                <div
                  key={b.rate}
                  className={`flex justify-between text-xs ${
                    isDark ? 'text-blue-300' : 'text-blue-800 font-medium'
                  }`}
                >
                  <span>Cuota IGIC/IVA ({b.rate}%):</span>
                  <span>{formatCurrency(b.igicCents)}</span>
                </div>
              ))}
              <div
                className={`pt-3 border-t flex justify-between items-center text-lg font-extrabold ${
                  isDark
                    ? 'border-blue-500/30 text-white'
                    : 'border-blue-200 text-slate-900'
                }`}
              >
                <div>
                  <span className="block">TOTAL FACTURA:</span>
                  <span className={`block text-[11px] font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Base + IGIC/IVA a pagar por el cliente
                  </span>
                </div>
                <span className={isDark ? 'text-blue-400' : 'text-blue-700 font-extrabold text-xl'}>
                  {formatCurrency(summary.grandTotalCents)}
                </span>
              </div>
            </div>
          </div>
        </form>

        <div
          className={`p-6 border-t flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#131314] border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Estado:
              </label>
              <select
                disabled={isReadOnlyDueToVerifactu}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={inputClass}
              >
                <option value="Pagada">Pagada (Por defecto)</option>
                <option value="Pendiente">Pendiente de Pago</option>
                <option value="Borrador">Borrador</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>

            <label
              className={`flex items-center gap-2 cursor-pointer text-xs font-semibold select-none px-3 py-2 rounded-xl border transition-all ${
                autoDownloadPdf
                  ? isDark
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                  : isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
              title="Descargar automáticamente el archivo PDF de la factura al guardar o emitir"
            >
              <input
                type="checkbox"
                checked={autoDownloadPdf}
                onChange={(e) => setAutoDownloadPdf(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <FontAwesomeIcon icon={faFilePdf} className={autoDownloadPdf ? 'text-blue-400' : 'text-zinc-400'} />
              <span>Descargar PDF directamente</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              Cancelar
            </button>
            {!isReadOnlyDueToVerifactu && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, false)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                  } ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-blue-300 border-blue-500/30'
                      : 'bg-white hover:bg-slate-100 text-blue-700 border-blue-300 shadow-sm'
                  }`}
                  title={
                    autoDownloadPdf
                      ? 'Guardar la factura en la base de datos y descargar directamente el PDF'
                      : 'Guardar la factura en la base de datos sin enviarla aún a Verifactu'
                  }
                >
                  <FontAwesomeIcon icon={autoDownloadPdf ? faFilePdf : faSave} />
                  <span>
                    {isSubmitting && !submittingMsg.includes('Verifactu')
                      ? 'Guardando...'
                      : autoDownloadPdf
                      ? 'Guardar y descargar PDF'
                      : 'Guardar factura'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, true)}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 cursor-pointer transition-all ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                  } bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50`}
                  title={
                    autoDownloadPdf
                      ? 'Guardar la factura, remitirla formalmente a Verifactu y descargar directamente el PDF'
                      : 'Guardar la factura y remitirla formalmente a Verifactu'
                  }
                >
                  <FontAwesomeIcon icon={faShieldAlt} />
                  <span>
                    {isSubmitting && submittingMsg.includes('Verifactu')
                      ? 'Enviando...'
                      : autoDownloadPdf
                      ? 'Guardar, emitir y descargar PDF'
                      : 'Guardar y enviar a Verifactu'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
