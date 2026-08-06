import forge from 'node-forge';
import QRCode from 'qrcode';
import { Invoice, Settings } from '../types';
import { centsToEuroNumber } from '../utils/currency';

export interface VerifactuResult {
  xmlContent: string;
  xmlHash: string;
  signature?: string;
  qrCodeDataUrl: string;
  qrUrl: string;
}

/**
 * Genera la huella/hash SHA-256 de una factura para encadenamiento inmutable en Verifactu.
 */
export function generateInvoiceHash(
  issuerNif: string,
  invoiceNumber: string,
  issueDate: string,
  grandTotalCents: number,
  previousHash: string = ''
): string {
  const md = forge.md.sha256.create();
  const rawPayload = `IDEmisor=${issuerNif}&NumFactura=${invoiceNumber}&Fecha=${issueDate}&Importe=${grandTotalCents}&PrevHash=${previousHash}`;
  md.update(rawPayload, 'utf8');
  return md.digest().toHex().toUpperCase();
}

/**
 * Parsea un certificado digital PKCS#12 (.p12 / .pfx) utilizando node-forge.
 */
export function parsePkcs12Certificate(
  certBase64OrBinary: string | ArrayBuffer,
  password: string = ''
): { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate; commonName: string } | null {
  try {
    let asn1: forge.asn1.Asn1;
    if (typeof certBase64OrBinary === 'string') {
      const binaryString = forge.util.decode64(certBase64OrBinary);
      asn1 = forge.asn1.fromDer(binaryString);
    } else {
      const bytes = new Uint8Array(certBase64OrBinary);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      asn1 = forge.asn1.fromDer(binaryString);
    }

    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);

    let privateKey: forge.pki.PrivateKey | null = null;
    let certificate: forge.pki.Certificate | null = null;

    // Buscar clave privada y certificado en las bolsas de PKCS12
    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {
        if (safeBag.key) {
          privateKey = safeBag.key as forge.pki.PrivateKey;
        }
        if (safeBag.cert) {
          certificate = safeBag.cert as forge.pki.Certificate;
        }
      }
    }

    if (!privateKey || !certificate) {
      console.warn('No se pudo encontrar la pareja de clave privada y certificado en el archivo PKCS#12');
      return null;
    }

    const cnAttr = certificate.subject.attributes.find((attr) => attr.shortName === 'CN');
    const commonName = cnAttr ? String(cnAttr.value) : 'Certificado Digital AEAT';

    return { privateKey, certificate, commonName };
  } catch (err) {
    console.error('Error parseando certificado PKCS#12 / .p12:', err);
    return null;
  }
}

/**
 * Genera el XML oficial de comunicación con Verifactu (AEAT) y firma el payload si hay certificado disponible.
 */
export async function processVerifactuInvoice(
  invoice: Invoice,
  settings: Settings,
  certDataBinary?: ArrayBuffer,
  previousInvoiceHash: string = '0000000000000000000000000000000000000000000000000000000000000000'
): Promise<VerifactuResult> {
  const totalEuros = centsToEuroNumber(invoice.grand_total).toFixed(2);
  const baseEuros = centsToEuroNumber(invoice.total_base).toFixed(2);
  const igicEuros = centsToEuroNumber(invoice.total_igic).toFixed(2);

  // 1. Generar la huella SHA-256 encadenada
  const xmlHash = generateInvoiceHash(
    settings.issuer_nif,
    invoice.invoice_number,
    invoice.issue_date,
    invoice.grand_total,
    previousInvoiceHash
  );

  // 2. Estructura XML normalizada RegistroAlta Facturación Verifactu
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<VerifactuAlta xmlns="https://www.agenciatributaria.es/static_files/common/internet/dep/aplicaciones/es/aeat/txml/verifactu/v1.0">
  <Cabecera>
    <ObligadoEmision>
      <NIF>${escapeXml(settings.issuer_nif)}</NIF>
      <NombreRazon>${escapeXml(settings.issuer_name)}</NombreRazon>
    </ObligadoEmision>
    <SistemaInformatico>
      <NombreSistema>Verifactu Gratuito Taratic App</NombreSistema>
      <Version>1.0.0</Version>
    </SistemaInformatico>
  </Cabecera>
  <RegistroFactura>
    <IDFactura>
      <NumSerieFactura>${escapeXml(invoice.invoice_number)}</NumSerieFactura>
      <FechaExpedicion>${invoice.issue_date}</FechaExpedicion>
    </IDFactura>
    <Destinatario>
      <NIF>${escapeXml(invoice.client_nif || '')}</NIF>
      <NombreRazon>${escapeXml(invoice.client_name || '')}</NombreRazon>
    </Destinatario>
    <TipoFactura>${invoice.is_rectification ? 'R1' : 'F1'}</TipoFactura>
    <Desglose>
      <DetalleDesglose>
        <Impuesto>IGIC</Impuesto>
        <BaseImponible>${baseEuros}</BaseImponible>
        <CuotaRepercutida>${igicEuros}</CuotaRepercutida>
      </DetalleDesglose>
    </Desglose>
    <ImporteTotal>${totalEuros}</ImporteTotal>
    <Encadenamiento>
      <HuellaAnterior>${previousInvoiceHash}</HuellaAnterior>
    </Encadenamiento>
    <HuellaDigestSHA256>${xmlHash}</HuellaDigestSHA256>
  </RegistroFactura>
</VerifactuAlta>`;

  // 3. Firma digital XMLDSig con node-forge si hay certificado disponible
  let signature: string | undefined = undefined;
  if (certDataBinary && settings.cert_password) {
    const certDetails = parsePkcs12Certificate(certDataBinary, settings.cert_password);
    if (certDetails) {
      const md = forge.md.sha256.create();
      md.update(xmlContent, 'utf8');
      const rsaKey = certDetails.privateKey as forge.pki.rsa.PrivateKey;
      const signatureBytes = rsaKey.sign(md);
      signature = forge.util.encode64(signatureBytes);
    }
  }

  // 4. URL de validación de Verifactu para código QR de la AEAT
  const qrUrl = `https://www1.agenciatributaria.gob.es/wlpl/invo-sepe/valida?nif=${encodeURIComponent(
    settings.issuer_nif
  )}&num=${encodeURIComponent(invoice.invoice_number)}&fecha=${encodeURIComponent(
    invoice.issue_date
  )}&importe=${totalEuros}&hash=${xmlHash.substring(0, 16)}`;

  // Generar imagen QR en DataURL
  const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
    margin: 1,
    width: 200,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
  });

  return {
    xmlContent,
    xmlHash,
    signature,
    qrCodeDataUrl,
    qrUrl,
  };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
