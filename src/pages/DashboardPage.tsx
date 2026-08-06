import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faFileInvoice,
  faUsers,
  faShieldAlt,
  faPlus,
  faEye,
  faCheckCircle,
} from '../utils/icons';
import { Invoice, Settings } from '../types';
import { getInvoices, getSettings } from '../services/database';
import { formatCurrency } from '../utils/currency';

interface DashboardPageProps {
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
  onNavigateToClients: () => void;
  onNavigateToSettings: () => void;
  refreshTrigger?: number;
  theme?: 'dark' | 'light';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNewInvoice,
  onViewInvoice,
  onNavigateToInvoices,
  onNavigateToClients,
  onNavigateToSettings,
  refreshTrigger,
  theme = 'dark',
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    async function loadData() {
      try {
        const invs = await getInvoices();
        const setts = await getSettings();
        setInvoices(invs);
        setSettings(setts);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const totalBilledCents = invoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.grand_total, 0);

  const pendingCollectionCents = invoices
    .filter((i) => i.status === 'Pendiente')
    .reduce((acc, i) => acc + i.grand_total, 0);

  const totalIgicCents = invoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.total_igic, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin text-blue-500 text-3xl font-bold">↻</div>
      </div>
    );
  }

  const cardBgClass = isDark
    ? 'bg-[#1e1f20] border-zinc-800 shadow-xl text-zinc-100'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Facturado */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              Total Facturado
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(totalBilledCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Acumulado total de emisión
          </p>
        </div>

        {/* Card 2: Pendiente de Cobro */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Pendiente de Cobro
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}
            >
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(pendingCollectionCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Facturas pendientes de pago
          </p>
        </div>

        {/* Card 3: Total Impuestos (IGIC/IVA) */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              IGIC / IVA Acumulado
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(totalIgicCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total cuota repercutida a declarar
          </p>
        </div>

        {/* Card 4: Verifactu Status */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}
            >
              Verifactu AEAT
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-600'
              }`}
            >
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {settings?.verifactu_enabled ? 'Inmutable (ON)' : 'Estándar (OFF)'}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {settings?.verifactu_enabled
              ? 'Firma digital y huella XML activas'
              : 'Haz clic en Configuración para activar'}
          </p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div
        className={`p-8 rounded-3xl border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-blue-500/30 text-white'
            : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 border-blue-500 text-white shadow-xl'
        }`}
      >
        <div>
          <h2 className="text-xl font-bold mb-2">
            Software de Facturación Gratis para España (Verifactu & IGIC/IVA)
          </h2>
          <p className={`text-sm max-w-xl ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>
            Crea facturas e impresos en segundos con desglose automático de impuestos, retención IRPF, duplicado por plantilla y cumplimiento inalterable de la Ley Antifraude Verifactu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNewInvoice}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 ${
              isDark
                ? 'bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-950/50'
                : 'bg-white text-blue-700 hover:bg-slate-100 shadow-blue-900/30'
            }`}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nueva Factura</span>
          </button>
          <button
            onClick={onNavigateToClients}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm border flex items-center gap-2 transition-colors ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-blue-300 border-blue-500/30'
                : 'bg-blue-700/50 hover:bg-blue-800/60 text-white border-blue-400/40'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Gestionar Clientes</span>
          </button>
        </div>
      </div>

      {/* Recent Invoices Table Preview */}
      <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Últimas Facturas Emitidas
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Resumen rápido de las facturas más recientes
            </p>
          </div>
          <button
            onClick={onNavigateToInvoices}
            className={`text-xs font-semibold transition-colors ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            Ver todas las facturas →
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <p>No se han registrado facturas todavía.</p>
            <button
              onClick={onNewInvoice}
              className={`mt-4 px-4 py-2 rounded-xl border text-xs font-medium ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              Crear tu primera factura
            </button>
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
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Base Imponible</th>
                  <th className="py-3 px-4 text-right">Total Factura</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}
              >
                {invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className={`py-3.5 px-4 font-bold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      {inv.invoice_number}
                      {inv.is_rectification && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          Rectificativa
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-medium ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {inv.client_name || 'N/A'}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {inv.issue_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'Pagada'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : inv.status === 'Pendiente'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : inv.status === 'Anulada'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatCurrency(inv.total_base)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                        }`}
                        title="Ver detalle de factura"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
