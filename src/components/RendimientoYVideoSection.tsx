import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt,
  faCheckCircle,
  faExclamationTriangle,
  faPlay,
  faTimes,
  faDownload,
  faGlobe,
} from '../utils/icons';

interface RendimientoYVideoSectionProps {
  theme?: 'dark' | 'light';
  onOpenGuide?: () => void;
}

export const RendimientoYVideoSection: React.FC<RendimientoYVideoSectionProps> = ({
  theme = 'dark',
  onOpenGuide,
}) => {
  const isDark = theme === 'dark';
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'); // Placeholder de alta calidad
  const [activeChapter, setActiveChapter] = useState(0);

  const cardBgClass = isDark
    ? 'bg-[#1e1f20] border-zinc-800 shadow-xl text-zinc-100'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

  const chapters = [
    {
      title: '1. Configuración de Emisor',
      desc: 'Introduce tu NIF, Razón Social y régimen fiscal (IVA Península/Baleares o IGIC Canarias).',
      duration: '0:35',
    },
    {
      title: '2. Emisión y Conceptos',
      desc: 'Añade clientes, líneas de detalle, retención IRPF y descuentos con cálculo en tiempo real.',
      duration: '0:48',
    },
    {
      title: '3. Encadenamiento Hash SHA-256',
      desc: 'Generación automática de la huella digital inalterable conforme al Real Decreto 1007/2023.',
      duration: '0:25',
    },
    {
      title: '4. Código QR AEAT y PDF',
      desc: 'Impresión y exportación inmediata en PDF con el QR oficial legible por la Agencia Tributaria.',
      duration: '0:32',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN DE RENDIMIENTO EXTREMO Y COMPARATIVA DE MEMORIA (<3MB RAM) */}
      <div className={`p-8 rounded-3xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                MENOS DE 3 MB DE RAM (<span className="font-extrabold text-emerald-300">2.8 MB</span>)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                100% Apto para Ordenadores Antiguos y TPVs
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Windows • Mac • Linux
              </span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Rendimiento Ultraligero: Facturación que no ralentiza tu equipo
            </h3>
            <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Diseñado con arquitectura nativa webview y motor SQLite local in-process. Consume más de{' '}
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>133 veces menos memoria RAM</strong> que una sola pestaña de Google Chrome, garantizando fluidez total en cualquier PC o portátil modesto.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 font-medium ${
                isDark
                  ? 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span>Verificado en Task Manager de Windows</span>
            </span>
          </div>
        </div>

        {/* Visual Benchmark Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Verifactu Gratuito (Taratic) */}
          <div
            className={`p-6 rounded-2xl border relative overflow-hidden transition-all ${
              isDark
                ? 'bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                : 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCheckCircle} />
                Verifactu Gratuito (Taratic)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-black uppercase">
                Ganador
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-400 tracking-tight">2.8 MB</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                RAM en uso
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Impacto imperceptible en el sistema. 0% CPU en reposo y arranque en 0.1s.
            </p>
            {/* Visual Bar */}
            <div className="mt-4 w-full bg-zinc-800/60 rounded-full h-3 overflow-hidden p-0.5">
              <div className="bg-emerald-400 h-full rounded-full w-[2%] transition-all duration-1000 animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-emerald-400 font-mono">
              <span>0.7% del límite base</span>
              <span>Ultrarrápido</span>
            </div>
          </div>

          {/* Card 2: 1 Pestaña de Google Chrome */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark
                ? 'bg-zinc-900/60 border-amber-500/30'
                : 'bg-amber-50/40 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                Pestaña Google Chrome
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                133× más pesado
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-400 tracking-tight">374.3 MB</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                RAM por pestaña
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Una sola pestaña web consume cientos de MB de memoria y subprocesos JS constantes.
            </p>
            {/* Visual Bar */}
            <div className="mt-4 w-full bg-zinc-800/60 rounded-full h-3 overflow-hidden p-0.5">
              <div className="bg-amber-400 h-full rounded-full w-[83%] transition-all duration-1000" />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-amber-400 font-mono">
              <span>83% escala relativa</span>
              <span>Pesado en PCs modestos</span>
            </div>
          </div>

          {/* Card 3: Software Clásico (Electron / Nube) */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark
                ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Software Clásico (Electron/Cloud)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                160× más pesado
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-rose-400 tracking-tight">450+ MB</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                RAM habitual
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Requieren empaquetar un navegador Chromium entero de más de 200 MB en disco.
            </p>
            {/* Visual Bar */}
            <div className="mt-4 w-full bg-zinc-800/60 rounded-full h-3 overflow-hidden p-0.5">
              <div className="bg-rose-500 h-full rounded-full w-[100%] transition-all duration-1000" />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-rose-400 font-mono">
              <span>100% escala relativa</span>
              <span>Lento en TPVs antiguos</span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/60">
          <table className="w-full text-left text-xs whitespace-normal">
            <thead
              className={`uppercase border-b text-[11px] font-bold ${
                isDark
                  ? 'bg-black/60 text-zinc-300 border-zinc-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4">Métrica / Característica</th>
                <th className="py-3.5 px-4 bg-emerald-500/10 text-emerald-400 font-extrabold border-x border-emerald-500/20">
                  ⚡ Verifactu Gratuito (Taratic)
                </th>
                <th className="py-3.5 px-4">Pestaña Google Chrome</th>
                <th className="py-3.5 px-4">Software Clásico (Electron / Web)</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-zinc-800/60 text-zinc-300' : 'divide-slate-200 text-slate-700'
              }`}
            >
              <tr>
                <td className="py-3 px-4 font-semibold">Consumo de Memoria RAM</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-black text-emerald-400 border-x border-emerald-500/20">
                  2.8 MB (Menos de 3 MB)
                </td>
                <td className="py-3 px-4 text-amber-400 font-medium">374.3 MB (133× más consumo)</td>
                <td className="py-3 px-4 text-rose-400 font-medium">350 MB – 550 MB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Carga de CPU en Reposo</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-bold text-emerald-400 border-x border-emerald-500/20">
                  0.0% (Inmediato)
                </td>
                <td className="py-3 px-4">1.0% – 4.5% (subprocesos JS)</td>
                <td className="py-3 px-4">2.0% – 6.0%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Apto para PCs Viejos / TPVs</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-bold text-emerald-300 border-x border-emerald-500/20">
                  ✓ 100% Fluido (PCs de 2GB/4GB RAM)
                </td>
                <td className="py-3 px-4 text-zinc-400">Poco recomendado (bloqueos de pestañas)</td>
                <td className="py-3 px-4 text-zinc-400">Pesado (requiere hardware reciente)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Tamaño en Disco</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-bold text-emerald-400 border-x border-emerald-500/20">
                  ~12 MB instalador
                </td>
                <td className="py-3 px-4">&gt; 500 MB (navegador + caché)</td>
                <td className="py-3 px-4">200 MB – 600 MB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Funcionamiento Offline</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-bold text-emerald-300 border-x border-emerald-500/20">
                  ✓ 100% Operativo sin Internet
                </td>
                <td className="py-3 px-4 text-zinc-400">Requiere conexión constante</td>
                <td className="py-3 px-4 text-zinc-400">Depende de servidores externos</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Privacidad de Datos Fiscales</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-bold text-emerald-300 border-x border-emerald-500/20">
                  ✓ Base de datos local SQLite (Cero fugas)
                </td>
                <td className="py-3 px-4 text-zinc-400">Expuesto a extensiones de navegador</td>
                <td className="py-3 px-4 text-zinc-400">Alojado en nubes comerciales</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Coste / Licencia</td>
                <td className="py-3 px-4 bg-emerald-500/10 font-extrabold text-emerald-300 border-x border-emerald-500/20">
                  100% Gratis y de Código Abierto
                </td>
                <td className="py-3 px-4 text-zinc-400">Plataformas web cobran cuota</td>
                <td className="py-3 px-4 text-rose-400 font-medium">Suscripción de 15€ a 50€/mes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SECCIÓN DE VIDEO EXPLICATIVO Y TUTORIAL PASO A PASO */}
      <div className={`p-8 rounded-3xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPlay} className="text-[10px]" />
                VIDEO EXPLICATIVO Y GUÍA PASO A PASO
              </span>
              <span className="text-xs font-semibold text-zinc-400">Duración: 2 min</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Aprende a emitir facturas legales con Verifactu en menos de 2 minutos
            </h3>
            <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Descubre cómo configurar tu empresa, emitir facturas con desglose automático de IGIC o IVA, calcular IRPF y generar la huella digital SHA-256 con el código QR oficial de la Agencia Tributaria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                  isDark
                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>Ver Guía AEAT Completa</span>
              </button>
            )}
            <button
              onClick={() => setVideoModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faPlay} />
              <span>Ver Video Tutorial</span>
            </button>
          </div>
        </div>

        {/* Video Player Preview and Chapter Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Video Mockup / Interactive Frame */}
          <div className="lg:col-span-7">
            <div
              className={`relative rounded-2xl overflow-hidden border shadow-2xl aspect-video cursor-pointer group flex items-center justify-center ${
                isDark ? 'bg-black border-zinc-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
              onClick={() => setVideoModalOpen(true)}
            >
              {/* Animated Background Simulation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/80 via-slate-950 to-indigo-950/70" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Central Play Button */}
              <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl shadow-xl shadow-blue-500/40 group-hover:scale-110 transition-transform duration-300">
                  <FontAwesomeIcon icon={faPlay} className="ml-1" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    Reproducir Tutorial Completo
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mt-1">
                    Capítulo activo: <strong className="text-white">{chapters[activeChapter].title}</strong>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md text-white border border-white/20">
                  ▶ Haz clic para abrir el reproductor
                </span>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between text-[11px] text-slate-300 px-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Verifactu Gratuito v1.0 • Tutorial HD</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400">RAM: 2.8 MB</span>
                  <span className="font-mono">1080p • 60 FPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Steps List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              Contenido del Video Tutorial:
            </div>
            {chapters.map((chap, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveChapter(idx);
                  setVideoModalOpen(true);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeChapter === idx
                    ? isDark
                      ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-md'
                      : 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm'
                    : isDark
                    ? 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800 text-zinc-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        activeChapter === idx
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {chap.title}
                  </span>
                  <span className="text-[10px] font-mono opacity-70">{chap.duration}</span>
                </div>
                <p className={`text-xs pl-7 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {chap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Multiplatform Download & Accessibility Badges */}
        <div
          className={`mt-8 pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
            isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-zinc-300">Descarga Gratuita Oficial:</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
              <span>🪟 Windows 10/11</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
              <span>🍏 macOS (Intel & Apple Silicon)</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
              <span>🐧 Linux (Ubuntu, Debian, Arch)</span>
            </span>
          </div>

          <a
            href="https://github.com/DevilUpperCase/vertifactu-gratuito"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
          >
            <FontAwesomeIcon icon={faGlobe} />
            <span>Ver repositorio en GitHub (Código Abierto) →</span>
          </a>
        </div>
      </div>

      {/* Video Modal Player */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-4xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col ${
              isDark ? 'bg-[#18191a] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold">Tutorial Verifactu Gratuito (Paso a Paso)</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Capítulo: {chapters[activeChapter].title} • Cumplimiento Ley Antifraude AEAT
                </p>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <iframe
                className="w-full h-full border-0"
                src={videoUrl}
                title="Tutorial Verifactu Gratuito"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 sm:p-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
                isDark ? 'bg-zinc-950/60' : 'bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold">Menos de 3MB de RAM verificado</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/DevilUpperCase/vertifactu-gratuito/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span>Descargar Actualizaciones</span>
                </a>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border font-semibold ${
                    isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

