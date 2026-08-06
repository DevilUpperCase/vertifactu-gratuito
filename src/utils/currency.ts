import { IgicBreakdownItem, InvoiceLine } from '../types';

/**
 * Convierte un importe en céntimos a una cadena formateada en euros con formato español (ej. "1.250,00 €").
 */
export function formatCurrency(cents: number): string {
  const euros = (cents || 0) / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Convierte un número o cadena en euros a un entero exacto en céntimos para evitar desbordamiento flotante.
 */
export function parseEuroToCents(amount: number | string): number {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  const cleanStr = amount.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/**
 * Convierte un valor en céntimos a número flotante en euros para campos de entrada del formulario.
 */
export function centsToEuroNumber(cents: number): number {
  return (cents || 0) / 100;
}

/**
 * Calcula el desglose de una línea de factura en céntimos.
 */
export function calculateLineTotals(
  quantity: number,
  unitPriceCents: number,
  discountPercent: number,
  igicRatePercent: number
): { lineBaseCents: number; lineIgicCents: number; totalLineCents: number } {
  const rawTotal = (quantity || 0) * (unitPriceCents || 0);
  const discountAmount = Math.round(rawTotal * ((discountPercent || 0) / 100));
  const lineBaseCents = rawTotal - discountAmount;
  const lineIgicCents = Math.round(lineBaseCents * ((igicRatePercent || 0) / 100));
  const totalLineCents = lineBaseCents + lineIgicCents;

  return { lineBaseCents, lineIgicCents, totalLineCents };
}

/**
 * Calcula los totales generales de la factura e incluye el desglose por tipo de IGIC.
 */
export function calculateInvoiceSummary(
  lines: InvoiceLine[],
  irpfPercent: number = 0
): {
  totalBaseCents: number;
  totalIgicCents: number;
  totalIrpfCents: number;
  grandTotalCents: number;
  igicBreakdown: IgicBreakdownItem[];
} {
  let totalBaseCents = 0;
  let totalIgicCents = 0;
  const breakdownMap = new Map<number, { baseCents: number; igicCents: number }>();

  for (const line of lines) {
    const { lineBaseCents, lineIgicCents } = calculateLineTotals(
      line.quantity,
      line.unit_price,
      line.discount,
      line.igic_rate
    );

    totalBaseCents += lineBaseCents;
    totalIgicCents += lineIgicCents;

    const current = breakdownMap.get(line.igic_rate) || { baseCents: 0, igicCents: 0 };
    breakdownMap.set(line.igic_rate, {
      baseCents: current.baseCents + lineBaseCents,
      igicCents: current.igicCents + lineIgicCents,
    });
  }

  const totalIrpfCents = Math.round(totalBaseCents * ((irpfPercent || 0) / 100));
  const grandTotalCents = totalBaseCents + totalIgicCents - totalIrpfCents;

  const igicBreakdown: IgicBreakdownItem[] = Array.from(breakdownMap.entries()).map(([rate, data]) => ({
    rate,
    baseCents: data.baseCents,
    igicCents: data.igicCents,
  }));

  return {
    totalBaseCents,
    totalIgicCents,
    totalIrpfCents,
    grandTotalCents,
    igicBreakdown,
  };
}
