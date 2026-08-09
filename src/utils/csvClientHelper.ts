import { Client } from '../types';

export interface ParsedCsvResult {
  validClients: Omit<Client, 'id'>[];
  errors: string[];
  totalRows: number;
}

/**
 * Función para escapar valores CSV de forma segura en caso de que contengan comillas o delimitadores.
 */
function escapeCsvCell(value: string | number | boolean | null | undefined, delimiter: string = ';'): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Exporta el listado de clientes recibidos a un archivo CSV descargable con BOM UTF-8.
 */
export function exportClientsToCsv(clients: Client[], fileName: string = 'clientes.csv'): void {
  const delimiter = ';';
  const headers = ['nif', 'nombre', 'direccion', 'email', 'retencion_irpf'];
  
  const rows = clients.map((c) => [
    escapeCsvCell(c.nif, delimiter),
    escapeCsvCell(c.name, delimiter),
    escapeCsvCell(c.address || '', delimiter),
    escapeCsvCell(c.email || '', delimiter),
    c.default_retention_irpf ? 'Sí' : 'No',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM para compatibilidad con Excel en español
    headers.join(delimiter) +
    '\n' +
    rows.map((row) => row.join(delimiter)).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga una plantilla CSV de ejemplo para la importación de clientes.
 */
export function generateClientCsvTemplate(): void {
  const sampleClients: Omit<Client, 'id'>[] = [
    {
      nif: 'B35999999',
      name: 'Empresa Ejemplo Canarias S.L.',
      address: 'Av. Marítima 10, Las Palmas de Gran Canaria',
      email: 'contacto@ejemplocanarias.es',
      default_retention_irpf: false,
    },
    {
      nif: '12345678Z',
      name: 'Juan Pérez Rodríguez (Autónomo)',
      address: 'Calle Triana 45, Las Palmas',
      email: 'juan.perez@email.com',
      default_retention_irpf: true,
    },
  ];

  exportClientsToCsv(sampleClients as Client[], 'plantilla_clientes.csv');
}

/**
 * Parsea una línea de texto CSV respetando comillas.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Saltar comilla escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Analiza y valida el contenido de un archivo CSV de clientes.
 */
export function parseAndValidateClientCsv(csvContent: string): ParsedCsvResult {
  const errors: string[] = [];
  const validClients: Omit<Client, 'id'>[] = [];

  // Eliminar BOM si estuviese presente
  const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
  if (!cleanContent) {
    return { validClients: [], errors: ['El archivo CSV está vacío.'], totalRows: 0 };
  }

  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { validClients: [], errors: ['El archivo no contiene filas válidas.'], totalRows: 0 };
  }

  // Detectar delimitador (punto y coma o coma)
  const headerLine = lines[0];
  const countSemicolons = (headerLine.match(/;/g) || []).length;
  const countCommas = (headerLine.match(/,/g) || []).length;
  const delimiter = countSemicolons >= countCommas ? ';' : ',';

  const rawHeaders = parseCsvLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Mapear nombres de columnas a claves de la entidad Cliente
  const findHeaderIndex = (...aliases: string[]): number => {
    return rawHeaders.findIndex((h) => aliases.includes(h));
  };

  const nifIdx = findHeaderIndex('nif', 'cif', 'documento', 'nifcif');
  const nameIdx = findHeaderIndex('nombre', 'name', 'razonsocial', 'razon_social', 'cliente');
  const addressIdx = findHeaderIndex('direccion', 'address', 'direccionfiscal', 'direccion_fiscal');
  const emailIdx = findHeaderIndex('email', 'correo', 'mail', 'correoelectronico');
  const retentionIdx = findHeaderIndex('retencion_irpf', 'irpf', 'retencion', 'retencionirpf');

  if (nifIdx === -1) {
    errors.push('Falta la columna obligatoria de NIF / CIF en la cabecera del CSV.');
  }
  if (nameIdx === -1) {
    errors.push('Falta la columna obligatoria de Nombre / Razón Social en la cabecera del CSV.');
  }

  if (errors.length > 0) {
    return { validClients: [], errors, totalRows: lines.length - 1 };
  }

  const dataLines = lines.slice(1);

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2; // +2 considerando cabecera (1-indexed)
    const columns = parseCsvLine(line, delimiter);

    const nif = columns[nifIdx] ? columns[nifIdx].trim() : '';
    const name = columns[nameIdx] ? columns[nameIdx].trim() : '';
    const address = addressIdx !== -1 && columns[addressIdx] ? columns[addressIdx].trim() : '';
    const email = emailIdx !== -1 && columns[emailIdx] ? columns[emailIdx].trim() : '';
    const rawRetention = retentionIdx !== -1 && columns[retentionIdx] ? columns[retentionIdx].trim().toLowerCase() : '';

    const lineErrors: string[] = [];
    if (!nif) {
      lineErrors.push(`Fila ${lineNumber}: El campo NIF/CIF es obligatorio.`);
    }
    if (!name) {
      lineErrors.push(`Fila ${lineNumber}: El campo Nombre / Razón Social es obligatorio.`);
    }

    if (lineErrors.length > 0) {
      errors.push(...lineErrors);
    } else {
      // Interpretar valor de IRPF
      const default_retention_irpf = ['si', 'sí', '1', 'true', '15', '15%'].includes(rawRetention);

      validClients.push({
        nif: nif.toUpperCase(),
        name,
        address,
        email,
        default_retention_irpf,
      });
    }
  });

  return {
    validClients,
    errors,
    totalRows: dataLines.length,
  };
}
