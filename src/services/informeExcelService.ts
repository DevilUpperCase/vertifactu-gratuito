import * as XLSX from 'xlsx';

export interface MesColumna {
  numero: number; // 1 a 12
  nombre: string; // ej. "Enero"
}

export interface FilaMatrizVentas {
  dia: number; // 1 a 31
  ventasPorMes: { [numeroMes: number]: number }; // en céntimos
  totalDiaCents: number;
  totalIgicDiaCents: number;
}

export interface DesgloseIgicResumen {
  tipo: number; // ej. 0, 3, 7, 9.5, 15
  baseCents: number;
  cuotaCents: number;
}

export interface DatosInformeExcel {
  tituloPeriodo: string; // ej. "1T 2026 (Enero - Marzo)"
  anio: number;
  meses: MesColumna[];
  filas: FilaMatrizVentas[];
  totalesMesCents: { [numeroMes: number]: number };
  granTotalVentasCents: number;
  granTotalBaseCents: number;
  granTotalIgicCents: number;
  totalFacturas: number;
  desgloseIgic: DesgloseIgicResumen[];
  emisorNombre?: string;
  emisorNif?: string;
}

/**
 * Convierte céntimos a euros redondeados a 2 decimales para Excel
 */
function centsToEuro(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Genera y descarga el archivo Excel (.xlsx) con el informe de ventas diario y trimestral.
 */
export function exportarInformeExcelVentas(datos: DatosInformeExcel): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // HOJA 1: MATRIZ DIARIA DE VENTAS
  // -------------------------------------------------------------
  const aoaVentas: any[][] = [];

  // Metadatos de cabecera
  aoaVentas.push(['INFORME DE VENTAS POR DÍA Y MES']);
  aoaVentas.push(['Período:', datos.tituloPeriodo]);
  if (datos.emisorNombre) {
    aoaVentas.push(['Emisor:', `${datos.emisorNombre} (${datos.emisorNif || ''})`]);
  }
  aoaVentas.push(['Total Facturas Emitidas:', datos.totalFacturas]);
  aoaVentas.push([]); // Línea en blanco

  // Cabecera de la tabla principal
  const encabezadosTabla = [
    'Día',
    ...datos.meses.map((m) => m.nombre),
    'Total Ventas (€)',
    'Total IGIC (€)',
  ];
  aoaVentas.push(encabezadosTabla);

  // Filas del día 1 al 31
  for (const fila of datos.filas) {
    const filaExcel: any[] = [fila.dia];

    for (const mes of datos.meses) {
      const cents = fila.ventasPorMes[mes.numero] || 0;
      filaExcel.push(centsToEuro(cents));
    }

    filaExcel.push(centsToEuro(fila.totalDiaCents));
    filaExcel.push(centsToEuro(fila.totalIgicDiaCents));

    aoaVentas.push(filaExcel);
  }

  // Fila resumen de TOTALES
  const filaTotales: any[] = ['TOTAL'];
  for (const mes of datos.meses) {
    const totalMesCents = datos.totalesMesCents[mes.numero] || 0;
    filaTotales.push(centsToEuro(totalMesCents));
  }
  filaTotales.push(centsToEuro(datos.granTotalVentasCents));
  filaTotales.push(centsToEuro(datos.granTotalIgicCents));
  aoaVentas.push(filaTotales);

  // Crear la hoja de cálculo
  const wsVentas = XLSX.utils.aoa_to_sheet(aoaVentas);

  // Formato numérico para celdas monetarias (#,##0.00)
  const filaInicioDatos = 6; // Índice basado en 0 donde empiezan los días
  const filaFinDatos = filaInicioDatos + datos.filas.length; // Fila de TOTAL

  for (let r = filaInicioDatos; r <= filaFinDatos; r++) {
    for (let c = 1; c < encabezadosTabla.length; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      if (wsVentas[cellAddress]) {
        wsVentas[cellAddress].t = 'n';
        wsVentas[cellAddress].z = '#,##0.00';
      }
    }
  }

  // Ajuste de ancho de columnas
  const colWidths: { wch: number }[] = [
    { wch: 8 }, // Día
    ...datos.meses.map(() => ({ wch: 16 })), // Meses
    { wch: 18 }, // Total Ventas
    { wch: 18 }, // Total IGIC
  ];
  wsVentas['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas por Día');

  // -------------------------------------------------------------
  // HOJA 2: RESUMEN FISCAL E IMPOSITIVO (IGIC / IVA)
  // -------------------------------------------------------------
  const aoaFiscal: any[][] = [];
  aoaFiscal.push(['RESUMEN FISCAL DEL PERÍODO (IGIC / IVA)']);
  aoaFiscal.push(['Período:', datos.tituloPeriodo]);
  aoaFiscal.push([]);

  aoaFiscal.push(['Métrica General', 'Importe (€)']);
  aoaFiscal.push(['Base Imponible Total', centsToEuro(datos.granTotalBaseCents)]);
  aoaFiscal.push(['Total IGIC Repercutido', centsToEuro(datos.granTotalIgicCents)]);
  aoaFiscal.push(['Total Ventas (Base + IGIC)', centsToEuro(datos.granTotalVentasCents)]);
  aoaFiscal.push(['Número de Facturas', datos.totalFacturas]);
  aoaFiscal.push([]);

  aoaFiscal.push(['DESGLOSE POR TIPO IMPOSITIVO']);
  aoaFiscal.push(['Tipo IGIC (%)', 'Base Imponible (€)', 'Cuota Repercutida (€)', 'Total (€)']);

  if (datos.desgloseIgic.length === 0) {
    aoaFiscal.push(['Sin operaciones registradas', 0, 0, 0]);
  } else {
    for (const item of datos.desgloseIgic) {
      aoaFiscal.push([
        `${item.tipo}%`,
        centsToEuro(item.baseCents),
        centsToEuro(item.cuotaCents),
        centsToEuro(item.baseCents + item.cuotaCents),
      ]);
    }
  }

  const wsFiscal = XLSX.utils.aoa_to_sheet(aoaFiscal);
  wsFiscal['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 24 }, { wch: 20 }];

  const celdasFiscalFormatear = ['B4', 'B5', 'B6'];
  celdasFiscalFormatear.forEach((ref) => {
    if (wsFiscal[ref]) {
      wsFiscal[ref].t = 'n';
      wsFiscal[ref].z = '#,##0.00';
    }
  });

  const filaInicioDesglose = 9;
  for (let r = filaInicioDesglose; r < filaInicioDesglose + Math.max(1, datos.desgloseIgic.length); r++) {
    for (let c = 1; c <= 3; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      if (wsFiscal[cellAddress]) {
        wsFiscal[cellAddress].t = 'n';
        wsFiscal[cellAddress].z = '#,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsFiscal, 'Resumen Fiscal IGIC');

  // -------------------------------------------------------------
  // DESCARGA DEL ARCHIVO
  // -------------------------------------------------------------
  const sanitizedPeriod = datos.tituloPeriodo
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `Informe_Ventas_${sanitizedPeriod}.xlsx`;

  XLSX.writeFile(wb, filename);
}
