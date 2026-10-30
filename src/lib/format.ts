// Formato de cifras y fechas, siempre en hora de Galicia (Europe/Madrid).

export const TZ = 'Europe/Madrid';

export function dirLabel(deg: number | null | undefined, dirs: readonly string[]) {
  if (deg == null || Number.isNaN(deg)) return '';
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

const nf = (lang: string, digits: number) =>
  new Intl.NumberFormat(lang === 'gl' ? 'gl-ES' : 'es-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export function num(value: number | null | undefined, lang: string, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return nf(lang, digits).format(value);
}

export function hhmm(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).format(d);
}

/** Open-Meteo con timezone=Europe/Madrid devuelve horas locales sin zona: «2026-10-30T14:00». */
export function localHour(isoLocal: string) {
  return isoLocal.slice(11, 13);
}

export function localDate(isoLocal: string) {
  return isoLocal.slice(0, 10);
}

/** «2026-10-30T14:00» (hora local de Madrid) → Date real. */
export function madridLocalToDate(isoLocal: string, utcOffsetSeconds: number) {
  const [d, t = '00:00'] = isoLocal.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, min] = t.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, day, h, min) - utcOffsetSeconds * 1000);
}

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Para buscar sin tildes ni mayúsculas: «Ribeira» = «ribeira», «Muxía» = «muxia». */
export function fold(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
