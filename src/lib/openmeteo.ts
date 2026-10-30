// Cliente de Open-Meteo para el navegador (sin clave, con CORS). Datos CC BY 4.0, «Weather data by Open-Meteo.com».
// - Portada: UNA llamada de tiempo y UNA de mar para todas las playas a la vez (varias coordenadas por llamada).
// - Ficha de playa: horas y días para un punto.
// Las respuestas se guardan 15 min en sessionStorage para no repetir llamadas al navegar.

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const TTL = 15 * 60 * 1000;

export interface Point {
  lat: number;
  lon: number;
}

export interface Now {
  time: string;
  temp: number | null;
  code: number | null;
  isDay: boolean;
  wind: number | null;
  windDir: number | null;
  gust: number | null;
  wave: number | null;
  waveDir: number | null;
  wavePeriod: number | null;
  water: number | null;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < TTL ? (data as T) : null;
  } catch {
    return null;
  }
}

function cacheSet(key: string, data: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* modo privado o cuota llena: seguimos sin caché */
  }
}

async function getJson(url: string, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const coords = (pts: Point[]) => ({
  latitude: pts.map((p) => p.lat.toFixed(4)).join(','),
  longitude: pts.map((p) => p.lon.toFixed(4)).join(','),
});

const asArray = <T>(json: T | T[]): T[] => (Array.isArray(json) ? json : [json]);

/** Condiciones actuales de muchas playas: un índice por punto, en el mismo orden. */
export async function fetchNowMany(points: Point[]): Promise<Now[]> {
  const key = `om:now:${points.map((p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`).join(';')}`;
  const cached = cacheGet<Now[]>(key);
  if (cached) return cached;

  const c = coords(points);
  const weatherUrl = `${FORECAST}?${new URLSearchParams({
    ...c,
    current: 'temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    timezone: 'Europe/Madrid',
    wind_speed_unit: 'kmh',
    // Sin esto, la celda por defecto puede caer tierra adentro (A Coruña: 5,6 km y 2 °C de diferencia).
    cell_selection: 'nearest',
  })}`;
  const marineUrl = `${MARINE}?${new URLSearchParams({
    ...c,
    current: 'wave_height,wave_direction,wave_period,sea_surface_temperature',
    timezone: 'Europe/Madrid',
  })}`;

  const [w, m] = await Promise.allSettled([getJson(weatherUrl), getJson(marineUrl)]);
  if (w.status === 'rejected' && m.status === 'rejected') throw w.reason;
  const ws = w.status === 'fulfilled' ? asArray(w.value) : [];
  const ms = m.status === 'fulfilled' ? asArray(m.value) : [];

  const out = points.map((_, i): Now => {
    const cw = ws[i]?.current ?? {};
    const cm = ms[i]?.current ?? {};
    return {
      time: cw.time ?? cm.time ?? '',
      temp: cw.temperature_2m ?? null,
      code: cw.weather_code ?? null,
      isDay: cw.is_day !== 0,
      wind: cw.wind_speed_10m ?? null,
      windDir: cw.wind_direction_10m ?? null,
      gust: cw.wind_gusts_10m ?? null,
      wave: cm.wave_height ?? null,
      waveDir: cm.wave_direction ?? null,
      wavePeriod: cm.wave_period ?? null,
      water: cm.sea_surface_temperature ?? null,
    };
  });
  cacheSet(key, out);
  return out;
}

export interface BeachForecast {
  utcOffset: number;
  now: Now;
  hourly: {
    time: string[];
    temp: (number | null)[];
    feels: (number | null)[];
    code: (number | null)[];
    isDay: (number | null)[];
    rainProb: (number | null)[];
    rain: (number | null)[];
    wind: (number | null)[];
    windDir: (number | null)[];
    gust: (number | null)[];
    uv: (number | null)[];
  };
  daily: {
    time: string[];
    code: (number | null)[];
    max: (number | null)[];
    min: (number | null)[];
    sunrise: string[];
    sunset: string[];
    uvMax: (number | null)[];
    rainProb: (number | null)[];
    rainSum: (number | null)[];
    windMax: (number | null)[];
    windDir: (number | null)[];
    waveMax: (number | null)[];
  };
  sea: {
    time: string[];
    wave: (number | null)[];
    waveDir: (number | null)[];
    wavePeriod: (number | null)[];
    swell: (number | null)[];
    swellDir: (number | null)[];
    swellPeriod: (number | null)[];
    water: (number | null)[];
    level: (number | null)[];
  } | null;
}

export async function fetchBeach(p: Point): Promise<BeachForecast> {
  const key = `om:beach:${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
  const cached = cacheGet<BeachForecast>(key);
  if (cached) return cached;

  const c = coords([p]);
  const weatherUrl = `${FORECAST}?${new URLSearchParams({
    ...c,
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
    hourly:
      'temperature_2m,apparent_temperature,weather_code,is_day,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
    timezone: 'Europe/Madrid',
    wind_speed_unit: 'kmh',
    cell_selection: 'nearest',
    forecast_days: '7',
  })}`;
  const marineUrl = `${MARINE}?${new URLSearchParams({
    ...c,
    current: 'wave_height,wave_direction,wave_period,sea_surface_temperature',
    hourly:
      'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature,sea_level_height_msl',
    daily: 'wave_height_max',
    timezone: 'Europe/Madrid',
    forecast_days: '7',
  })}`;

  const [w, m] = await Promise.allSettled([getJson(weatherUrl), getJson(marineUrl)]);
  if (w.status === 'rejected') throw w.reason;
  const W = w.value;
  const M = m.status === 'fulfilled' ? m.value : null;
  const cw = W.current ?? {};
  const cm = M?.current ?? {};
  const h = W.hourly;
  const d = W.daily;
  const mh = M?.hourly;

  const out: BeachForecast = {
    utcOffset: W.utc_offset_seconds ?? 0,
    now: {
      time: cw.time,
      temp: cw.temperature_2m ?? null,
      code: cw.weather_code ?? null,
      isDay: cw.is_day !== 0,
      wind: cw.wind_speed_10m ?? null,
      windDir: cw.wind_direction_10m ?? null,
      gust: cw.wind_gusts_10m ?? null,
      wave: cm.wave_height ?? null,
      waveDir: cm.wave_direction ?? null,
      wavePeriod: cm.wave_period ?? null,
      water: cm.sea_surface_temperature ?? null,
    },
    hourly: {
      time: h.time,
      temp: h.temperature_2m,
      feels: h.apparent_temperature,
      code: h.weather_code,
      isDay: h.is_day,
      rainProb: h.precipitation_probability,
      rain: h.precipitation,
      wind: h.wind_speed_10m,
      windDir: h.wind_direction_10m,
      gust: h.wind_gusts_10m,
      uv: h.uv_index,
    },
    daily: {
      time: d.time,
      code: d.weather_code,
      max: d.temperature_2m_max,
      min: d.temperature_2m_min,
      sunrise: d.sunrise,
      sunset: d.sunset,
      uvMax: d.uv_index_max,
      rainProb: d.precipitation_probability_max,
      rainSum: d.precipitation_sum,
      windMax: d.wind_speed_10m_max,
      windDir: d.wind_direction_10m_dominant,
      waveMax: M?.daily?.wave_height_max ?? d.time.map(() => null),
    },
    sea: mh
      ? {
          time: mh.time,
          wave: mh.wave_height,
          waveDir: mh.wave_direction,
          wavePeriod: mh.wave_period,
          swell: mh.swell_wave_height,
          swellDir: mh.swell_wave_direction,
          swellPeriod: mh.swell_wave_period,
          water: mh.sea_surface_temperature,
          level: mh.sea_level_height_msl,
        }
      : null,
  };
  // La sensación térmica actual va aparte para no ensuciar Now.
  (out.now as Now & { feels?: number }).feels = cw.apparent_temperature;
  (out.now as Now & { uv?: number }).uv = cw.uv_index;
  cacheSet(key, out);
  return out;
}

/** Pleamares y bajamares a partir de la serie horaria de nivel del mar (extremos locales, interpolados). */
export function tideExtremes(time: string[], level: (number | null)[]) {
  const out: { time: string; level: number; kind: 'high' | 'low' }[] = [];
  for (let i = 1; i < level.length - 1; i++) {
    const a = level[i - 1];
    const b = level[i];
    const c = level[i + 1];
    if (a == null || b == null || c == null) continue;
    const isHigh = b > a && b >= c;
    const isLow = b < a && b <= c;
    if (!isHigh && !isLow) continue;
    // Vértice de la parábola por los tres puntos: afina la hora a minutos.
    const denom = a - 2 * b + c;
    const offset = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
    const peak = b - 0.25 * (a - c) * offset;
    const base = new Date(`${time[i]}:00Z`).getTime() + offset * 3600_000;
    const iso = new Date(base).toISOString().slice(0, 16);
    out.push({ time: iso, level: peak, kind: isHigh ? 'high' : 'low' });
  }
  return out;
}
