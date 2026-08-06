export type InvoiceStatus = 'Borrador' | 'Pendiente' | 'Pagada' | 'Anulada';
export type VerifactuStatus = 'N/A' | 'Pendiente' | 'Firmado' | 'Enviado';

export interface Settings {
  id: number;
  issuer_nif: string;
  issuer_name: string;
  issuer_address: string;
  issuer_iban: string;
  default_igic_rate: number;
  verifactu_enabled: boolean;
  cert_path: string;
  cert_password?: string;
}

export interface Client {
  id: number;
  nif: string;
  name: string;
  address: string;
  email: string;
  default_retention_irpf: boolean;
  created_at?: string;
}

export interface InvoiceLine {
  id?: number;
  invoice_id?: number;
  concept: string;
  quantity: number;
  unit_price: number; // in cents
  discount: number; // percentage
  igic_rate: number; // percentage e.g. 7.0
  total_line: number; // in cents
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  client_id: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  verifactu_status: VerifactuStatus;
  total_base: number; // in cents
  total_igic: number; // in cents
  total_irpf: number; // in cents
  grand_total: number; // in cents
  is_rectification: boolean;
  original_invoice_id?: number | null;
  created_at?: string;
  client_name?: string;
  client_nif?: string;
  client_address?: string;
  lines?: InvoiceLine[];
}

export interface AuditLogEntry {
  id: number;
  action: 'CREATE' | 'RECTIFY' | 'VERIFACTU_SIGN';
  invoice_id: number;
  timestamp: string;
  xml_hash: string;
}

export interface IgicBreakdownItem {
  rate: number;
  baseCents: number;
  igicCents: number;
}
