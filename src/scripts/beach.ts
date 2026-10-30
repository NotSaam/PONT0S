// Ficha de playa: ahora, marea de hoy, próximas horas y próximos días (Open-Meteo, desde el navegador).
import { fetchBeach, tideExtremes, type BeachForecast } from '../lib/openmeteo';
import { skyIcon, arrowIcon } from '../lib/icons';
import { dirLabel, num, hhmm, localHour, localDate } from '../lib/format';
import { loadFavs, toggleFav } from './favs';
import { fillTileConditions } from './tiles';

interface Strings {
  dirs: string[];
  wmo: Record<string, string>;
  weekday: string[];
  today: string;
  highTide: string;
  lowTide: string;
  feels: string;
  gusts: string;
  period: string;
  dataError: string;
  updatedAt: string;
  rows: Record<'hour' | 'sky' | 'temp' | 'rain' | 'wind' | 'wave' | 'uv', string>;
  now: string;
  noTide: string;
}

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

export function initBeach() {
  const page = $('[data-beach-page]');
  if (!page) return;
  const s: Strings = JSON.parse($('#beach-strings')!.textContent!);
  const lang = document.documentElement.lang;
  const lat = Number(page.dataset.lat);
  const lon = Number(page.dataset.lon);

  setupFav(page.dataset.id!);
  void load(s, lang, lat, lon);

  const near = [...document.querySelectorAll<HTMLLIElement>('.near-grid [data-tile]')];
  void fillTileConditions(near, s, lang);
  for (const t of near) {
    const btn = t.querySelector<HTMLButtonElement>('[data-fav]')!;
    btn.setAttribute('aria-pressed', String(loadFavs().has(t.dataset.id!)));
    btn.addEventListener('click', () => btn.setAttribute('aria-pressed', String(toggleFav(t.dataset.id!).has(t.dataset.id!))));
  }
}

function setupFav(id: string) {
  const btn = $<HTMLButtonElement>('.save[data-fav]');
  const label = $('[data-fav-label]');
  if (!btn || !label) return;
  const paint = (on: boolean) => {
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = (on ? label.dataset.on : label.dataset.off) ?? '';
  };
  paint(loadFavs().has(id));
  btn.addEventListener('click', () => paint(toggleFav(id).has(id)));
}

async function load(s: Strings, lang: string, lat: number, lon: number) {
  const stamp = $('[data-now-time]')!;
  let f: BeachForecast;
  try {
    f = await fetchBeach({ lat, lon });
  } catch {
    stamp.innerHTML = `${s.dataError} <button type="button" class="retry">↻</button>`;
    stamp.querySelector('button')?.addEventListener('click', () => {
      stamp.textContent = '…';
      void load(s, lang, lat, lon);
    });
    return;
  }
  renderNow(f, s, lang);
  renderTide(f, s, lang);
  renderHours(f, s, lang);
  renderDays(f, s, lang);
  stamp.textContent = s.updatedAt.replace('§', hhmm(new Date()));
}

function currentIndex(times: string[], nowLocal: string) {
  const hourKey = nowLocal.slice(0, 13);
  const i = times.findIndex((t) => t.slice(0, 13) === hourKey);
  return i < 0 ? 0 : i;
}

function seaAt(f: BeachForecast, time: string) {
  if (!f.sea) return -1;
  return f.sea.time.indexOf(time);
}

function renderNow(f: BeachForecast, s: Strings, lang: string) {
  const n = f.now as BeachForecast['now'] & { feels?: number; uv?: number };
  const set = (sel: string, html: string) => {
    const el = $(sel);
    if (el) el.innerHTML = html;
  };
  if (n.code != null) {
    set('[data-now-ico]', skyIcon(n.code, n.isDay, 48));
    set('[data-now-sky]', s.wmo[String(n.code)] ?? '');
  }
  set('[data-now-temp]', n.temp != null ? `${num(n.temp, lang)}°` : '—');
  if (n.feels != null) set('[data-now-feels]', `${s.feels} ${num(n.feels, lang)}°`);
  if (n.wind != null && n.windDir != null) {
    set(
      '[data-now-wind]',
      `${arrowIcon(n.windDir)} ${num(n.wind, lang)} km/h ${dirLabel(n.windDir, s.dirs)}` +
        (n.gust != null ? ` <span class="sub">${s.gusts} ${num(n.gust, lang)}</span>` : ''),
    );
  }
  if (n.wave != null) {
    set(
      '[data-now-wave]',
      `${n.waveDir != null ? arrowIcon(n.waveDir) : ''} ${num(n.wave, lang, 1)} m` +
        (n.wavePeriod != null ? ` <span class="sub">${s.period} ${num(n.wavePeriod, lang)} s</span>` : ''),
    );
  }
  const hi = currentIndex(f.hourly.time, n.time ?? f.hourly.time[0]);
  const si = seaAt(f, f.hourly.time[hi]);
  if (f.sea && si >= 0 && f.sea.swell[si] != null) {
    const dir = f.sea.swellDir[si];
    set(
      '[data-now-swell]',
      `${dir != null ? arrowIcon(dir) : ''} ${num(f.sea.swell[si], lang, 1)} m` +
        (f.sea.swellPeriod[si] != null ? ` <span class="sub">${s.period} ${num(f.sea.swellPeriod[si], lang)} s</span>` : ''),
    );
  }
  if (n.water != null) set('[data-now-water]', `${num(n.water, lang, 1)}°`);
  if (n.uv != null) set('[data-now-uv]', num(n.uv, lang));
  if (f.daily.sunrise[0]) set('[data-now-sunrise]', f.daily.sunrise[0].slice(11, 16));
  if (f.daily.sunset[0]) set('[data-now-sunset]', f.daily.sunset[0].slice(11, 16));
}

/** Curva suave por los puntos (Catmull-Rom → Bézier). */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function renderTide(f: BeachForecast, s: Strings, lang: string) {
  const box = $('[data-tide]')!;
  if (!f.sea || !f.sea.level.some((v) => v != null)) {
    box.innerHTML = `<p class="muted">${s.noTide}</p>`;
    return;
  }
  const today = localDate(f.hourly.time[0]);
  const idx: number[] = [];
  f.sea.time.forEach((t, i) => {
    if (localDate(t) === today || t === `${nextDay(today)}T00:00`) idx.push(i);
  });
  const lv = idx.map((i) => f.sea!.level[i]);
  if (lv.filter((v) => v != null).length < 12) {
    box.innerHTML = `<p class="muted">${s.noTide}</p>`;
    return;
  }

  const W = 720;
  const H = 190;
  const top = 34;
  const bottom = 150;
  const vals = lv.filter((v): v is number => v != null);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (h: number) => (h / 24) * W;
  const y = (v: number) => bottom - ((v - min) / span) * (bottom - top);
  const pts: [number, number][] = [];
  lv.forEach((v, h) => v != null && pts.push([x(h), y(v)]));
  const curve = smooth(pts);
  const area = `${curve}L${pts[pts.length - 1][0]} ${bottom + 16}L${pts[0][0]} ${bottom + 16}Z`;

  // Noche: antes de salir el sol y después de ponerse.
  const hourOf = (iso?: string) => (iso ? Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60 : null);
  const rise = hourOf(f.daily.sunrise[0]);
  const set = hourOf(f.daily.sunset[0]);
  const night =
    rise != null && set != null
      ? `<rect class="night" x="0" y="0" width="${x(rise)}" height="${bottom + 16}"/><rect class="night" x="${x(set)}" y="0" width="${W - x(set)}" height="${bottom + 16}"/>`
      : '';

  const ext = tideExtremes(f.sea.time, f.sea.level).filter((e) => localDate(e.time) === today);
  const labels = ext
    .map((e) => {
      const h = hourOf(e.time)!;
      const ex = x(h);
      const ey = y(e.level);
      const above = e.kind === 'high';
      const ty = above ? ey - 12 : ey + 24;
      const anchor = ex < 40 ? 'start' : ex > W - 40 ? 'end' : 'middle';
      const name = e.kind === 'high' ? s.highTide : s.lowTide;
      return `<circle class="ext" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.5"/><text class="ext-t" x="${ex.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}"><tspan class="ext-n">${name}</tspan> ${e.time.slice(11, 16)}</text>`;
    })
    .join('');

  const nowLocal = f.now.time ?? f.hourly.time[0];
  const nowH = hourOf(nowLocal) ?? 0;
  const nx = x(nowH);
  let ny = bottom;
  const hi = Math.floor(nowH);
  const a = lv[hi];
  const b = lv[hi + 1];
  if (a != null && b != null) ny = y(a + (b - a) * (nowH - hi));
  const nowMark = `<line class="now-l" x1="${nx}" x2="${nx}" y1="${top - 22}" y2="${bottom + 16}"/><circle class="now-d" cx="${nx}" cy="${ny}" r="5"/><text class="now-t" x="${nx + (nx > W - 60 ? -6 : 6)}" y="${top - 12}" text-anchor="${nx > W - 60 ? 'end' : 'start'}">${s.now} ${nowLocal.slice(11, 16)}</text>`;

  const ticks = [0, 3, 6, 9, 12, 15, 18, 21, 24]
    .map((h) => `<text class="tick" x="${x(h)}" y="${H - 6}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${String(h % 24).padStart(2, '0')}</text>`)
    .join('');

  const summary = ext.map((e) => `${e.kind === 'high' ? s.highTide : s.lowTide} ${e.time.slice(11, 16)}`).join(', ');
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}">
    <style>
      .night{fill:var(--paper-2)}
      .area{fill:var(--shoal)}
      .curve{fill:none;stroke:var(--ink);stroke-width:1.6}
      .base{stroke:var(--rule)}
      .ext{fill:var(--paper);stroke:var(--ink);stroke-width:1.4}
      .ext-t{font:13px var(--sans);fill:var(--ink)}
      .ext-n{fill:var(--ink-2)}
      .now-l{stroke:var(--accent);stroke-width:1.5}
      .now-d{fill:var(--accent)}
      .now-t{font:600 13px var(--sans);fill:var(--accent)}
      .tick{font:12px var(--sans);fill:var(--ink-2)}
    </style>
    ${night}
    <path class="area" d="${area}"/>
    <path class="curve" d="${curve}"/>
    <line class="base" x1="0" x2="${W}" y1="${bottom + 16}" y2="${bottom + 16}"/>
    ${labels}
    ${nowMark}
    ${ticks}
  </svg>`;
  void lang;
}

function nextDay(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(isoDate: string, s: Strings) {
  return s.weekday[new Date(`${isoDate}T12:00:00Z`).getUTCDay()];
}

function renderHours(f: BeachForecast, s: Strings, lang: string) {
  const box = $('[data-hours]')!;
  const h = f.hourly;
  const start = currentIndex(h.time, f.now.time ?? h.time[0]);
  const idx = Array.from({ length: 24 }, (_, k) => start + k).filter((i) => i < h.time.length);

  const head = idx
    .map((i, k) => {
      const hr = localHour(h.time[i]);
      const day = hr === '00' && k > 0 ? `<br><span class="muted">${weekdayOf(localDate(h.time[i]), s)}</span>` : '';
      const cls = [k === 0 ? 'is-now' : '', hr === '00' && k > 0 ? 'daybreak' : ''].join(' ').trim();
      return `<th scope="col" class="${cls}">${k === 0 ? s.now : `${hr}h`}${day}</th>`;
    })
    .join('');

  const row = (label: string, cell: (i: number) => string) =>
    `<tr><th scope="row">${label}</th>${idx
      .map((i, k) => `<td class="${localHour(h.time[i]) === '00' && k > 0 ? 'daybreak' : ''}">${cell(i)}</td>`)
      .join('')}</tr>`;

  const sea = (i: number) => seaAt(f, h.time[i]);
  const html = `<table>
    <thead><tr><th scope="row">${s.rows.hour}</th>${head}</tr></thead>
    <tbody>
      ${row(s.rows.sky, (i) => (h.code[i] != null ? `<span class="cell-ico" title="${s.wmo[String(h.code[i])] ?? ''}">${skyIcon(h.code[i]!, h.isDay[i] !== 0, 24)}<span class="sr-only">${s.wmo[String(h.code[i])] ?? ''}</span></span>` : '—'))}
      ${row(s.rows.temp, (i) => (h.temp[i] != null ? `<strong>${num(h.temp[i], lang)}°</strong>` : '—'))}
      ${row(s.rows.rain, (i) => (h.rainProb[i] != null ? `${num(h.rainProb[i], lang)}%` : '—'))}
      ${row(s.rows.wind, (i) => (h.wind[i] != null && h.windDir[i] != null ? `<span class="wind-cell">${arrowIcon(h.windDir[i]!, 13)}${num(h.wind[i], lang)}</span>` : '—'))}
      ${f.sea ? row(s.rows.wave, (i) => { const j = sea(i); return j >= 0 && f.sea!.wave[j] != null ? num(f.sea!.wave[j], lang, 1) : '—'; }) : ''}
      ${row(s.rows.uv, (i) => (h.uv[i] != null ? num(h.uv[i], lang) : '—'))}
    </tbody>
  </table>`;
  box.innerHTML = html;
}

function renderDays(f: BeachForecast, s: Strings, lang: string) {
  const ol = $('[data-days]')!;
  const d = f.daily;
  ol.innerHTML = d.time
    .map((day, i) => {
      const name = i === 0 ? s.today : `${weekdayOf(day, s)} ${Number(day.slice(8, 10))}`;
      const code = d.code[i];
      const wdir = d.windDir[i];
      return `<li>
        <span class="d-name">${name}</span>
        <span class="cell-ico" title="${code != null ? (s.wmo[String(code)] ?? '') : ''}">${code != null ? skyIcon(code, true, 26) : ''}<span class="sr-only">${code != null ? (s.wmo[String(code)] ?? '') : ''}</span></span>
        <span class="d-range"><strong>${num(d.max[i], lang)}°</strong><span class="d-min">${num(d.min[i], lang)}°</span></span>
        <span class="d-rain">${d.rainProb[i] != null ? `<span class="sr-only">${s.rows.rain}</span>${num(d.rainProb[i], lang)}%` : ''}</span>
        <span class="d-wind"><span class="sr-only">${s.rows.wind}</span>${wdir != null ? arrowIcon(wdir, 13) : ''}${num(d.windMax[i], lang)} km/h</span>
        <span class="d-wave">${d.waveMax[i] != null ? `<span class="sr-only">${s.rows.wave}</span>${num(d.waveMax[i], lang, 1)} m` : ''}</span>
      </li>`;
    })
    .join('');
}
