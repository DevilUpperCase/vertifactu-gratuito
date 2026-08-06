# GEMINI.md - Convenciones y Nomenclatura del Proyecto

## Convención de Nomenclatura
De acuerdo con las preferencias del usuario, la nomenclatura de archivos, tablas, variables y funciones debe ser siempre acorde al contenido y dominio en español (salvo palabras clave de desarrollo en inglés cuando sea imprescindible).

### Nomenclatura de Base de Datos y Entidades
- `Settings` / `Configuracion`: Configuración del emisor y parámetros de Verifactu.
- `Clients` / `Clientes`: Datos fiscales de los clientes.
- `Invoices` / `Facturas`: Cabecera de facturas emitidas, rectificativas y borradores.
- `InvoiceLines` / `LineasFactura`: Desglose de conceptos, cantidades, precios y tipos de IGIC por línea.
- `AuditLog` / `RegistroAuditoria`: Registro inmutable de eventos Verifactu e impositivos.

### Nomenclatura Impositiva
- `IGIC`: Impuesto General Indirecto Canario (tipos del 0%, 3%, 7%, 9.5%, 15%).
- `IRPF`: Retención a cuenta del Impuesto sobre la Renta de las Personas Físicas (ej. 7% o 15%).
- `Verifactu`: Sistema de remisión de información de facturación de la Agencia Tributaria (AEAT).
