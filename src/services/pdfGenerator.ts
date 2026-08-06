import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Settings } from '../types';
import { calculateInvoiceSummary, calculateLineTotals, formatCurrency } from '../utils/currency';

export interface PdfOptions {
  showExcludingIgicColumn: boolean;
  qrCodeDataUrl?: string;
  xmlHash?: string;
}

/**
 * Genera un PDF profesional de factura utilizando jsPDF y jspdf-autotable.
 */
export function generateInvoicePdf(
  invoice: Invoice,
  settings: Settings,
  options: PdfOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = '#4f46e5'; // Indigo accent
  const darkTextColor = '#0f172a';
  const lightTextColor = '#64748b';

  // 1. Cabecera - Datos del Emisor y Título
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text('FACTURA', 14, 20);

  if (invoice.is_rectification) {
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text('RECTIFICATIVA / ABONO', 14, 27);
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkTextColor);
  doc.text(settings.issuer_name || 'Empresa Emisora', 130, 15);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightTextColor);
  doc.text(`NIF/CIF: ${settings.issuer_nif}`, 130, 21);
  doc.text(settings.issuer_address || '', 130, 26, { maxWidth: 65 });
  doc.text(`IBAN: ${settings.issuer_iban || ''}`, 130, 34);

  // Línea divisoria decorativa
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(14, 42, 196, 42);

  // 2. Metadatos de la Factura y Cliente
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor);
  doc.text('DATOS DE LA FACTURA', 14, 52);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightTextColor);
  doc.text(`Número de Factura:`, 14, 58);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(darkTextColor);
  doc.text(invoice.invoice_number, 50, 58);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(lightTextColor);
  doc.text(`Fecha de Emisión:`, 14, 64);
  doc.setTextColor(darkTextColor);
  doc.text(invoice.issue_date, 50, 64);

  if (invoice.due_date) {
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(lightTextColor);
    doc.text(`Fecha Vencimiento:`, 14, 70);
    doc.setTextColor(darkTextColor);
    doc.text(invoice.due_date, 50, 70);
  }

  // Cuadro del Cliente (Derecha)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, 48, 76, 28, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor);
  doc.text('CLIENTE / DESTINATARIO', 125, 54);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor);
  doc.text(invoice.client_name || 'Cliente Demo', 125, 60);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(lightTextColor);
  doc.text(`NIF: ${invoice.client_nif || ''}`, 125, 65);
  doc.text(invoice.client_address || '', 125, 70, { maxWidth: 68 });

  // 3. Tabla de Líneas de Concepto
  const lines = invoice.lines || [];

  // Definición de columnas según la opción "Mostrar columna Sin IGIC"
  const tableHeaders = options.showExcludingIgicColumn
    ? ['Concepto', 'Cant.', 'P. Unitario', 'Desc.', 'Base sin IGIC', 'IGIC %', 'Total Linea']
    : ['Concepto', 'Cant.', 'P. Unitario', 'Desc.', 'IGIC %', 'Total Linea'];

  const tableBody = lines.map((line) => {
    const { lineBaseCents, totalLineCents } = calculateLineTotals(
      line.quantity,
      line.unit_price,
      line.discount,
      line.igic_rate
    );

    if (options.showExcludingIgicColumn) {
      return [
        line.concept,
        line.quantity.toString(),
        formatCurrency(line.unit_price),
        line.discount > 0 ? `${line.discount}%` : '-',
        formatCurrency(lineBaseCents),
        `${line.igic_rate}%`,
        formatCurrency(totalLineCents),
      ];
    } else {
      return [
        line.concept,
        line.quantity.toString(),
        formatCurrency(line.unit_price),
        line.discount > 0 ? `${line.discount}%` : '-',
        `${line.igic_rate}%`,
        formatCurrency(totalLineCents),
      ];
    }
  });

  autoTable(doc, {
    startY: 82,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: options.showExcludingIgicColumn
      ? {
          0: { cellWidth: 55 },
          1: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right', cellWidth: 25 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'right', cellWidth: 26 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'right', cellWidth: 28 },
        }
      : {
          0: { cellWidth: 70 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 30 },
        },
    margin: { left: 14, right: 14 },
  });

  // Posición Y tras la tabla
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Desglose Impositivo y Totales (Derecha)
  const summary = calculateInvoiceSummary(lines);

  const startXTotals = 120;
  let currentY = finalY;

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(lightTextColor);

  doc.text('Base Imponible Total:', startXTotals, currentY);
  doc.setTextColor(darkTextColor);
  doc.text(formatCurrency(invoice.total_base), 196, currentY, { align: 'right' });
  currentY += 5;

  // Desglose IGIC por tipos
  for (const b of summary.igicBreakdown) {
    doc.setTextColor(lightTextColor);
    doc.text(`Cuota IGIC (${b.rate}% sobre ${formatCurrency(b.baseCents)}):`, startXTotals, currentY);
    doc.setTextColor(darkTextColor);
    doc.text(formatCurrency(b.igicCents), 196, currentY, { align: 'right' });
    currentY += 5;
  }

  if (invoice.total_irpf > 0) {
    doc.setTextColor(lightTextColor);
    doc.text('Retención IRPF:', startXTotals, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(invoice.total_irpf)}`, 196, currentY, { align: 'right' });
    currentY += 5;
  }

  // Recuadro del Total General
  currentY += 2;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(startXTotals - 2, currentY - 4, 78, 10, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text('TOTAL FACTURA:', startXTotals + 2, currentY + 3);
  doc.text(formatCurrency(invoice.grand_total), 194, currentY + 3, { align: 'right' });

  // 5. Sección Verifactu & Código QR (Izquierda inferior)
  if (options.qrCodeDataUrl) {
    const qrY = finalY;
    doc.addImage(options.qrCodeDataUrl, 'PNG', 14, qrY, 32, 32);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor);
    doc.text('VERIFACTU - AEAT', 49, qrY + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(lightTextColor);
    doc.text('Factura verificable en la Sede Electrónica de la AEAT.', 49, qrY + 11);
    doc.text('Cumplimiento inalterable de la Ley Antifraude.', 49, qrY + 15);

    if (options.xmlHash) {
      doc.setFont('Courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Huella SHA-256: ${options.xmlHash.substring(0, 32)}...`, 49, qrY + 21);
    }
  }

  // Pie de página
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Facturalia Canarias IGIC - Documento generado automáticamente acorde a la normativa fiscal de Canarias y Ley Antifraude Verifactu`,
    105,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}
