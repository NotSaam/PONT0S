// Portada: filtrar por zona y texto, ordenar por cercanía, guardar playas, pintar las condiciones
// de cada playa (una sola llamada a Open-Meteo para todas) y refrescar las fotos de las cámaras.
import type { Now } from '../lib/openmeteo';
import { distanceKm, fold, num, hhmm } from '../lib/format';
import { fillTileConditions } from './tiles';
import { loadFavs, toggleFav } from './favs';
import { startLiveImages } from './live-images';

interface Strings {
  noResults: string;
  nearMeActive: string;
  nearMeDenied: string;
  dirs: string[];
  wmo: Record<string, string>;
  updatedAt: string;
  dataError: string;
  save: string;
  saved: string;
  warmest: string;
  biggest: string;
  calmest: string;
  kmAway: string;
}

export function initHome() {
  const strings: Strings = JSON.parse(document.getElementById('home-strings')!.textContent!);
  const lang = document.documentElement.lang;
  const grid = document.querySelector<HTMLUListElement>('[data-grid]')!;
  const tiles = [...grid.querySelectorAll<HTMLLIElement>('[data-tile]')];
  const items = tiles;
  const q = document.querySelector<HTMLInputElement>('[data-q]')!;
  const status = document.querySelector<HTMLElement>('[data-status]')!;
  const nearBtn = document.querySelector<HTMLButtonElement>('[data-near]')!;
  const zoneBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-zones] button')];
  const savedBtn = document.querySelector<HTMLButtonElement>('[data-saved-filter]')!;
  const empty = document.querySelector<HTMLElement>('[data-empty]')!;
  const emptyText = document.querySelector<HTMLElement>('[data-empty-text]')!;
  const lights = [...document.querySelectorAll<SVGAElement>('[data-coast-map] .light')];
  const byId = new Map(items.map((i) => [i.dataset.id!, i]));

  const params = new URLSearchParams(location.search);
  let zone = params.get('zona') ?? 'all';
  let query = params.get('q') ?? '';
  let favs = loadFavs();
  q.value = query;

  // --- guardadas ---
  const syncFavs = () => {
    for (const tile of tiles) {
      tile.querySelector<HTMLButtonElement>('[data-fav]')!.setAttribute('aria-pressed', String(favs.has(tile.dataset.id!)));
    }
    savedBtn.hidden = favs.size === 0;
    if (favs.size === 0 && zone === 'saved') zone = 'all';
  };
  grid.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-fav]');
    if (!btn) return;
    favs = toggleFav(btn.dataset.fav!);
    syncFavs();
    apply();
  });

  // --- filtros ---
  function apply() {
    const f = fold(query);
    let shown = 0;
    for (const item of items) {
      const zoneOk = zone === 'all' || (zone === 'saved' ? favs.has(item.dataset.id!) : item.dataset.zone === zone);
      const textOk = !f || item.dataset.search!.includes(f);
      item.hidden = !(zoneOk && textOk);
      if (!item.hidden) shown++;
    }
    for (const b of zoneBtns) b.setAttribute('aria-pressed', String(b.dataset.zone === zone));
    for (const l of lights) l.classList.toggle('is-dim', !!byId.get(l.dataset.beach!)?.hidden);
    empty.hidden = shown > 0;
    if (shown === 0) emptyText.textContent = strings.noResults.replace('§', query);
    const next = new URLSearchParams();
    if (zone !== 'all') next.set('zona', zone);
    if (query) next.set('q', query);
    const qs = next.toString();
    history.replaceState(null, '', `${qs ? `?${qs}` : location.pathname}${location.hash}`);
  }

  q.addEventListener('input', () => {
    query = q.value.trim();
    apply();
  });
  q.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !query) return;
    const first = items.find((t) => !t.hidden);
    first?.querySelector<HTMLAnchorElement>('a')?.click();
  });
  for (const b of zoneBtns) {
    b.addEventListener('click', () => {
      zone = b.dataset.zone!;
      apply();
    });
  }
  document.querySelector('[data-clear]')?.addEventListener('click', () => {
    query = '';
    q.value = '';
    zone = 'all';
    apply();
    q.focus();
  });

  // --- cercanía ---
  const original = [...tiles];
  const setDist = (el: HTMLElement, text: string) => {
    const d = el.querySelector('[data-dist]');
    if (d) d.textContent = text;
  };
  nearBtn.addEventListener('click', () => {
    if (nearBtn.getAttribute('aria-pressed') === 'true') {
      nearBtn.setAttribute('aria-pressed', 'false');
      original.forEach((t) => grid.append(t));
      items.forEach((i) => setDist(i, ''));
      status.textContent = '';
      return;
    }
    if (!('geolocation' in navigator)) {
      status.textContent = strings.nearMeDenied;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        tiles
          .map((el) => ({ el, d: distanceKm(latitude, longitude, Number(el.dataset.lat), Number(el.dataset.lon)) }))
          .sort((a, b) => a.d - b.d)
          .forEach(({ el, d }) => {
            setDist(el, strings.kmAway.replace('§', num(d, lang, d < 10 ? 1 : 0)));
            grid.append(el);
          });
        nearBtn.setAttribute('aria-pressed', 'true');
        status.textContent = strings.nearMeActive;
      },
      () => {
        status.textContent = strings.nearMeDenied;
      },
      { maximumAge: 10 * 60 * 1000, timeout: 10000 },
    );
  });

  // --- mapa ↔ tarjetas ---
  for (const l of lights) {
    const item = () => byId.get(l.dataset.beach!);
    l.addEventListener('mouseenter', () => item()?.classList.add('is-hot'));
    l.addEventListener('mouseleave', () => item()?.classList.remove('is-hot'));
  }
  const lightOf = (id: string) => lights.find((l) => l.dataset.beach === id);
  for (const t of items) {
    const on = () => lightOf(t.dataset.id!)?.classList.add('is-on');
    const off = () => lightOf(t.dataset.id!)?.classList.remove('is-on');
    t.addEventListener('mouseenter', on);
    t.addEventListener('mouseleave', off);
    t.addEventListener('focusin', on);
    t.addEventListener('focusout', off);
  }

  syncFavs();
  apply();
  startLiveImages(grid);
  void loadConditions(tiles, strings, lang);
}

async function loadConditions(tiles: HTMLLIElement[], s: Strings, lang: string) {
  const data = await fillTileConditions(tiles, s, lang);
  if (data) renderSummary(tiles, data, s, lang);
}

function renderSummary(tiles: HTMLLIElement[], data: Now[], s: Strings, lang: string) {
  const box = document.querySelector<HTMLElement>('[data-summary]');
  const list = document.querySelector<HTMLElement>('[data-summary-list]');
  const time = document.querySelector<HTMLElement>('[data-summary-time]');
  if (!box || !list || !time || !data.length) return;

  const pick = (score: (n: Now) => number | null, best: 'max' | 'min') => {
    let idx = -1;
    let val = best === 'max' ? -Infinity : Infinity;
    data.forEach((n, i) => {
      const v = score(n);
      if (v == null) return;
      if (best === 'max' ? v > val : v < val) {
        val = v;
        idx = i;
      }
    });
    return idx < 0 ? null : { tile: tiles[idx], v: val };
  };

  const link = (tile: HTMLLIElement) => {
    const a = tile.querySelector<HTMLAnchorElement>('a.tile-link')!;
    const name = tile.querySelector('.name')!.textContent;
    return `<a href="${a.getAttribute('href')}">${name}</a>`;
  };
  const rows: string[] = [];
  const warm = pick((n) => n.water, 'max');
  if (warm) rows.push(`<div><dt>${s.warmest}</dt><dd><span class="v">${num(warm.v, lang, 1)}°</span>${link(warm.tile)}</dd></div>`);
  const big = pick((n) => n.wave, 'max');
  if (big) rows.push(`<div><dt>${s.biggest}</dt><dd><span class="v">${num(big.v, lang, 1)} m</span>${link(big.tile)}</dd></div>`);
  const calm = pick((n) => n.wind, 'min');
  if (calm) rows.push(`<div><dt>${s.calmest}</dt><dd><span class="v">${num(calm.v, lang)} km/h</span>${link(calm.tile)}</dd></div>`);
  if (!rows.length) return;
  list.innerHTML = rows.join('');
  time.textContent = s.updatedAt.replace('§', hhmm(new Date()));
  box.hidden = false;
}
