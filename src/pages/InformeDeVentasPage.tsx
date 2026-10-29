import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel,
  faCalendarAlt,
  faFilter,
  faChartLine,
  faFileInvoice,
  faCheckCircle,
  faDownload,
  faRotateLeft,
  faShieldAlt,
  faTable,
  faFilePdf,
} from '../utils/icons';
import { Invoice, Settings } from '../types';
import { getInvoices, getSettings, getIgicBreakdownByInvoiceIds } from '../services/database';
import { formatCurrency } from '../utils/currency';
import {
  exportarInformeExcelVentas,
  DatosInformeExcel,
  FilaMatrizVentas,
  MesColumna,
} from '../services/informeExcelService';
import { exportarInformePdfVentas } from '../services/informePdfService';

interface InformeDeVentasPageProps {
  theme?: 'dark' | 'light';
}

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type Trimestre = 1 | 2 | 3 | 4;

const TRIMESTRES_CONFIG: { [key in Trimestre]: { nombre: string; meses: number[] } } = {
  1: { nombre: '1T (Enero - Marzo)', meses: [1, 2, 3] },
  2: { nombre: '2T (Abril - Junio)', meses: [4, 5, 6] },
  3: { nombre: '3T (Julio - Septiembre)', meses: [7, 8, 9] },
  4: { nombre: '4T (Octubre - Diciembre)', meses: [10, 11, 12] },
};

export const InformeDeVentasPage: React.FC<InformeDeVentasPageProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  // Configuración y datos
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Estado del selector temporal
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1; // 1 a 12
  const trimestreActual: Trimestre =
    mesActual <= 3 ? 1 : mesActual <= 6 ? 2 : mesActual <= 9 ? 3 : 4;

  const [selectedYear, setSelectedYear] = useState<number>(anioActual);
  const [modoPeriodo, setModoPeriodo] = useState<'trimestre' | 'personalizado'>('trimestre');
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(trimestreActual);
  const [selectedMeses, setSelectedMeses] = useState<number[]>(TRIMESTRES_CONFIG[trimestreActual].meses);

  // Filtros adicionales
  const [incluirBorradores, setIncluirBorradores] = useState<boolean>(false);
  const [desgloseFiscal, setDesgloseFiscal] = useState<Array<{ rate: number; baseCents: number; igicCents: number }>>([]);

  // Carga inicial de facturas y configuración
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [invList, setts] = await Promise.all([getInvoices(), getSettings()]);
        setInvoices(invList);
        setSettings(setts);
      } catch (err) {
        console.error('Error al cargar datos para el informe de ventas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Actualizar meses cuando cambia el trimestre
  const handleSelectTrimestre = (t: Trimestre) => {
    setSelectedTrimestre(t);
    setSelectedMeses(TRIMESTRES_CONFIG[t].meses);
  };

  // Alternar selección de un mes individual en modo personalizado
  const toggleMesPersonalizado = (numeroMes: number) => {
    setSelectedMeses((prev) => {
      if (prev.includes(numeroMes)) {
        if (prev.length === 1) return prev; // Mantener al menos un mes seleccionado
        return prev.filter((m) => m !== numeroMes).sort((a, b) => a - b);
      } else {
        return [...prev, numeroMes].sort((a, b) => a - b);
      }
    });
  };

  // Generar lista de años disponibles (desde hace 5 años hasta el siguiente)
  const aniosDisponibles = useMemo(() => {
    const list: number[] = [];
    for (let y = anioActual + 1; y >= anioActual - 4; y--) {
      list.push(y);
    }
    return list;
  }, [anioActual]);

  // Lista ordenada de meses activos
  const mesesColumnas: MesColumna[] = useMemo(() => {
    return selectedMeses.map((m) => ({
      numero: m,
      nombre: NOMBRES_MESES[m - 1],
    }));
  }, [selectedMeses]);

  // Facturas filtradas por el período y opciones
  const facturasFiltradas = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === 'Anulada') return false;
      if (!incluirBorradores && inv.status === 'Borrador') return false;

      // Parsing de fecha: YYYY-MM-DD
      const partes = inv.issue_date.split('-');
      if (partes.length < 3) return false;
      const invYear = parseInt(partes[0], 10);
      const invMonth = parseInt(partes[1], 10);

      return invYear === selectedYear && selectedMeses.includes(invMonth);
    });
  }, [invoices, selectedYear, selectedMeses, incluirBorradores]);

  // Cargar desglose de IGIC cuando cambian las facturas filtradas
  useEffect(() => {
    async function loadIgicBreakdown() {
      const ids = facturasFiltradas.map((f) => f.id).filter((id): id is number => id !== undefined);
      if (ids.length === 0) {
        setDesgloseFiscal([]);
        return;
      }
      try {
        const breakdown = await getIgicBreakdownByInvoiceIds(ids);
        setDesgloseFiscal(breakdown);
      } catch (err) {
        console.error('Error al calcular desglose fiscal:', err);
      }
    }
    loadIgicBreakdown();
  }, [facturasFiltradas]);

  // Cálculo de la matriz diaria (Días 1 a 31)
  const matrizDatos = useMemo(() => {
    // Inicializar mapa de días
    const filas: FilaMatrizVentas[] = [];
    const totalesMesCents: { [mes: number]: number } = {};
    selectedMeses.forEach((m) => {
      totalesMesCents[m] = 0;
    });

    let granTotalVentasCents = 0;
    let granTotalBaseCents = 0;
    let granTotalIgicCents = 0;

    for (let d = 1; d <= 31; d++) {
      const ventasPorMes: { [mes: number]: number } = {};
      selectedMeses.forEach((m) => {
        ventasPorMes[m] = 0;
      });

      filas.push({
        dia: d,
        ventasPorMes,
        totalDiaCents: 0,
        totalIgicDiaCents: 0,
      });
    }

    // Agregar datos de las facturas filtradas
    for (const inv of facturasFiltradas) {
      const partes = inv.issue_date.split('-');
      const invMonth = parseInt(partes[1], 10);
      const invDay = parseInt(partes[2], 10);

      if (invDay >= 1 && invDay <= 31) {
        const fila = filas[invDay - 1];
        if (fila.ventasPorMes[invMonth] !== undefined) {
          fila.ventasPorMes[invMonth] += inv.grand_total;
          fila.totalDiaCents += inv.grand_total;
          fila.totalIgicDiaCents += inv.total_igic;

          totalesMesCents[invMonth] = (totalesMesCents[invMonth] || 0) + inv.grand_total;
          granTotalVentasCents += inv.grand_total;
          granTotalBaseCents += inv.total_base;
          granTotalIgicCents += inv.total_igic;
        }
      }
    }

    return {
      filas,
      totalesMesCents,
      granTotalVentasCents,
      granTotalBaseCents,
      granTotalIgicCents,
      totalFacturas: facturasFiltradas.length,
    };
  }, [facturasFiltradas, selectedMeses]);

  // Título legible del período actual
  const tituloPeriodo = useMemo(() => {
    if (modoPeriodo === 'trimestre') {
      return `${TRIMESTRES_CONFIG[selectedTrimestre].nombre} ${selectedYear}`;
    }
    if (selectedMeses.length === 1) {
      return `${NOMBRES_MESES[selectedMeses[0] - 1]} ${selectedYear}`;
    }
    return `${selectedMeses.map((m) => NOMBRES_MESES[m - 1]).join(', ')} ${selectedYear}`;
  }, [modoPeriodo, selectedTrimestre, selectedYear, selectedMeses]);

  // Manejar exportación a Excel
  const handleDescargarExcel = () => {
    try {
      setExporting(true);
      const datosExcel: DatosInformeExcel = {
        tituloPeriodo,
        anio: selectedYear,
        meses: mesesColumnas,
        filas: matrizDatos.filas,
        totalesMesCents: matrizDatos.totalesMesCents,
        granTotalVentasCents: matrizDatos.granTotalVentasCents,
        granTotalBaseCents: matrizDatos.granTotalBaseCents,
        granTotalIgicCents: matrizDatos.granTotalIgicCents,
        totalFacturas: matrizDatos.totalFacturas,
        desgloseIgic: desgloseFiscal.map((d) => ({
          tipo: d.rate,
          baseCents: d.baseCents,
          cuotaCents: d.igicCents,
        })),
        emisorNombre: settings?.issuer_name,
        emisorNif: settings?.issuer_nif,
      };

      exportarInformeExcelVentas(datosExcel);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      alert('Hubo un error al generar el archivo Excel. Revisa la consola.');
    } finally {
      setExporting(false);
    }
  };

  // Manejar exportación a PDF
  const handleDescargarPdf = () => {
    try {
      setExportingPdf(true);
      const datosPdf: DatosInformeExcel = {
        tituloPeriodo,
        anio: selectedYear,
        meses: mesesColumnas,
        filas: matrizDatos.filas,
        totalesMesCents: matrizDatos.totalesMesCents,
        granTotalVentasCents: matrizDatos.granTotalVentasCents,
        granTotalBaseCents: matrizDatos.granTotalBaseCents,
        granTotalIgicCents: matrizDatos.granTotalIgicCents,
        totalFacturas: matrizDatos.totalFacturas,
        desgloseIgic: desgloseFiscal.map((d) => ({
          tipo: d.rate,
          baseCents: d.baseCents,
          cuotaCents: d.igicCents,
        })),
        emisorNombre: settings?.issuer_name,
        emisorNif: settings?.issuer_nif,
      };

      exportarInformePdfVentas(datosPdf);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      alert('Hubo un error al generar el archivo PDF. Revisa la consola.');
    } finally {
      setExportingPdf(false);
    }
  };

  const cardBgClass = isDark
    ? 'bg-[#1e1f20] border-zinc-800 shadow-xl text-zinc-100'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin text-blue-500 text-3xl font-bold">↻</div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Cargando ventas y facturas para el informe...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Barra Superior de Control de Período y Descarga */}
      <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Información y Título */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Generar Informe de Ventas
              </h2>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Matriz diaria de ventas por trimestres con desglose y columna separada de IGIC para contabilidad.
            </p>
          </div>

          {/* Botones Principales de Descarga: Excel y PDF */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Botón Excel */}
            <button
              onClick={handleDescargarExcel}
              disabled={exporting}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                exporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              } ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/25'
              }`}
            >
              <FontAwesomeIcon icon={faFileExcel} className="text-sm" />
              <span>{exporting ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}</span>
            </button>

            {/* Botón PDF */}
            <button
              onClick={handleDescargarPdf}
              disabled={exportingPdf}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                exportingPdf ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              } ${
                isDark
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/50 border border-rose-500/40'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-700/25'
              }`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="text-sm" />
              <span>{exportingPdf ? 'Generando PDF...' : 'Descargar PDF (.pdf)'}</span>
            </button>
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-slate-700/40 dark:border-zinc-800" />

        {/* Selectores de Período: Trimestres o Personalizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Selector de Año */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-blue-500" />
              Año Fiscal
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className={`w-full px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-zinc-700 text-zinc-100 hover:border-blue-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-blue-500 focus:border-blue-500'
              }`}
            >
              {aniosDisponibles.map((y) => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Selección: Trimestre vs Personalizado */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <FontAwesomeIcon icon={faFilter} className="mr-1.5 text-blue-500" />
              Modo de Período
            </label>
            <div className="flex rounded-xl p-1 border bg-slate-900/40 dark:bg-black/40 border-zinc-700/60 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setModoPeriodo('trimestre');
                  setSelectedMeses(TRIMESTRES_CONFIG[selectedTrimestre].meses);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  modoPeriodo === 'trimestre'
                    ? isDark
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-blue-600 text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Trimestre
              </button>
              <button
                type="button"
                onClick={() => setModoPeriodo('personalizado')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  modoPeriodo === 'personalizado'
                    ? isDark
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-blue-600 text-white font-bold shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Opciones de Trimestre (si modo trimestre) */}
          {modoPeriodo === 'trimestre' ? (
            <div className="space-y-1.5 lg:col-span-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Seleccionar Trimestre (Por Defecto)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as Trimestre[]).map((t) => {
                  const isActive = selectedTrimestre === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSelectTrimestre(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-950/60'
                            : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : isDark
                          ? 'bg-slate-900/80 border-zinc-800 text-slate-300 hover:border-zinc-700 hover:bg-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{t}T</span>
                      <span className="hidden sm:inline text-[10px] block opacity-80 font-normal">
                        {t === 1 ? 'Ene-Mar' : t === 2 ? 'Abr-Jun' : t === 3 ? 'Jul-Sep' : 'Oct-Dic'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Opciones de Meses Individuales (si modo personalizado) */
            <div className="space-y-1.5 lg:col-span-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Meses a Incluir en el Informe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {NOMBRES_MESES.map((nom, idx) => {
                  const num = idx + 1;
                  const isSel = selectedMeses.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleMesPersonalizado(num)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isSel
                          ? isDark
                            ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : isDark
                          ? 'bg-slate-900 border-zinc-800 text-slate-400 hover:border-zinc-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {nom.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filtros secundarios: Borradores */}
        <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={incluirBorradores}
              onChange={(e) => setIncluirBorradores(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 rounded-sm"
            />
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Incluir facturas en estado Borrador (por defecto se excluyen)
            </span>
          </label>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Período seleccionado: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{tituloPeriodo}</strong>
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen del Período */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Ventas */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Ventas Totales ({tituloPeriodo})
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(matrizDatos.granTotalVentasCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total facturado con impuestos incluidos
          </p>
        </div>

        {/* Base Imponible */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
              Base Imponible Total
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
              }`}
            >
              <FontAwesomeIcon icon={faTable} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(matrizDatos.granTotalBaseCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Importe neto antes de impuestos
          </p>
        </div>

        {/* Total IGIC Repercutido (Columna destacada) */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              IGIC Repercutido Total
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-emerald-500">
            {formatCurrency(matrizDatos.granTotalIgicCents)}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Cuota impositiva a liquidar (Modelo 420)
          </p>
        </div>

        {/* Facturas Emitidas */}
        <div className={`p-6 rounded-3xl border transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Facturas del Período
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}
            >
              <FontAwesomeIcon icon={faFileInvoice} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {matrizDatos.totalFacturas}
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Documentos válidos emitidos
          </p>
        </div>
      </div>

      {/* Matriz Diaria de Ventas: Vista previa de tabla completa */}
      <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FontAwesomeIcon icon={faTable} className="text-blue-500 text-base" />
              <span>Matriz Diaria de Ventas ({tituloPeriodo})</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Día del mes en filas (1 al 31), columnas mensuales, total por día y columna separada de IGIC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDescargarExcel}
              disabled={exporting}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isDark
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              <FontAwesomeIcon icon={faFileExcel} />
              <span>Descargar Excel</span>
            </button>
            <button
              onClick={handleDescargarPdf}
              disabled={exportingPdf}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
            >
              <FontAwesomeIcon icon={faFilePdf} />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* 
          Gestión de scroll horizontal en tablas:
          El contenedor envolvente principal utiliza 'overflow-x-hidden' en la página,
          mientras que la caja interna de la tabla utiliza 'overflow-x-auto custom-scrollbar'
          para permitir visualizar todas las columnas del trimestre sin deformar la interfaz.
        */}
        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-700/40 dark:border-zinc-800">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead
              className={`uppercase border-b text-[11px] font-bold ${
                isDark
                  ? 'text-slate-300 bg-zinc-900/90 border-zinc-800'
                  : 'text-slate-700 bg-slate-100 border-slate-300'
              }`}
            >
              <tr>
                <th className="py-3 px-3 text-center w-14 border-r border-slate-700/30 dark:border-zinc-800/60">
                  Día
                </th>
                {mesesColumnas.map((mes) => (
                  <th key={mes.numero} className="py-3 px-4 text-right min-w-[120px]">
                    {mes.nombre}
                  </th>
                ))}
                <th className="py-3 px-4 text-right min-w-[140px] text-blue-400 dark:text-blue-300 bg-blue-500/10">
                  Total Ventas (€)
                </th>
                <th className="py-3 px-4 text-right min-w-[140px] text-emerald-500 dark:text-emerald-400 bg-emerald-500/10">
                  Total IGIC (€)
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y text-xs ${
                isDark ? 'divide-zinc-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}
            >
              {matrizDatos.filas.map((fila) => {
                const tieneVentas = fila.totalDiaCents !== 0;
                return (
                  <tr
                    key={fila.dia}
                    className={`transition-colors ${
                      tieneVentas
                        ? isDark
                          ? 'bg-blue-950/20 hover:bg-blue-900/30'
                          : 'bg-blue-50/50 hover:bg-blue-100/60'
                        : isDark
                        ? 'hover:bg-zinc-800/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Número de Día */}
                    <td
                      className={`py-2 px-3 text-center font-bold border-r border-slate-700/30 dark:border-zinc-800/60 ${
                        tieneVentas
                          ? isDark
                            ? 'text-blue-400'
                            : 'text-blue-600'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {fila.dia}
                    </td>

                    {/* Ventas por cada mes */}
                    {mesesColumnas.map((mes) => {
                      const cents = fila.ventasPorMes[mes.numero] || 0;
                      return (
                        <td
                          key={mes.numero}
                          className={`py-2 px-4 text-right font-medium ${
                            cents > 0
                              ? isDark
                                ? 'text-zinc-100'
                                : 'text-slate-900 font-semibold'
                              : cents < 0
                              ? 'text-rose-400 font-semibold'
                              : isDark
                              ? 'text-slate-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {cents !== 0 ? formatCurrency(cents) : '—'}
                        </td>
                      );
                    })}

                    {/* Total Ventas Día */}
                    <td
                      className={`py-2 px-4 text-right font-bold bg-blue-500/5 ${
                        fila.totalDiaCents !== 0
                          ? isDark
                            ? 'text-blue-300'
                            : 'text-blue-700'
                          : isDark
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {fila.totalDiaCents !== 0 ? formatCurrency(fila.totalDiaCents) : '—'}
                    </td>

                    {/* Total IGIC Día (Columna separada de impuestos) */}
                    <td
                      className={`py-2 px-4 text-right font-semibold bg-emerald-500/5 ${
                        fila.totalIgicDiaCents !== 0
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : isDark
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {fila.totalIgicDiaCents !== 0 ? formatCurrency(fila.totalIgicDiaCents) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Fila Resumen de Totales por Mes y Totales Generales */}
            <tfoot
              className={`border-t-2 font-bold text-xs uppercase ${
                isDark
                  ? 'bg-zinc-950 border-blue-500/40 text-white'
                  : 'bg-slate-100 border-blue-600 text-slate-900'
              }`}
            >
              <tr>
                <td className="py-3 px-3 text-center border-r border-slate-700/40 dark:border-zinc-800">
                  TOTAL
                </td>
                {mesesColumnas.map((mes) => {
                  const totalMes = matrizDatos.totalesMesCents[mes.numero] || 0;
                  return (
                    <td key={mes.numero} className="py-3 px-4 text-right font-extrabold">
                      {formatCurrency(totalMes)}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-right font-extrabold text-blue-400 dark:text-blue-300 bg-blue-600/10">
                  {formatCurrency(matrizDatos.granTotalVentasCents)}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-500 dark:text-emerald-400 bg-emerald-600/10">
                  {formatCurrency(matrizDatos.granTotalIgicCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Desglose Fiscal de IGIC (Modelo 420 Canario) */}
      <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${cardBgClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faShieldAlt} className="text-emerald-500" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Desglose Fiscal de IGIC por Tipo Impositivo ({tituloPeriodo})
          </h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Resumen de bases y cuotas impositivas según los tipos de gravamen de Canarias (0%, 3%, 7%, 9.5%, 15%), listo para la confección del Modelo 420 trimestral.
        </p>

        {desgloseFiscal.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No se han registrado operaciones sujetas a IGIC en este período.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase border-b text-[11px] font-bold ${
                  isDark ? 'text-slate-400 bg-zinc-900/60 border-zinc-800' : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3">Tipo Impositivo</th>
                  <th className="py-2.5 px-3 text-right">Base Imponible</th>
                  <th className="py-2.5 px-3 text-right">Cuota IGIC Repercutida</th>
                  <th className="py-2.5 px-3 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                {desgloseFiscal.map((item) => (
                  <tr key={item.rate} className={isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 font-bold text-blue-400">
                      {item.rate}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {formatCurrency(item.baseCents)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-500">
                      {formatCurrency(item.igicCents)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {formatCurrency(item.baseCents + item.igicCents)}
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

export default InformeDeVentasPage;
