import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatosInformeExcel } from './informeExcelService';
import { formatCurrency } from '../utils/currency';
import { formatearFechaHoraEspanola } from '../utils/fechas';

/**
 * Genera y descarga el informe de ventas en formato PDF profesional.
 */
export function exportarInformePdfVentas(datos: DatosInformeExcel): void {
  // Si hay más de 4 meses seleccionados, usamos orientación apaisada (landscape)
  const orientation = datos.meses.length > 4 ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = '#0055ff'; // Azul Taratic
  const darkTextColor = '#0f172a';
  const lightTextColor = '#64748b';

  // 1. Cabecera superior decorativa
  doc.setFillColor(245, 247, 252);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.text('INFORME DE VENTAS Y FACTURACIÓN', 14, 16);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkTextColor);
  doc.text(`Período: ${datos.tituloPeriodo}`, 14, 23);

  // Información del Emisor en la esquina derecha
  if (datos.emisorNombre) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkTextColor);
    doc.text(datos.emisorNombre, pageWidth - 14, 15, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(lightTextColor);
    if (datos.emisorNif) {
      doc.text(`NIF/CIF: ${datos.emisorNif}`, pageWidth - 14, 20, { align: 'right' });
    }
    doc.text(`Facturas emitidas: ${datos.totalFacturas}`, pageWidth - 14, 25, { align: 'right' });
  }

  // Línea divisoria
  doc.setDrawColor(0, 85, 255);
  doc.setLineWidth(0.8);
  doc.line(14, 38, pageWidth - 14, 38);

  // 2. Tarjetas de Resumen Ejecutivo (4 bloques)
  const startYMetrics = 43;
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 16;

  const metricas = [
    { label: 'VENTAS TOTALES', valor: formatCurrency(datos.granTotalVentasCents), color: primaryColor },
    { label: 'BASE IMPONIBLE', valor: formatCurrency(datos.granTotalBaseCents), color: '#0891b2' },
    { label: 'IGIC REPERCUTIDO', valor: formatCurrency(datos.granTotalIgicCents), color: '#059669' },
    { label: 'Nº FACTURAS', valor: datos.totalFacturas.toString(), color: '#d97706' },
  ];

  metricas.forEach((m, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startYMetrics, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(m.color);
    doc.text(m.label, x + 3, startYMetrics + 5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor);
    doc.text(m.valor, x + 3, startYMetrics + 12);
  });

  // 3. Tabla Matriz Diaria de Ventas
  const tableHeaders = [
    'Día',
    ...datos.meses.map((m) => m.nombre),
    'Total Ventas',
    'Total IGIC',
  ];

  const tableBody = datos.filas.map((fila) => {
    const row: string[] = [fila.dia.toString()];

    for (const mes of datos.meses) {
      const val = fila.ventasPorMes[mes.numero] || 0;
      row.push(val !== 0 ? formatCurrency(val) : '-');
    }

    row.push(fila.totalDiaCents !== 0 ? formatCurrency(fila.totalDiaCents) : '-');
    row.push(fila.totalIgicDiaCents !== 0 ? formatCurrency(fila.totalIgicDiaCents) : '-');

    return row;
  });

  // Fila de totales
  const tableFoot: string[][] = [
    [
      'TOTAL',
      ...datos.meses.map((m) => {
        const val = datos.totalesMesCents[m.numero] || 0;
        return formatCurrency(val);
      }),
      formatCurrency(datos.granTotalVentasCents),
      formatCurrency(datos.granTotalIgicCents),
    ],
  ];

  autoTable(doc, {
    startY: startYMetrics + boxHeight + 6,
    head: [tableHeaders],
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 85, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      halign: 'right',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'right',
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
  });

  // 4. Tabla de Desglose Fiscal de IGIC
  const finalYMatriz = (doc as any).lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Si queda poco espacio en la página, añadimos página nueva
  if (finalYMatriz > pageHeight - 50) {
    doc.addPage();
  }

  const startYFiscal = doc.getCurrentPageInfo().pageNumber > 1 && finalYMatriz > pageHeight - 50 ? 20 : finalYMatriz;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor);
  doc.text('Desglose Fiscal de IGIC (Preparación Modelo 420)', 14, startYFiscal);

  const fiscalHeaders = ['Tipo IGIC (%)', 'Base Imponible (€)', 'Cuota IGIC (€)', 'Total Facturado (€)'];
  const fiscalBody = datos.desgloseIgic.map((d) => [
    `${d.tipo}%`,
    formatCurrency(d.baseCents),
    formatCurrency(d.cuotaCents),
    formatCurrency(d.baseCents + d.cuotaCents),
  ]);

  if (fiscalBody.length === 0) {
    fiscalBody.push(['Sin operaciones registradas', '0,00 €', '0,00 €', '0,00 €']);
  }

  autoTable(doc, {
    startY: startYFiscal + 3,
    head: [fiscalHeaders],
    body: fiscalBody,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // Esmeralda
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      halign: 'right',
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Pie de página en todas las páginas
  const totalPaginas = doc.getNumberOfPages();
  const fechaGeneracion = formatearFechaHoraEspanola(new Date().toISOString());

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Generado el ${fechaGeneracion} • Verifactu Gratuito - Taratic`,
      14,
      pageHeight - 8
    );

    doc.text(
      `Página ${i} de ${totalPaginas}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Descargar el PDF
  const sanitizedPeriod = datos.tituloPeriodo
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  doc.save(`Informe_Ventas_${sanitizedPeriod}.pdf`);
}
