// Iconos de tiempo de trazo fino (24×24, currentColor), en texto para usarlos igual en Astro y en el navegador.
// Los códigos son los WMO que devuelve Open-Meteo.

export type Sky = 'clear' | 'few' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'showers' | 'storm' | 'snow';

export function skyOf(code: number): Sky {
  if (code === 0) return 'clear';
  if (code === 1) return 'few';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67)) return 'rain';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 71 && code <= 77) return 'snow';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
const moon = '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>';
const smallSun = '<circle cx="8" cy="8" r="3"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M3.6 3.6l1 1M12.4 3.6l-1 1"/>';
const smallMoon = '<path d="M12 9.5A4.8 4.8 0 0 1 6.5 4a4.8 4.8 0 1 0 5.5 5.5z"/>';
const cloud = '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6-1.2A4.6 4.6 0 0 0 7 18.5z"/>';
const lowCloud = '<path d="M7 16h10.5a3.6 3.6 0 0 0 .3-7.2 5 5 0 0 0-9.6-1A4.1 4.1 0 0 0 7 16z"/>';
const rainLines = '<path d="M9 18.5l-1 3M13 18.5l-1 3M17 18.5l-1 3"/>';
const drops = '<path d="M9 19.5v.1M13 20.5v.1M17 19.5v.1"/>';
const bolt = '<path d="M12.5 16l-2 3.5h3l-2 3.5"/>';
const flakes = '<path d="M9 19v.1M12 21v.1M15 19v.1M18 21v.1"/>';
const fog = '<path d="M4 9h16M3 13h18M5 17h14"/>';

const body: Record<Sky, (day: boolean) => string> = {
  clear: (d) => (d ? sun : moon),
  few: (d) => (d ? sun : moon) + '<path d="M14 19.5h6a2.5 2.5 0 0 0 0-5 3 3 0 0 0-5.6 0"/>',
  partly: (d) => (d ? smallSun : smallMoon) + cloud,
  cloud: () => cloud,
  fog: () => fog,
  drizzle: () => lowCloud + drops,
  rain: () => lowCloud + rainLines,
  showers: (d) => (d ? smallSun : smallMoon) + lowCloud + rainLines,
  storm: () => lowCloud + bolt,
  snow: () => lowCloud + flakes,
};

export function skyIcon(code: number, isDay = true, size = 24) {
  const s = skyOf(code);
  return `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body[s](isDay)}</svg>`;
}

/** Flecha que apunta HACIA donde va el viento o la ola (los datos dicen DE dónde viene). */
export function arrowIcon(fromDeg: number, size = 16) {
  const rot = (fromDeg + 180) % 360;
  return `<svg class="ico arrow" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" style="transform:rotate(${rot}deg)"><path d="M8 2.5v11M4.5 6L8 2.5 11.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
