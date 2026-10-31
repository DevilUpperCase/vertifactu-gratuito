# Política de Seguridad y Reporte Responsable

En **Verifactu Gratuito (Taratic)** la seguridad, la inalterabilidad criptográfica y la privacidad absoluta de los datos de facturación son nuestras máximas prioridades.

---

## 1. Arquitectura de Privacidad por Diseño (Zero-Cloud)

* **Cero Telemetría y Cero Conexiones Externas:** El sistema no envía datos de clientes, facturas, CIFs ni importes a ningún servidor central, analítica o tercero.
* **Persistencia Local Segura:** La base de datos SQLite opera en modo in-process, escribiendo exclusivamente en el disco duro local de la máquina del usuario.
* **Integridad Criptográfica:** El encadenamiento de facturas utiliza el algoritmo estándar SHA-256 según las directrices técnicas del Real Decreto 1007/2023 de la AEAT.

---

## 2. Versiones con Soporte de Seguridad

| Versión | Estado de Soporte |
| :--- | :--- |
| **1.0.x** | :white_check_mark: Soportada activamente (Correcciones y actualizaciones normativas) |

---

## 3. Reporte de Vulnerabilidades o Fallos de Seguridad

Si identificas una vulnerabilidad de seguridad en el software o en el cálculo de los algoritmos de verificación:

1. **NO publiques el problema en un issue público de GitHub** para salvaguardar a los usuarios activos.
2. Envía un correo electrónico detallado a:  
   📧 **contacto@taratic.com**
3. Incluye:
   * Descripción de la vulnerabilidad o comportamiento inesperado.
   * Pasos reproducibles o prueba de concepto (PoC).
   * Sistema operativo y versión de la aplicación afectada.

Nos comprometemos a responder en un plazo máximo de 48 horas laborables, evaluar la gravedad y publicar un parche de corrección de forma prioritaria con mención de agradecimiento en las notas de la versión si así lo deseas.
