// Genera src/data/coast.json: la costa de Galicia como trazados SVG listos para pintar.
// Fuente: líneas de costa de OpenStreetMap (natural=coastline) vía Overpass, © OpenStreetMap contributors (ODbL).
// Se descarga una vez a data/raw/coastline.json; con --refresh se vuelve a pedir.
//
// Pasos: unir los tramos por sus extremos → recortar a la caja → proyectar → simplificar (Douglas-Peucker).
// La proyección (equirectangular con cos(lat0)) es la misma que usa src/lib/geo.ts para situar las playas.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BBOX, VIEW, project } from '../src/lib/projection.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawFile = join(root, 'data/raw/coastline.json');
const outFile = join(root, 'src/data/coast.json');
const refresh = process.argv.includes('--refresh');

const OVERPASS = 'https://overpass-api.de/api/interpreter';
// Un poco más grande que la caja visible para que las líneas salgan por los bordes.
const pad = 0.15;
const query = `[out:json][timeout:180];
way["natural"="coastline"](${BBOX.south - pad},${BBOX.west - pad},${BBOX.north + pad},${BBOX.east + pad});
out geom;`;

async function loadRaw() {
  if (!refresh && existsSync(rawFile)) return JSON.parse(await readFile(rawFile, 'utf8'));
  console.log('Descargando la costa de Overpass…');
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'pont0s-build (open source)' },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();
  await mkdir(dirname(rawFile), { recursive: true });
  await writeFile(rawFile, JSON.stringify(json));
  return json;
}

const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

// Los tramos de costa de OSM van orientados (tierra a la izquierda) y se encadenan fin → inicio.
function stitch(ways) {
  const byStart = new Map();
  for (const w of ways) byStart.set(key(w[0]), w);
  const used = new Set();
  const chains = [];
  const ends = new Set(ways.map((w) => key(w[w.length - 1])));
  // Empezar por los tramos que nadie continúa por detrás (cadenas abiertas) y luego los anillos.
  const starts = ways.filter((w) => !ends.has(key(w[0])));
  const order = [...starts, ...ways];
  for (const first of order) {
    if (used.has(first)) continue;
    used.add(first);
    let chain = [...first];
    for (;;) {
      const next = byStart.get(key(chain[chain.length - 1]));
      if (!next || used.has(next)) break;
      used.add(next);
      chain = chain.concat(next.slice(1));
    }
    chains.push(chain);
  }
  return chains;
}

// Douglas-Peucker iterativo sobre puntos proyectados.
function simplify(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0;
    let idx = -1;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function toPath(points, closed) {
  const r = (n) => Math.round(n * 10) / 10;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += `L${r(points[i][0])} ${r(points[i][1])}`;
  return closed ? `${d}Z` : d;
}

const raw = await loadRaw();
const ways = raw.elements
  .filter((e) => e.type === 'way' && e.geometry?.length > 1)
  .map((e) => e.geometry.map((g) => [g.lon, g.lat]));
console.log(`${ways.length} tramos de costa`);

const chains = stitch(ways);
const tol = Number(process.env.COAST_TOL ?? 0.45);
const lines = [];
const islands = [];
for (const chain of chains) {
  const closed = key(chain[0]) === key(chain[chain.length - 1]);
  const projected = chain.map(([lon, lat]) => project(lon, lat));
  let pts;
  if (closed) {
    // En un anillo el primer y el último punto coinciden: partirlo por el punto más lejano.
    const [x0, y0] = projected[0];
    let far = 1;
    projected.forEach(([x, y], i) => {
      if (Math.hypot(x - x0, y - y0) > Math.hypot(projected[far][0] - x0, projected[far][1] - y0)) far = i;
    });
    pts = simplify(projected.slice(0, far + 1), tol).concat(simplify(projected.slice(far), tol).slice(1));
  } else {
    pts = simplify(projected, tol);
  }
  if (closed) {
    // Islotes de menos de ~2 px de lado no se ven: fuera.
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (size < 2.5 || pts.length < 4) continue;
    islands.push({ d: toPath(pts, true), size: Math.round(size) });
  } else if (pts.length > 1) {
    lines.push({ d: toPath(pts, false), n: pts.length });
  }
}
lines.sort((a, b) => b.n - a.n);
islands.sort((a, b) => b.size - a.size);

// La costa principal entra por el este (Asturias) y sale por el sur (Portugal) con la tierra a la
// izquierda: se cierra por fuera de la vista, por el lado de tierra, para poder rellenarla.
const main = lines[0].d;
const firstY = main.slice(1).split('L')[0].split(' ')[1];
const outside = VIEW.width + 120;
const land = `${main}L${outside} ${VIEW.height + 120}L${outside} ${firstY}Z`;

const out = {
  source: '© OpenStreetMap contributors (ODbL), natural=coastline',
  generated: new Date().toISOString().slice(0, 10),
  view: VIEW,
  bbox: BBOX,
  land,
  others: lines.slice(1).map((l) => l.d),
  islands: islands.map((i) => i.d),
};
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(out));
const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(1);
console.log(`${lines.length} líneas abiertas, ${islands.length} islas → ${outFile} (${kb} KB)`);
