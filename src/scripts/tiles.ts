// Condiciones actuales en la fila de datos de cada tarjeta de playa (portada y «Cerca de aquí»).
import { fetchNowMany, type Now } from '../lib/openmeteo';
import { skyIcon, arrowIcon } from '../lib/icons';
import { dirLabel, num } from '../lib/format';

interface TileStrings {
  dirs: string[];
  wmo: Record<string, string>;
  dataError: string;
}

const cell = (label: string, value: string) => `<span class="lbl">${label}</span> ${value}`;

export async function fillTileConditions(tiles: HTMLLIElement[], s: TileStrings, lang: string): Promise<Now[] | null> {
  if (!tiles.length) return null;
  const points = tiles.map((t) => ({ lat: Number(t.dataset.lat), lon: Number(t.dataset.lon) }));
  let data: Now[];
  try {
    data = await fetchNowMany(points);
  } catch {
    for (const t of tiles) t.querySelector('[data-cond]')!.innerHTML = `<li class="muted">${s.dataError}</li>`;
    return null;
  }
  const gl = lang === 'gl';
  tiles.forEach((t, i) => {
    const n = data[i];
    const ul = t.querySelector<HTMLUListElement>('[data-cond]')!;
    const set = (k: string, html: string, title = '') => {
      const li = ul.querySelector<HTMLLIElement>(`[data-k="${k}"]`)!;
      li.innerHTML = html;
      if (title) li.title = title;
    };
    const sky = n.code != null ? (s.wmo[String(n.code)] ?? '') : '';
    set('sky', n.code != null ? `${skyIcon(n.code, n.isDay, 20)}<span class="sr-only">${sky}</span>` : '', sky);
    set('air', n.temp != null ? `${num(n.temp, lang)}°` : '—');
    set('water', cell(gl ? 'auga' : 'agua', n.water != null ? `${num(n.water, lang)}°` : '—'));
    set(
      'wind',
      n.wind != null && n.windDir != null
        ? `${arrowIcon(n.windDir, 14)}${num(n.wind, lang)} <span class="lbl">km/h ${dirLabel(n.windDir, s.dirs)}</span>`
        : '—',
    );
    set('wave', n.wave != null ? cell(gl ? 'ondas' : 'olas', `${num(n.wave, lang, 1)} m`) : '');
  });
  return data;
}
