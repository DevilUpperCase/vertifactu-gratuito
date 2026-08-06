-- Custom SQL Script: Inicialización de Tablas de Facturación e IGIC / Verifactu
-- Proyecto: Facturalia NeutralinoJS

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

-- Insertar valores iniciales por defecto en Settings si no existe
INSERT INTO Settings (id, issuer_nif, issuer_name, issuer_address, issuer_iban, default_igic_rate, verifactu_enabled)
SELECT 1, 'B35000000', 'Empresa Demo Canarias S.L.', 'Calle Triana 45, Las Palmas de Gran Canaria', 'ES91 2100 0418 4502 0005 1234', 7.0, 0
WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE id = 1);

-- Insertar cliente por defecto obligatorio si la tabla Clients está vacía
INSERT INTO Clients (id, nif, name, address, email, default_retention_irpf)
SELECT 1, 'B35999999', 'Cliente Principal Canarias S.L.', 'Av. Marítima 1, Las Palmas de Gran Canaria', 'contacto@clienteprincipal.es', 0
WHERE NOT EXISTS (SELECT 1 FROM Clients);
