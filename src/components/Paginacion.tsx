import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from '../utils/icons';

interface PaginacionProps {
  paginaActual: number;
  totalElementos: number;
  elementosPorPagina: number;
  opcionesElementosPorPagina?: number[];
  onCambioPagina: (pagina: number) => void;
  onCambioElementosPorPagina: (elementos: number) => void;
  theme?: 'dark' | 'light';
}

export const Paginacion: React.FC<PaginacionProps> = ({
  paginaActual,
  totalElementos,
  elementosPorPagina,
  opcionesElementosPorPagina = [5, 10, 25, 50, 100],
  onCambioPagina,
  onCambioElementosPorPagina,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const totalPaginas = Math.ceil(totalElementos / elementosPorPagina) || 1;
  const desde = totalElementos === 0 ? 0 : (paginaActual - 1) * elementosPorPagina + 1;
  const hasta = Math.min(paginaActual * elementosPorPagina, totalElementos);

  // Calcular el rango de páginas a mostrar en los botones numerados
  const obtenerPaginasVisibles = (): number[] => {
    const maxVisibles = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxVisibles / 2));
    let fin = inicio + maxVisibles - 1;

    if (fin > totalPaginas) {
      fin = totalPaginas;
      inicio = Math.max(1, fin - maxVisibles + 1);
    }

    const paginas: number[] = [];
    for (let p = inicio; p <= fin; p++) {
      paginas.push(p);
    }
    return paginas;
  };

  const paginasVisibles = obtenerPaginasVisibles();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t text-xs font-medium ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
      }`}
    >
      {/* Selector de Elementos por Página e Información de Rango */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={elementosPorPagina}
            onChange={(e) => {
              onCambioElementosPorPagina(Number(e.target.value));
              onCambioPagina(1);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-800 shadow-sm'
            }`}
          >
            {opcionesElementosPorPagina.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
          <span>por página</span>
        </div>

        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
          | Mostrando <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{desde}</strong> a{' '}
          <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{hasta}</strong> de{' '}
          <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{totalElementos}</strong> resultados
        </span>
      </div>

      {/* Controles de Navegación entre Páginas */}
      <div className="flex items-center gap-1.5">
        {/* Ir a la primera página */}
        <button
          onClick={() => onCambioPagina(1)}
          disabled={paginaActual <= 1}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            paginaActual <= 1
              ? isDark
                ? 'text-slate-700 cursor-not-allowed'
                : 'text-slate-300 cursor-not-allowed'
              : isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Primera página"
        >
          <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-xs" />
        </button>

        {/* Página anterior */}
        <button
          onClick={() => onCambioPagina(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            paginaActual <= 1
              ? isDark
                ? 'text-slate-700 cursor-not-allowed'
                : 'text-slate-300 cursor-not-allowed'
              : isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Página anterior"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>

        {/* Botones de páginas numeradas */}
        {paginasVisibles.map((p) => {
          const esActiva = p === paginaActual;
          return (
            <button
              key={p}
              onClick={() => onCambioPagina(p)}
              className={`w-8 h-8 rounded-xl font-bold transition-all text-xs ${
                esActiva
                  ? 'bg-gradient-to-r from-[#0055ff] to-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Página siguiente */}
        <button
          onClick={() => onCambioPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            paginaActual >= totalPaginas
              ? isDark
                ? 'text-slate-700 cursor-not-allowed'
                : 'text-slate-300 cursor-not-allowed'
              : isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Página siguiente"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>

        {/* Ir a la última página */}
        <button
          onClick={() => onCambioPagina(totalPaginas)}
          disabled={paginaActual >= totalPaginas}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            paginaActual >= totalPaginas
              ? isDark
                ? 'text-slate-700 cursor-not-allowed'
                : 'text-slate-300 cursor-not-allowed'
              : isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Última página"
        >
          <FontAwesomeIcon icon={faAngleDoubleRight} className="text-xs" />
        </button>
      </div>
    </div>
  );
};
