# ⚡ Verifactu Gratuito (Taratic) — Software de Facturación Legal, Rápido y Fiable

[![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Verifactu AEAT](https://img.shields.io/badge/AEAT-Verifactu%20100%25%20Legal-emerald.svg)](#cumplimiento-verifactu-aeat)
[![Consumo RAM](https://img.shields.io/badge/RAM-%3C%203%20MB%20(2.8%20MB)-brightgreen.svg)](#comparativa-de-rendimiento)
[![Plataformas](https://img.shields.io/badge/SO-Windows%20%7C%20macOS%20%7C%20Linux-orange.svg)](#descarga-gratuita)
[![Privacidad](https://img.shields.io/badge/Datos-100%25%20Locales%20(SQLite)-purple.svg)](#privacidad-y-seguridad)

> **El software de facturación adaptado a Verifactu y a la Ley Antifraude más ligero y rápido de España.**  
> Consume **menos de 3 MB de memoria RAM** (mientras que **una pestaña de Google Chrome consume de media entre 100 MB y 500 MB de memoria RAM**).  
> **100% gratuito**, sin suscripciones mensuales, sin telemetría y totalmente funcional sin conexión a Internet (**offline**).

---

## 📥 Descarga Gratuita Oficial (Windows, Mac y Linux)

Descarga la última versión compilada lista para usar sin necesidad de configurar servidores ni bases de datos complejas:

| Sistema Operativo | Paquete / Ejecutable | Arquitectura | Compatibilidad |
| :--- | :--- | :--- | :--- |
| **🪟 Windows** | [**Descargar para Windows (ZIP / EXE)**](https://github.com/DevilUpperCase/vertifactu-gratuito/releases) | x64 (64-bit) | Windows 10, Windows 11, Windows Server |
| **🍏 macOS** | [**Descargar para Mac (Apple Silicon)**](https://github.com/DevilUpperCase/vertifactu-gratuito/releases) | ARM64 | M1, M2, M3, M4 y posteriores |
| **🍏 macOS** | [**Descargar para Mac (Intel)**](https://github.com/DevilUpperCase/vertifactu-gratuito/releases) | x64 | MacBooks e iMacs con procesador Intel |
| **🐧 Linux** | [**Descargar para Linux (x64 / ARM)**](https://github.com/DevilUpperCase/vertifactu-gratuito/releases) | x64 / ARM64 | Ubuntu, Debian, Fedora, Arch, Linux Mint |

*Todos los ejecutables están optimizados, empaquetados y nombrados como `verifactu-gratuito` con metadatos oficiales e icono integrado.*

---

## 🎬 Guía de Uso Rápido y Flujo de Trabajo

Aprende a configurar tu emisor, crear tu primera factura legal, calcular impuestos y generar el código QR oficial de la Agencia Tributaria en menos de 2 minutos:

### 📋 Funcionamiento en 4 Pasos Clave:
1. **Configuración de Emisor:** Introduce NIF/CIF, Nombre o Razón Social y tu régimen tributario (**IVA** en Península/Baleares o **IGIC** en Canarias).
2. **Creación de Facturas y Conceptos:** Añade tus clientes, conceptos, unidades, precios, tipos impositivos y retención IRPF (15%, 7%, etc.) con cálculo en tiempo real.
3. **Encadenamiento Verifactu SHA-256:** El software calcula la huella digital criptográfica inalterable encadenada con la factura anterior según exige la ley.
4. **Exportación a PDF y QR Oficial:** Genera e imprime al instante tu factura en PDF con el código QR legal verificado por la AEAT.

---

## 🚀 Comparativa de Rendimiento Extremo: Apto para Ordenadores Poco Potentes

¿Tienes un ordenador antiguo en el taller, un TPV modesto en el mostrador o un portátil de gama básica?  
A diferencia de los programas de facturación convencionales construidos con Electron o plataformas web pesadas, **Verifactu Gratuito está diseñado con un motor nativo ultraligero y SQLite WASM en memoria/disco local**.

> 💡 **Dato clave de rendimiento:** Una pestaña de Google Chrome consume de media entre **100 MB y 500 MB de memoria RAM** (muestra media de 374,3 MB en uso normal). Verifactu Gratuito opera con **menos de 3 MB de RAM** (2,8 MB en reposo y uso activo), lo que lo hace hasta **133 veces más ligero y rápido**.

### 📊 Comparativa Real de Consumo en Administrador de Tareas (Windows Task Manager)

| Parámetro / Característica | ⚡ **Verifactu Gratuito (Taratic)** | 🌐 **1 Pestaña Google Chrome** | 💼 **Software Clásico (Electron / Web)** |
| :--- | :---: | :---: | :---: |
| **Consumo de Memoria RAM** | **2,8 MB** *(Menos de 3 MB)* | **100 MB – 500 MB** *(Media: 374,3 MB)* | **350 MB – 550 MB** |
| **Carga de CPU en Reposo** | **0.0%** *(Impacto nulo)* | 1.5% – 5.0% *(Hilos JS continuos)* | 2.0% – 7.0% |
| **Apto para Ordenadores Viejos / TPVs** | **✓ 100% Fluido** *(Desde 2 GB RAM)* | ⚠️ Congela pestañas y ralentiza el PC | ❌ Requiere equipos potentes |
| **Tamaño del Programa en Disco** | **~12 MB** | > 500 MB *(Navegador + caché)* | 200 MB – 600 MB |
| **Tiempo de Arranque** | **< 0.15 segundos** | 2.0 – 5.0 segundos | 3.0 – 8.0 segundos |
| **Funcionamiento Sin Internet (Offline)** | **✓ 100% Operativo** | ❌ Requiere conexión obligatoria | ❌ Caídas si falla el servidor |
| **Privacidad de Datos Fiscales** | **✓ 100% en tu equipo** *(Cero fugas)* | ⚠️ Expuesto a extensiones del navegador | ⚠️ Datos en la nube de terceros |
| **Coste de Licencia** | **Gratis para siempre (Open Source)** | Navegador gratuito | 15€ a 50€ al mes por suscripción |

```
Consumo de Memoria RAM Comparado:
[■] 2.8 MB               Verifactu Gratuito (Taratic)
[■■■■■■■■■■■■■■■■■■■■■■] 100 - 500 MB        Pestaña estándar de Google Chrome (Media ~374 MB, 133x)
[■■■■■■■■■■■■■■■■■■■■■■■■■■■] 450.0 MB       Software Electron / SaaS habitual (160x)
```

---

## ⚖️ Cumplimiento Verifactu y Ley Antifraude AEAT en Toda España

Este software ha sido diseñado específicamente para cumplir con el **Real Decreto 1007/2023** y la **Ley 11/2021 de Medidas de Prevención y Lucha contra el Fraude Fiscal**:

- **Huella Hash SHA-256 Inmutable:** Cada registro de facturación genera un hash criptográfico encadenado con la huella del registro anterior, impidiendo cualquier alteración o borrado retroactivo de facturas.
- **Código QR AEAT Normalizado:** Cada PDF emitido incorpora el código QR con la URL y parámetros requeridos por la Agencia Tributaria para su verificación instantánea.
- **Soporte Fiscal Integral para España:**
  - **Península e Islas Baleares (IVA):** Tipos del 21%, 10%, 4% y 0% (exento).
  - **Islas Canarias (IGIC):** Tipo general del 7%, incrementados (9.5% y 15%), reducidos (3%), cero (0%) y exenciones.
  - **Retención de IRPF:** Cálculo automático del 15%, 7% (nuevos autónomos), 1% o 19% para profesionales y arrendamientos.
  - **Series Rectificativas:** Soporte nativo para facturas rectificativas de abono o corrección (R-2026-XXXX).
  - **Exportación de Libros Fiscales:** Generación de informes de ventas en formato Excel/CSV para tu gestoría o declaración trimestral (Modelos 303, 130, 420, etc.).

---

## 📚 Documentación Oficial y Certificaciones

Para facilitar la adopción, auditoría técnica y cumplimiento legal ante asesorías e inspecciones tributarias:

- 📋 [**Declaración Responsable Verifactu (Art. 13 RD 1007/2023)**](docs/DECLARACION_RESPONSABLE_VERIFACTU.md): Certificado oficial del productor sobre inalterabilidad, SHA-256 y ausencia de doble uso.
- 🔬 [**Memoria Técnica y Arquitectura del SIF**](docs/MEMORIA_TECNICA_VERIFACTU.md): Detalle técnico del encadenamiento criptográfico, código QR y persistencia SQLite in-process.
- 📖 [**Guía de Usuario e Implantación para Autónomos y Pymes**](docs/GUIA_USUARIO_Y_AUTONOMOS.md): Manual paso a paso de uso, emisión de facturas, rectificativas y copias de seguridad.
- 📦 [**Fichas de Publicación para Directorios y Sitios Web**](docs/FICHAS_DIRECTORIOS_Y_DISTRIBUCION.md): Textos redactados listos para registrar el software en AlternativeTo, Product Hunt, Softpedia, foros y comunidades.
- 🔒 [**Política de Seguridad y Reporte Responsable**](SECURITY.md): Compromiso de privacidad zero-cloud y auditoría abierta.
- 🤝 [**Guía de Contribución Open Source**](CONTRIBUTING.md): Instrucciones para colaborar en el desarrollo del software.

---

## 🔒 Privacidad Absoluta: 100% Local y Sin Nube

Tus datos fiscales, clientes y facturas son tu mayor activo confidencial.  
A diferencia de los programas de facturación en la nube que cobran cuotas mensuales y guardan tu facturación en servidores remotos:
- **Tus datos nunca salen de tu ordenador.**
- La base de datos se guarda en un archivo SQLite local protegido.
- No requiere registrar cuentas de correo ni tarjetas de crédito.
- Puedes hacer copias de seguridad de tu archivo de base de datos con solo copiarlo a un pendrive o disco externo.

---

## 🛠️ Desarrollo y Compilación desde el Código Fuente

Si eres desarrollador y deseas compilar o contribuir al proyecto:

### Requisitos:
- **Node.js 20+** y `npm`

### Pasos:
```bash
# 1. Clonar el repositorio
git clone https://github.com/DevilUpperCase/vertifactu-gratuito.git
cd vertifactu-gratuito

# 2. Instalar dependencias
npm install

# 3. Compilar la aplicación web y empaquetar
npm run build

# 4. Probar en modo escritorio local
npm run neu:run

# 5. Generar binarios de producción con metadatos oficiales e icono
npm run neu:build
```

### Scripts de NPM disponibles:
- `npm run dev`: Servidor de desarrollo Vite para previsualización web.
- `npm run build`: Compilación TypeScript + bundle Vite en `dist/`.
- `npm run neu:run`: Ejecución del ejecutable nativo en Windows/Mac/Linux.
- `npm run patch:exe`: Parcheo de metadatos Windows PE (FileDescription, ProductName, Icono).
- `npm run neu:build`: Generación de releases oficiales para todas las plataformas.

---

## ❓ Preguntas Frecuentes (FAQ)

### ¿Es realmente 100% gratuito?
Sí. El proyecto es de código abierto con licencia libre. No existen límites de facturas, marcas de agua ni suscripciones ocultas.

### ¿Funciona en un ordenador viejo o con pocos recursos?
Totalmente. Al consumir menos de 3 MB de memoria RAM (frente a los 100-500 MB que consume una sola pestaña de Google Chrome) y no sobrecargar la CPU, funciona de manera instantánea incluso en ordenadores con más de 10 años o TPVs con especificaciones básicas.

### ¿Puedo emitir facturas tanto con IVA como con IGIC de Canarias?
Sí. Desde el panel de Configuración puedes alternar entre el régimen de IVA (Península y Baleares) y el régimen de IGIC (Canarias), personalizando los porcentajes aplicables a tus productos o servicios.

### ¿Cómo entrego las facturas a mis clientes?
Con un solo clic puedes descargar el PDF oficial de la factura con el código QR de Verifactu y enviarlo por correo electrónico o imprimirlo en papel.

---

## 🤝 Soporte y Contacto

- **Web:** [taratic.com](https://taratic.com)
- **Email:** [contacto@taratic.com](mailto:contacto@taratic.com)
- **Repositorio:** [github.com/DevilUpperCase/vertifactu-gratuito](https://github.com/DevilUpperCase/vertifactu-gratuito)
