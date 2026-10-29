/**
 * Utilidades completas para el tratamiento, validación y formateo de fechas en formato español (DD/MM/YYYY o DDMMYYYY).
 */

/**
 * Convierte cualquier fecha en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) 
 * o texto de fecha estándar a formato español DD/MM/YYYY.
 *
 * Ejemplo: "2026-09-13" -> "13/09/2026"
 *          "13092026"   -> "13/09/2026"
 *          "2026-01-05 14:30:00" -> "05/01/2026"
 */
export function formatearFechaEspanola(fechaStr?: string | null): string {
  if (!fechaStr || typeof fechaStr !== 'string' || fechaStr.trim() === '') {
    return '-';
  }

  const strLimpio = fechaStr.trim();

  // Si ya está en formato DD/MM/YYYY, devolverla directamente
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strLimpio)) {
    return strLimpio;
  }

  // Si está en formato DDMMYYYY (8 dígitos continuos)
  if (/^\d{8}$/.test(strLimpio)) {
    const dia = strLimpio.substring(0, 2);
    const mes = strLimpio.substring(2, 4);
    const anio = strLimpio.substring(4, 8);
    return `${dia}/${mes}/${anio}`;
  }

  // Si está en formato DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(strLimpio)) {
    const [dia, mes, anio] = strLimpio.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  // Extraer la parte de la fecha ignorando la hora
  const soloFecha = strLimpio.includes('T') ? strLimpio.split('T')[0] : strLimpio.split(' ')[0];
  const partes = soloFecha.trim().split('-');

  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    if (anio.length === 4 && mes.length <= 2 && dia.length <= 2) {
      const diaFormateado = dia.padStart(2, '0');
      const mesFormateado = mes.padStart(2, '0');
      return `${diaFormateado}/${mesFormateado}/${anio}`;
    }
  }

  return strLimpio;
}

/**
 * Convierte una fecha en formato español (DD/MM/YYYY o DDMMYYYY o DD-MM-YYYY)
 * a formato ISO estándar YYYY-MM-DD para almacenamiento en SQLite y remisión Verifactu.
 *
 * Ejemplo: "13/09/2026" -> "2026-09-13"
 *          "13092026"   -> "2026-09-13"
 *          "2026-09-13" -> "2026-09-13"
 */
export function parsearFechaEspanolaAIso(fechaStr?: string | null): string {
  if (!fechaStr || typeof fechaStr !== 'string' || fechaStr.trim() === '') {
    return '';
  }

  const str = fechaStr.trim();

  // Si ya es ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Si es DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dia, mes, anio] = str.split('/');
    return `${anio}-${mes}-${dia}`;
  }

  // Si es DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [dia, mes, anio] = str.split('-');
    return `${anio}-${mes}-${dia}`;
  }

  // Si es DDMMYYYY (8 dígitos)
  if (/^\d{8}$/.test(str)) {
    const dia = str.substring(0, 2);
    const mes = str.substring(2, 4);
    const anio = str.substring(4, 8);
    return `${anio}-${mes}-${dia}`;
  }

  return str;
}

/**
 * Aplica máscara de entrada interactiva para formatear texto a DD/MM/YYYY según el usuario escribe.
 * Permite introducir tanto dígitos como barras, evitando caracteres no numéricos.
 */
export function aplicarMascaraFechaEspanola(valor: string): string {
  // Extraer solo dígitos numéricos
  const digitos = valor.replace(/\D/g, '').substring(0, 8);
  if (!digitos) return '';

  if (digitos.length <= 2) {
    return digitos;
  }
  if (digitos.length <= 4) {
    return `${digitos.substring(0, 2)}/${digitos.substring(2)}`;
  }
  return `${digitos.substring(0, 2)}/${digitos.substring(2, 4)}/${digitos.substring(4, 8)}`;
}

/**
 * Valida si una cadena de fecha española es válida (día 01-31, mes 01-12, año coherente).
 */
export function esFechaEspanolaValida(fechaEspanolaStr: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaEspanolaStr.trim())) {
    return false;
  }
  const [dia, mes, anio] = fechaEspanolaStr.split('/').map(Number);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (anio < 1900 || anio > 2100) return false;

  const d = new Date(anio, mes - 1, dia);
  return d.getFullYear() === anio && d.getMonth() === mes - 1 && d.getDate() === dia;
}

/**
 * Formatea una fecha con hora a formato español: DD/MM/YYYY HH:mm
 */
export function formatearFechaHoraEspanola(fechaStr?: string | null): string {
  if (!fechaStr) return '-';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return formatearFechaEspanola(fechaStr);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  } catch {
    return formatearFechaEspanola(fechaStr);
  }
}
