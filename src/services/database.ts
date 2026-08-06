import initSqlJsFn, { Database, SqlJsStatic } from 'sql.js';
import { AuditLogEntry, Client, Invoice, InvoiceLine, Settings } from '../types';

// Fallback compatible para la exportación de sql.js en Vite
const initSqlJs = (initSqlJsFn as any)?.default || initSqlJsFn;

const DB_FILENAME = 'invoices_app.db';
let dbInstance: Database | null = null;
let sqlJsStatic: SqlJsStatic | null = null;

// Extensión para la interfaz de Neutralino global
declare global {
  interface Window {
    Neutralino?: any;
  }
}

/**
 * Detecta si la app corre bajo el runtime nativo de Neutralino (neu run / neu build).
 * En desarrollo Vite (navegador puro), el objeto Neutralino existe pero NO hay host
 * nativo, por lo que las llamadas a API nativa fallarían con NE_RT_APIPRME.
 * El runtime nativo inyecta NL_TOKEN/NL_PORT como globales.
 */
const isNativeRuntime = (): boolean =>
  Boolean(window.Neutralino && window.NL_TOKEN);

/**
 * Script de creación e inicialización de tablas.
 */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    issuer_nif TEXT NOT NULL DEFAULT '',
    issuer_name TEXT NOT NULL DEFAULT '',
    issuer_address TEXT NOT NULL DEFAULT '',
    issuer_iban TEXT NOT NULL DEFAULT '',
    default_igic_rate REAL NOT NULL DEFAULT 7.0,
    verifactu_enabled INTEGER NOT NULL DEFAULT 0,
    cert_path TEXT DEFAULT '',
    cert_password TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS Clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nif TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    default_retention_irpf INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS Invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT DEFAULT '',
    status TEXT CHECK(status IN ('Borrador', 'Pendiente', 'Pagada', 'Anulada')) DEFAULT 'Borrador',
    verifactu_status TEXT CHECK(verifactu_status IN ('N/A', 'Pendiente', 'Firmado', 'Enviado')) DEFAULT 'N/A',
    total_base INTEGER NOT NULL DEFAULT 0,
    total_igic INTEGER NOT NULL DEFAULT 0,
    total_irpf INTEGER NOT NULL DEFAULT 0,
    grand_total INTEGER NOT NULL DEFAULT 0,
    is_rectification INTEGER DEFAULT 0,
    original_invoice_id INTEGER DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(client_id) REFERENCES Clients(id)
);

CREATE TABLE IF NOT EXISTS InvoiceLines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    concept TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    igic_rate REAL NOT NULL DEFAULT 7.0,
    total_line INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AuditLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    invoice_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    xml_hash TEXT NOT NULL
);

INSERT INTO Settings (id, issuer_nif, issuer_name, issuer_address, issuer_iban, default_igic_rate, verifactu_enabled)
SELECT 1, 'B35000000', 'Empresa Demo Canarias S.L.', 'Calle Triana 45, Las Palmas de Gran Canaria', 'ES91 2100 0418 4502 0005 1234', 7.0, 0
WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE id = 1);

INSERT INTO Clients (id, nif, name, address, email, default_retention_irpf)
SELECT 1, 'B35999999', 'Cliente Principal Canarias S.L.', 'Av. Marítima 1, Las Palmas de Gran Canaria', 'contacto@clienteprincipal.es', 0
WHERE NOT EXISTS (SELECT 1 FROM Clients);
`;

/**
 * Guarda el estado binario de la base de datos en el sistema de archivos local via NeutralinoJS o localStorage.
 */
export async function autoSave(): Promise<void> {
  if (!dbInstance) return;
  try {
    const data: Uint8Array = dbInstance.export();
    if (isNativeRuntime() && window.Neutralino.filesystem) {
      // Neutralino filesystem.writeBinaryFile admite ArrayBuffer o Uint8Array
      await window.Neutralino.filesystem.writeBinaryFile(DB_FILENAME, data.buffer);
      console.log('Facturalia DB guardada en el disco mediante NeutralinoJS');
    } else {
      // Fallback a localStorage para entorno de navegador
      const binaryString = Array.from(data)
        .map((byte) => String.fromCharCode(byte))
        .join('');
      localStorage.setItem('invoices_app_db_fallback', btoa(binaryString));
      console.log('Facturalia DB guardada en localStorage fallback');
    }
  } catch (err) {
    console.error('Error durante autoSave DB:', err);
  }
}

/**
 * Inicializa sql.js y carga la base de datos desde el sistema de archivos de Neutralino.
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  sqlJsStatic = await initSqlJs({
    locateFile: (file: string) => `/${file}`,
  });

  if (!sqlJsStatic) {
    throw new Error('No se pudo inicializar la librería sql.js');
  }

  let fileBuffer: ArrayBuffer | null = null;

  if (isNativeRuntime() && window.Neutralino.filesystem) {
    try {
      fileBuffer = await window.Neutralino.filesystem.readBinaryFile(DB_FILENAME);
      console.log('Archivo de base de datos cargado desde disco local');
    } catch (err) {
      console.warn('Base de datos no encontrada en disco local. Se creará una nueva:', err);
    }
  } else {
    const fallbackStr = localStorage.getItem('invoices_app_db_fallback');
    if (fallbackStr) {
      const binaryString = atob(fallbackStr);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileBuffer = bytes.buffer;
    }
  }

  if (fileBuffer && fileBuffer.byteLength > 0) {
    dbInstance = new sqlJsStatic.Database(new Uint8Array(fileBuffer));
  } else {
    dbInstance = new sqlJsStatic.Database();
  }

  // Ejecución de scripts SQL de inicialización
  dbInstance.run(SCHEMA_SQL);
  await autoSave();

  return dbInstance;
}

/**
 * Obtiene la configuración del emisor.
 */
export async function getSettings(): Promise<Settings> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM Settings WHERE id = 1');
  if (res.length === 0 || res[0].values.length === 0) {
    return {
      id: 1,
      issuer_nif: 'B35000000',
      issuer_name: 'Empresa Demo Canarias S.L.',
      issuer_address: 'Calle Triana 45, Las Palmas',
      issuer_iban: 'ES91 2100 0418 4502 0005 1234',
      default_igic_rate: 7.0,
      verifactu_enabled: false,
      cert_path: '',
      cert_password: '',
    };
  }

  const cols = res[0].columns;
  const row = res[0].values[0];
  const settingsObj: any = {};
  cols.forEach((col, idx) => {
    settingsObj[col] = row[idx];
  });

  return {
    ...settingsObj,
    verifactu_enabled: Boolean(settingsObj.verifactu_enabled),
  };
}

/**
 * Guarda o actualiza la configuración del emisor.
 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const db = await initDatabase();
  const current = await getSettings();
  const updated = { ...current, ...settings };

  db.run(
    `UPDATE Settings SET 
      issuer_nif = ?, 
      issuer_name = ?, 
      issuer_address = ?, 
      issuer_iban = ?, 
      default_igic_rate = ?, 
      verifactu_enabled = ?, 
      cert_path = ?, 
      cert_password = ? 
    WHERE id = 1`,
    [
      updated.issuer_nif,
      updated.issuer_name,
      updated.issuer_address,
      updated.issuer_iban,
      updated.default_igic_rate,
      updated.verifactu_enabled ? 1 : 0,
      updated.cert_path || '',
      updated.cert_password || '',
    ]
  );
  await autoSave();
}

/**
 * Lista todos los clientes.
 */
/**
 * Lista todos los clientes. Garantiza que siempre exista al menos un cliente por defecto.
 */
export async function getClients(): Promise<Client[]> {
  const db = await initDatabase();
  let res = db.exec('SELECT * FROM Clients ORDER BY id ASC');

  if (res.length === 0 || res[0].values.length === 0) {
    db.run(
      `INSERT INTO Clients (id, nif, name, address, email, default_retention_irpf) VALUES (1, 'B35999999', 'Cliente Principal Canarias S.L.', 'Av. Marítima 1, Las Palmas de Gran Canaria', 'contacto@clienteprincipal.es', 0)`
    );
    await autoSave();
    res = db.exec('SELECT * FROM Clients ORDER BY id ASC');
  }

  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return {
      ...obj,
      default_retention_irpf: Boolean(obj.default_retention_irpf),
    };
  });
}

/**
 * Crea o actualiza un cliente.
 */
export async function saveClient(client: Omit<Client, 'id'> & { id?: number }): Promise<number> {
  const db = await initDatabase();
  if (client.id) {
    db.run(
      `UPDATE Clients SET nif = ?, name = ?, address = ?, email = ?, default_retention_irpf = ? WHERE id = ?`,
      [client.nif, client.name, client.address || '', client.email || '', client.default_retention_irpf ? 1 : 0, client.id]
    );
    await autoSave();
    return client.id;
  } else {
    db.run(
      `INSERT INTO Clients (nif, name, address, email, default_retention_irpf) VALUES (?, ?, ?, ?, ?)`,
      [client.nif, client.name, client.address || '', client.email || '', client.default_retention_irpf ? 1 : 0]
    );
    const lastIdRes = db.exec('SELECT last_insert_rowid()');
    const newId = lastIdRes[0].values[0][0] as number;
    await autoSave();
    return newId;
  }
}

/**
 * Elimina un cliente, impidiendo la eliminación si es el cliente por defecto o el único existente.
 */
export async function deleteClient(id: number): Promise<{ success: boolean; message: string }> {
  const db = await initDatabase();
  const clients = await getClients();

  if (clients.length <= 1) {
    return {
      success: false,
      message: 'Operación denegada: Debe existir siempre al menos un cliente en el sistema.',
    };
  }

  if (id === 1) {
    return {
      success: false,
      message: 'Operación denegada: El cliente por defecto (ID 1) no se puede eliminar.',
    };
  }

  // Verificar si el cliente tiene facturas asociadas
  const invoicesRes = db.exec('SELECT COUNT(*) FROM Invoices WHERE client_id = ?', [id]);
  const invoiceCount = (invoicesRes.length > 0 && invoicesRes[0].values.length > 0) ? (invoicesRes[0].values[0][0] as number) : 0;
  if (invoiceCount > 0) {
    return {
      success: false,
      message: `No se puede eliminar este cliente porque tiene ${invoiceCount} factura(s) asociada(s).`,
    };
  }

  db.run('DELETE FROM Clients WHERE id = ?', [id]);
  await autoSave();
  return { success: true, message: 'Cliente eliminado correctamente' };
}

/**
 * Obtiene el listado de facturas con datos del cliente asociado.
 */
export async function getInvoices(): Promise<Invoice[]> {
  const db = await initDatabase();
  const query = `
    SELECT 
      i.*, 
      c.name as client_name, 
      c.nif as client_nif, 
      c.address as client_address
    FROM Invoices i
    LEFT JOIN Clients c ON i.client_id = c.id
    ORDER BY i.id DESC
  `;
  const res = db.exec(query);
  if (res.length === 0) return [];

  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return {
      ...obj,
      is_rectification: Boolean(obj.is_rectification),
    };
  });
}

/**
 * Obtiene una factura completa con sus líneas de detalle.
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const db = await initDatabase();
  const query = `
    SELECT 
      i.*, 
      c.name as client_name, 
      c.nif as client_nif, 
      c.address as client_address
    FROM Invoices i
    LEFT JOIN Clients c ON i.client_id = c.id
    WHERE i.id = ?
  `;
  const res = db.exec(query, [id]);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const cols = res[0].columns;
  const row = res[0].values[0];
  const invoiceObj: any = {};
  cols.forEach((col, idx) => {
    invoiceObj[col] = row[idx];
  });

  // Carga de líneas
  const linesRes = db.exec('SELECT * FROM InvoiceLines WHERE invoice_id = ? ORDER BY id ASC', [id]);
  let lines: InvoiceLine[] = [];
  if (linesRes.length > 0) {
    const lineCols = linesRes[0].columns;
    lines = linesRes[0].values.map((lRow) => {
      const lObj: any = {};
      lineCols.forEach((col, idx) => {
        lObj[col] = lRow[idx];
      });
      return lObj;
    });
  }

  return {
    ...invoiceObj,
    is_rectification: Boolean(invoiceObj.is_rectification),
    lines,
  };
}

/**
 * Genera el siguiente número de factura secuencial para el año actual (ej. 2026-001).
 */
export async function generateNextInvoiceNumber(isRectification: boolean = false): Promise<string> {
  const db = await initDatabase();
  const year = new Date().getFullYear();
  const prefix = isRectification ? `REC-${year}-` : `${year}-`;

  const res = db.exec(
    `SELECT invoice_number FROM Invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (res.length === 0 || res[0].values.length === 0) {
    return `${prefix}001`;
  }

  const lastNumStr = res[0].values[0][0] as string;
  const parts = lastNumStr.split('-');
  const seq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(seq) ? 1 : seq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Guarda o actualiza una factura y sus líneas.
 */
export async function saveInvoice(
  invoice: Omit<Invoice, 'id'> & { id?: number },
  lines: InvoiceLine[]
): Promise<number> {
  const db = await initDatabase();
  let invoiceId = invoice.id;

  if (invoiceId) {
    db.run(
      `UPDATE Invoices SET 
        invoice_number = ?, 
        client_id = ?, 
        issue_date = ?, 
        due_date = ?, 
        status = ?, 
        verifactu_status = ?, 
        total_base = ?, 
        total_igic = ?, 
        total_irpf = ?, 
        grand_total = ?, 
        is_rectification = ?, 
        original_invoice_id = ? 
      WHERE id = ?`,
      [
        invoice.invoice_number,
        invoice.client_id,
        invoice.issue_date,
        invoice.due_date || '',
        invoice.status,
        invoice.verifactu_status || 'N/A',
        invoice.total_base,
        invoice.total_igic,
        invoice.total_irpf,
        invoice.grand_total,
        invoice.is_rectification ? 1 : 0,
        invoice.original_invoice_id || null,
        invoiceId,
      ]
    );
    db.run('DELETE FROM InvoiceLines WHERE invoice_id = ?', [invoiceId]);
  } else {
    db.run(
      `INSERT INTO Invoices (
        invoice_number, client_id, issue_date, due_date, status, verifactu_status, 
        total_base, total_igic, total_irpf, grand_total, is_rectification, original_invoice_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.invoice_number,
        invoice.client_id,
        invoice.issue_date,
        invoice.due_date || '',
        invoice.status,
        invoice.verifactu_status || 'N/A',
        invoice.total_base,
        invoice.total_igic,
        invoice.total_irpf,
        invoice.grand_total,
        invoice.is_rectification ? 1 : 0,
        invoice.original_invoice_id || null,
      ]
    );
    const lastIdRes = db.exec('SELECT last_insert_rowid()');
    invoiceId = lastIdRes[0].values[0][0] as number;
  }

  // Insertar líneas
  for (const line of lines) {
    db.run(
      `INSERT INTO InvoiceLines (invoice_id, concept, quantity, unit_price, discount, igic_rate, total_line) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, line.concept, line.quantity, line.unit_price, line.discount, line.igic_rate, line.total_line]
    );
  }

  await autoSave();
  return invoiceId;
}

/**
 * Elimina una factura (solo permitido si está en estado Borrador o si Verifactu no exige bloqueo estricto).
 */
export async function deleteInvoice(id: number): Promise<{ success: boolean; message: string }> {
  const db = await initDatabase();
  const settings = await getSettings();
  const inv = await getInvoiceById(id);

  if (!inv) return { success: false, message: 'Factura no encontrada' };

  if (settings.verifactu_enabled && inv.status !== 'Borrador') {
    return {
      success: false,
      message: 'Normativa Verifactu: No se pueden eliminar facturas emitidas. Debe generar una Factura Rectificativa.',
    };
  }

  db.run('DELETE FROM InvoiceLines WHERE invoice_id = ?', [id]);
  db.run('DELETE FROM Invoices WHERE id = ?', [id]);
  await autoSave();
  return { success: true, message: 'Factura eliminada correctamente' };
}

/**
 * Duplicado rápido de plantilla de factura asignando un nuevo cliente.
 */
export async function duplicateInvoiceAsTemplate(invoiceId: number, newClientId: number): Promise<number> {
  const original = await getInvoiceById(invoiceId);
  if (!original) throw new Error('Factura original no encontrada');

  const nextNum = await generateNextInvoiceNumber(false);
  const today = new Date().toISOString().split('T')[0];

  const newInvoiceData: Omit<Invoice, 'id'> = {
    invoice_number: nextNum,
    client_id: newClientId,
    issue_date: today,
    due_date: today,
    status: 'Borrador',
    verifactu_status: 'N/A',
    total_base: original.total_base,
    total_igic: original.total_igic,
    total_irpf: original.total_irpf,
    grand_total: original.grand_total,
    is_rectification: false,
    original_invoice_id: null,
  };

  const cleanLines = (original.lines || []).map((l) => ({
    concept: l.concept,
    quantity: l.quantity,
    unit_price: l.unit_price,
    discount: l.discount,
    igic_rate: l.igic_rate,
    total_line: l.total_line,
  }));

  return await saveInvoice(newInvoiceData, cleanLines);
}

/**
 * Genera una factura rectificativa para abonar o corregir una factura emitida.
 */
export async function createRectificationInvoice(originalInvoiceId: number): Promise<number> {
  const original = await getInvoiceById(originalInvoiceId);
  if (!original) throw new Error('Factura original no encontrada');

  const rectNum = await generateNextInvoiceNumber(true);
  const today = new Date().toISOString().split('T')[0];

  // Invertir importes para abono rectificativo
  const rectLines: InvoiceLine[] = (original.lines || []).map((l) => ({
    concept: `Rectificación de factura ${original.invoice_number}: ${l.concept}`,
    quantity: -Math.abs(l.quantity),
    unit_price: l.unit_price,
    discount: l.discount,
    igic_rate: l.igic_rate,
    total_line: -Math.abs(l.total_line),
  }));

  const rectInvoiceData: Omit<Invoice, 'id'> = {
    invoice_number: rectNum,
    client_id: original.client_id,
    issue_date: today,
    due_date: today,
    status: 'Pendiente',
    verifactu_status: 'Pendiente',
    total_base: -Math.abs(original.total_base),
    total_igic: -Math.abs(original.total_igic),
    total_irpf: -Math.abs(original.total_irpf),
    grand_total: -Math.abs(original.grand_total),
    is_rectification: true,
    original_invoice_id: original.id,
  };

  const newId = await saveInvoice(rectInvoiceData, rectLines);

  // Registrar en el Log de Auditoría
  await addAuditLogEntry({
    action: 'RECTIFY',
    invoice_id: newId,
    timestamp: new Date().toISOString(),
    xml_hash: 'HASH_RECTIFICACION_' + Date.now(),
  });

  return newId;
}

/**
 * Obtiene el historial de auditoría de Verifactu.
 */
export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM AuditLog ORDER BY id DESC');
  if (res.length === 0) return [];

  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

/**
 * Añade un registro al Log de Auditoría de Verifactu.
 */
export async function addAuditLogEntry(entry: Omit<AuditLogEntry, 'id'>): Promise<void> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO AuditLog (action, invoice_id, timestamp, xml_hash) VALUES (?, ?, ?, ?)`,
    [entry.action, entry.invoice_id, entry.timestamp, entry.xml_hash]
  );
  await autoSave();
}
