# DECLARACIÓN RESPONSABLE DEL SISTEMA INFORMÁTICO DE FACTURACIÓN (SIF)

**En cumplimiento del artículo 13 del Real Decreto 1007/2023, de 5 de diciembre, por el que se aprueba el Reglamento que establece los requisitos que deben adoptar los sistemas y programas informáticos o electrónicos que soporten los procesos de facturación de empresarios y profesionales, y la Ley 11/2021, de 9 de julio, de medidas de prevención y lucha contra el fraude fiscal.**

---

### 1. DATOS DEL PRODUCTOR Y DESARROLLADOR DEL SISTEMA

* **Nombre del Productor / Entidad Desarrolladora:** Taratic Software (Proyecto de Código Abierto)
* **Sitio Web Oficial:** [https://taratic.com](https://taratic.com)
* **Repositorio Oficial de Código:** [https://github.com/DevilUpperCase/vertifactu-gratuito](https://github.com/DevilUpperCase/vertifactu-gratuito)
* **Licencia de Distribución:** Licencia de Código Abierto MIT (Libre de cargos, royalties o cuotas)
* **Correo de Contacto y Soporte:** contacto@taratic.com

---

### 2. IDENTIFICACIÓN DEL SISTEMA INFORMÁTICO DE FACTURACIÓN

* **Nombre Comercial del Sistema:** Verifactu Gratuito (Taratic)
* **Versión del Software:** 1.0.0 (y versiones menores compatibles)
* **Tipo de Instalación:** Aplicación local nativa autónoma (Windows x64, macOS Universal/ARM64, Linux x64/ARM64)
* **Motor de Persistencia:** Base de datos SQLite local criptográficamente auditada in-process
* **Consumo de Memoria RAM:** < 3.0 MB (2.8 MB en reposo y régimen nominal de trabajo)
* **Ámbito de Aplicación:** Facturación para autónomos, profesionales y pymes en territorio español (Península, Islas Baleares e Islas Canarias).

---

### 3. DECLARACIÓN FORMAL DE CUMPLIMIENTO NORMATIVO

El productor **DECLARA BAJO SU RESPONSABILIDAD** que el sistema informático denominado **«Verifactu Gratuito (Taratic)»** cumple rigurosamente con todas y cada una de las exigencias técnicas y operativas recogidas en:

1. **Ley 58/2003, de 17 de diciembre, General Tributaria**, en su artículo 29.2.j), introducido por la **Ley 11/2021, de 9 de julio, de medidas de prevención y lucha contra el fraude fiscal**.
2. **Real Decreto 1007/2023, de 5 de diciembre**, por el que se aprueba el Reglamento de Requisitos de los Sistemas Informáticos de Facturación (Reglamento Verifactu).
3. **Orden Ministerial de desarrollo técnico** reguladora de las especificaciones de la huella digital criptográfica y códigos QR de la Agencia Estatal de Administración Tributaria (AEAT).

---

### 4. GARANTÍAS TÉCNICAS CERTIFICADAS

#### 4.1. Inalterabilidad e Integridad de los Registros (Art. 8 RD 1007/2023)
* Cada factura emitida genera de forma instantánea e irreversible un **hash criptográfico SHA-256** derivado de los campos canónicos del registro:
  `NIF Emisor + Número Factura + Fecha Emisión + Tipo Factura + Cuota Total + Importe Total + Huella Registro Anterior`.
* **Encadenamiento Criptográfico Ininterrumpido:** La huella de cada factura incorpora los primeros o totales caracteres de la huella del registro inmediatamente precedente, garantizando que sea matemáticamente imposible insertar, suprimir o alterar una factura previa sin romper la cadena de validación.

#### 4.2. Trazabilidad y Registro de Eventos (Art. 9 RD 1007/2023)
* El sistema implementa un registro de auditoría interno inalterable (`AuditLog`) que almacena la traza temporal fidedigna (timestamp local y UTC), el tipo de evento (creación de factura, intento de rectificación, backup, exportación) y el resultado del hash de cada acción.

#### 4.3. Código QR Normalizado de la AEAT (Art. 10 RD 1007/2023)
* Toda factura generada en formato impreso o PDF incluye obligatoriamente en su parte inferior el **Código QR oficial** codificado con la sintaxis reglamentaria:
  `URL AEAT + NIF Emisor + Serie y Número + Fecha de Expedición + Importe Total + Hash SHA-256`.
* Este código QR permite a clientes y a los inspectores de la Administración Tributaria contrastar de forma inmediata la veracidad de la factura desde cualquier dispositivo móvil.

#### 4.4. Prohibición Absoluta de Software de Doble Uso (Ley 11/2021)
* El software **NO contiene**, bajo ningún concepto:
  - Mecanismos de doble contabilidad o "cajas B".
  - Capacidades de alteración, borrado o modificación retroactiva de facturas ya firmadas o registradas.
  - Funcionalidades de omisión de ventas o generación de importes discordantes con la realidad documentada.
* Las correcciones de facturación se realizan exclusivamente mediante **Facturas Rectificativas** numeradas en serie diferenciada (`R-YYYY-XXXX`), preservando intacta la factura de origen.

#### 4.5. Conservación, Legibilidad y Soberanía de Datos (Art. 11 RD 1007/2023)
* La totalidad de los datos reside exclusivamente en el equipo del usuario en formato de base de datos estándar SQLite.
* El software incorpora herramientas nativas de **exportación estructurada de libros de facturas emitidas en formato Excel (XLSX) y PDF**, garantizando que el empresario pueda poner a disposición de la Administración Tributaria o de su asesoría fiscal la totalidad de los registros sin dependencia de servidores externos ni cuotas de mantenimiento.

---

### 5. VALIDEZ JURÍDICA Y PUESTA A DISPOSICIÓN

El presente documento constituye la certificación escrita reglamentaria del productor. Cualquier usuario, asesoría fiscal o inspector de la Agencia Tributaria puede verificar el código fuente libre del sistema en el repositorio oficial público para constatar el cumplimiento estricto de las especificaciones descritas.

Firmado en fecha 2026 por el equipo de desarrollo de:  
**Taratic Software — Proyecto Verifactu Gratuito**  
*Licencia Libre y Código Abierto para Autónomos y Empresas de España.*
