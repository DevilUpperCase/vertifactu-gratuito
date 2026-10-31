# 📖 GUÍA DE INICIO Y MANUAL DE USO PARA AUTÓNOMOS Y PYMES

**Verifactu Gratuito (Taratic)** — Software legal, 100% local y sin cuotas para España.

---

## 1. INSTALACIÓN RÁPIDA (PORTABLE, SIN COMPLICACIONES)

El programa no requiere instalar servidores, bases de datos complejas ni dependencias adicionales:

### En Windows (10 y 11):
1. Descarga el paquete `verifactu-gratuito-win_x64.zip` desde los lanzamientos oficiales en GitHub.
2. Descomprime la carpeta en la ubicación que prefieras (por ejemplo, en `C:\Programas\Verifactu` o en tu carpeta de usuario).
3. Haz doble clic en el ejecutable `verifactu-gratuito-win_x64.exe`.
4. *Opcional:* Haz clic derecho sobre el ejecutable y selecciona *«Crear acceso directo»* para colocarlo en tu Escritorio o barra de tareas.

### En macOS (Intel y Apple Silicon M1, M2, M3, M4):
1. Descarga el binario para tu arquitectura (`verifactu-gratuito-mac_arm64` para M1/M2/M3/M4 o `verifactu-gratuito-mac_x64` para Mac con procesador Intel).
2. Si macOS muestra una advertencia de seguridad de aplicación descargada de Internet, abre *Ajustes del Sistema > Privacidad y Seguridad* y pulsa *«Abrir de todos modos»*.

### En Linux (Ubuntu, Debian, Fedora, Arch, Linux Mint):
1. Descarga `verifactu-gratuito-linux_x64` y otórgale permisos de ejecución:
   ```bash
   chmod +x verifactu-gratuito-linux_x64
   ./verifactu-gratuito-linux_x64
   ```

---

## 2. PRIMERA CONFIGURACIÓN FISCAL (2 MINUTOS)

Antes de emitir tu primera factura, dirígete a la pestaña **«Configuración»** en el menú lateral:

1. **Datos de tu Empresa / Actividad:**
   * **NIF / CIF:** Introduce tu número de identificación fiscal (ej. `12345678Z` o `B12345678`).
   * **Nombre o Razón Social:** Tu nombre comercial o nombre completo de autónomo.
   * **Dirección Fiscal:** Domicilio fiscal completo con código postal y municipio.
   * **IBAN:** Número de cuenta bancaria para cobrar por transferencia tus facturas.
2. **Régimen de Impuestos Indirectos:**
   * **Península e Islas Baleares (IVA):** Selecciona el tipo general (21%), reducido (10%), superreducido (4%) o exento (0%).
   * **Islas Canarias (IGIC):** Selecciona el tipo general (7%), incrementados (9.5% y 15%), reducidos (3%) o tipo cero (0%).
3. **Modo Verifactu Inmutable:**
   * Activa la casilla de Verifactu para que el sistema encadene automáticamente cada factura con el hash SHA-256 e imprima el código QR oficial de la AEAT.

---

## 3. CÓMO EMITIR UNA FACTURA LEGAL PASO A PASO

1. En el menú superior o en el Panel Principal, pulsa el botón azul **«Nueva Factura»**.
2. **Selecciona o crea el Cliente:**
   * Si es un cliente nuevo, introduce su NIF/CIF y Razón Social (quedará guardado automáticamente en tu agenda para futuras facturas).
3. **Fecha de Emisión:** Selecciona la fecha de la factura con el selector español (`DD/MM/AAAA`).
4. **Líneas de Detalle:**
   * Escribe el concepto (ej. *«Servicios de diseño web y mantenimiento mensual»*).
   * Indica las unidades o cantidad y el precio unitario en euros.
   * Selecciona el porcentaje de IVA o IGIC correspondiente.
5. **Retención de IRPF (Opcional para Profesionales):**
   * Si eres autónomo profesional emitiendo a otra empresa o profesional, marca la casilla de retención IRPF y selecciona el porcentaje aplicable (habitualmente el **15%**, o el **7%** para nuevos autónomos en sus primeros 3 años de actividad).
6. **Revisión del Resumen:**
   * El sistema calcula de forma instantánea la Base Imponible, la Cuota de Impuestos, la Retención IRPF y el Total a Cobrar.
7. Pulsa **«Guardar y Emitir Factura»**.
   * La factura se registrará con su número correlativo inalterable.
   * Desde la lista de facturas podrás pulsar el botón **PDF** para descargar o imprimir tu factura con el código QR oficial listo para enviar al cliente.

---

## 4. FACTURAS RECTIFICATIVAS (DE ABONO O CORRECCIÓN)

Conforme a la Ley Antifraude, **no se permite borrar ni editar facturas ya emitidas**. Si has cometido un error o el cliente devuelve un pedido:
1. Dirígete a la pestaña **«Facturas»**.
2. Localiza la factura original y pulsa el botón **«Rectificar / Anular»**.
3. El sistema creará automáticamente una **Factura Rectificativa** numerada con la serie `R-2026-XXXX`, vinculada a la factura original y corrigiendo las cantidades conforme a la normativa de la AEAT.

---

## 5. CÓMO GENERAR EL INFORME DE VENTAS PARA TU GESTORÍA

Para presentar tus declaraciones trimestrales (Modelo 303 de IVA, Modelo 130 de IRPF, o Modelo 420 de IGIC en Canarias):
1. Haz clic en **«Generar informe de ventas»** en el menú lateral.
2. Selecciona el rango de fechas (ej. del `01/01/2026` al `31/03/2026` para el primer trimestre).
3. Pulsa **«Exportar a Excel (XLSX)»** o **«Exportar a PDF»**.
4. Obtendrás una hoja estructurada con el desglose exacto de Bases Imponibles, cuotas de IVA/IGIC repercutidas, retenciones de IRPF y totales de cada factura para entregárselo directamente a tu gestor.

---

## 6. COPIAS DE SEGURIDAD (BACKUP) DE TUS DATOS

Toda tu información (clientes, facturas, configuración e historial de auditoría) se almacena en tu propio disco en el archivo:
`invoices_app.db` (en la carpeta de la aplicación o en tu directorio de datos locales).

* **Para hacer una copia de seguridad:** Simplemente copia el archivo `invoices_app.db` a un pendrive USB, disco externo o a tu carpeta de almacenamiento en la nube privada (Dropbox, Google Drive, OneDrive).
* **Para restaurar:** Si cambias de ordenador, coloca tu archivo `invoices_app.db` en la carpeta de la aplicación y recuperarás la totalidad de tu historial de facturación de forma instantánea.

