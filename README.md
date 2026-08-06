# Verifactu Gratuito Taratic — Software gratuito, completamente local y de código abierto para pymes y autónomos de España

Desktop app built with **React 18 + TypeScript + Vite 6 + Tailwind CSS 4 + Neutralino.js**, with local storage via sql.js (SQLite WASM) and PDF generation with jsPDF.

## Prerequisites

- Node.js 20+ and npm
- Neutralino.js CLI (one-time install):

```bash
npm install --save-dev @neutralinojs/neu
```

(or `npm install -g @neutralinojs/neu` for a global install)

## Install dependencies

```bash
npm install
```

## Run on desktop (dev/testing)

```bash
npm run build      # compiles TypeScript + bundles the frontend to dist/
npm run neu:run    # launches the desktop window
```

> **Note:** Run from Windows PowerShell/CMD to use the Windows binary (`bin/neutralino-win_x64.exe`). From WSL it picks the Linux binary and requires WSLg for the GUI.
>
> For faster frontend-only iteration you can use `npm run dev` (Vite dev server at `localhost:5173`), but Neutralino native APIs (filesystem, storage, window, etc.) are not available in the browser.

## Production build

```bash
npm run build
npx neu build --release
```

Output in `dist/facturalia-app/`:

- `resources.neu` — bundled app resources
- Executables per platform: `facturalia-app-win_x64.exe`, `facturalia-app-linux_x64`, `facturalia-app-mac_x64`, etc.
- With `--release`: zipped packages ready for distribution

**Windows distribution:** ship `facturalia-app-win_x64.exe` and `resources.neu` together in the same folder (or distribute the release zip directly).

## Production hardening checklist

Before releasing, review `neutralino.config.json`:

- [ ] Set `"enableInspector": false` (currently `true` — exposes devtools to end users)
- [ ] Review `logging.writeToLogFile` — keep for audit logs, disable for a cleaner install
- [x] `tokenSecurity: "one-time"` — already set

## Project structure

```
├── bin/           # Neutralino binaries (win/linux/mac)
├── dist/          # Build output (Vite) + neu build releases
├── public/        # Static assets copied to dist/ (neutralino.js, sql.js .wasm)
├── src/           # React app source
├── neutralino.config.json
└── vite.config.ts
```

## NPM scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Vite dev server (browser only)       |
| `npm run build`   | Type-check + production bundle to `dist/` |
| `npm run preview` | Preview the Vite build in browser    |
| `npm run neu:run` | Launch desktop app (requires build)  |
| `npm run neu:build` | Package desktop binaries           |
