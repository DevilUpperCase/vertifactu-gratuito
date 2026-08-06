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
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNewInvoice,
  onViewInvoice,
  onNavigateToInvoices,
  onNavigateToClients,
  onNavigateToSettings,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const totalBilledCents = invoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.grand_total, 0);

  const pendingCollectionCents = invoices
    .filter((i) => i.status === 'Pendiente')
    .reduce((acc, i) => acc + i.grand_total, 0);

  const totalIgicCents = invoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.total_igic, 0);

  const draftCount = invoices.filter((i) => i.status === 'Borrador').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin text-purple-400 text-3xl font-bold">↻</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Facturado */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-purple-950/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Total Facturado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalBilledCents)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Acumulado anual en Canarias</p>
        </div>

        {/* Card 2: Pendiente de Cobro */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-purple-950/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider">
              Pendiente de Cobro
            </span>
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(pendingCollectionCents)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Facturas pendientes de pago</p>
        </div>

        {/* Card 3: Total IGIC a Liquidar */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-purple-950/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              IGIC Acumulado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalIgicCents)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Total cuota IGIC a declarar</p>
        </div>

        {/* Card 4: Verifactu Status */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-purple-950/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Verifactu AEAT
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {settings?.verifactu_enabled ? 'Inmutable (ON)' : 'Estándar (OFF)'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {settings?.verifactu_enabled
              ? 'Firma digital y huella XML activas'
              : 'Haz clic en Configuración para activar'}
          </p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/60 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Gestión de Facturación Adaptada a Canarias
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Crea facturas en segundos con cálculo de IGIC por línea, IRPF configurable, duplicación por plantilla y cumplimiento estricto de la Ley Antifraude 11/2021 Verifactu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNewInvoice}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nueva Factura</span>
          </button>
          <button
            onClick={onNavigateToClients}
            className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-purple-200 font-semibold text-sm border border-purple-500/30 flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Gestionar Clientes</span>
          </button>
        </div>
      </div>

      {/* Recent Invoices Table Preview */}
      <div className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Últimas Facturas Emitidas</h3>
            <p className="text-xs text-slate-400">Resumen rápido de las facturas más recientes</p>
          </div>
          <button
            onClick={onNavigateToInvoices}
            className="text-xs font-semibold text-purple-300 hover:text-pink-300 transition-colors"
          >
            Ver todas las facturas →
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <p>No se han registrado facturas todavía.</p>
            <button
              onClick={onNewInvoice}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-medium"
            >
              Crear tu primera factura
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-purple-900/30">
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
              <tbody className="divide-y divide-purple-900/20">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-purple-200">
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
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors"
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
