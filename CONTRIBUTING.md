# Guía de Contribución al Proyecto

¡Gracias por tu interés en contribuir a **Verifactu Gratuito (Taratic)**!  
Este es un proyecto de código abierto bajo **Licencia MIT**, creado para que autónomos y pymes de toda España puedan disponer de un software de facturación moderno, ultraligero (<3MB RAM) y 100% adaptado a la Ley Antifraude de la AEAT.

---

## 🛠️ Entorno de Desarrollo Local

### Requisitos:
* **Node.js 20+** y `npm`
* Git

### Pasos iniciales:
```bash
# 1. Clonar el repositorio
git clone https://github.com/DevilUpperCase/vertifactu-gratuito.git
cd vertifactu-gratuito

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor Vite para desarrollo frontend
npm run dev

# 4. Probar en modo nativo de escritorio
npm run build
npm run neu:run
```

---

## 📋 Áreas Clave donde Puedes Contribuir

1. **Formatos y Diseños de Factura PDF:**  
   Plantillas adicionales en `src/services/pdfGenerator.ts` (facturas minimalistas, bilingües inglés/español, diseños corporativos).
2. **Localización y Regímenes Forales:**  
   Adaptación y pruebas específicas para TicketBAI (País Vasco y Navarra) o particularidades autonómicas adicionales.
3. **Optimización de Rendimiento:**  
   Mantener el principio inviolable de consumo ultrabajo (< 3 MB de memoria RAM) y cero dependencias pesadas innecesarias.
4. **Empaquetado y Distribución:**  
   Fórmulas de Homebrew Cask para Mac, Flatpak / Snap para Linux, o manifest de Winget para Windows.

---

## 🚀 Flujo de Trabajo para Pull Requests

1. Haz un **Fork** del repositorio.
2. Crea una rama descriptiva para tu funcionalidad o corrección:
   ```bash
   git checkout -b feature/mejora-informe-excel
   ```
3. Realiza tus cambios asegurándote de que `npm run build` compila sin errores de TypeScript.
4. Haz commit siguiendo la convención de [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: añadir desglose de recargo de equivalencia en informe Excel"
   ```
5. Abre un **Pull Request** explicando detalladamente el cambio y los casos de prueba realizados.

¡Agradecemos enormemente cualquier aporte de la comunidad dev española e internacional! 🇪🇸✨

