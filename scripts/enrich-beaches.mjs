// Añade a cada lugar de src/data/beaches.json la bandera azul y la calidad del agua oficiales.
// Escribe src/data/beach-info.json (por id de lugar). Repetirlo cada junio, cuando salen los datos nuevos.
//
// Fuentes:
// - Praias galegas con bandeira azul 2026, Xunta de Galicia (Abert@s), CC BY-SA 4.0.
// - Bathing Water Directive, temporada 2025, EEA (datos de Náyade, Ministerio de Sanidad), CC BY 4.0.
//
// Emparejar: punto oficial a menos de MAX_KM del lugar Y alguna palabra del nombre en común.
// Las coordenadas de muchas cámaras son aproximadas, así que sin nombre en común no se asigna nada.

import { readFile, writeFile } from 'node:fs/promises';

const BLUE_FLAG_CSV =
  'https://abertos.xunta.gal/catalogo/cultura-ocio-deporte/-/dataset/0697/praias-galegas-con-bandeira-azul-2026/001/descarga-directa-ficheiro.csv';
const BLUE_FLAG_YEAR = 2026;
const EEA_LAYER =
  'https://water.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2025/MapServer/3/query';
const EEA_SEASON = 2025;
const MAX_KM = 3;

const root = new URL('..', import.meta.url);
const places = JSON.parse(await readFile(new URL('src/data/beaches.json', root), 'utf8'));

const fold = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const STOP = new Set(
  'praia playa praias playas porto puerto de da do das dos del la las los el a o as os e y en pm1 pm2 pm3 ria costa illa isla illas islas cabo punta'.split(' '),
);
const words = (s) => new Set(fold(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 4 && !STOP.has(w)));
const shared = (a, b) => {
  let n = 0;
  for (const w of a) for (const v of b) if (w === v || (w.length >= 5 && v.length >= 5 && (w.startsWith(v) || v.startsWith(w)))) n++;
  return n;
};
// Español ↔ gallego en los nombres de playa más comunes.
const alias = (s) => s.replace(/catedrales/gi, 'catedrais').replace(/riazor/gi, 'riazor').replace(/lanzada/gi, 'lanzada').replace(/orzan/gi, 'orzan');

function km(aLat, aLon, bLat, bLon) {
  const r = Math.PI / 180;
  const h = Math.sin(((bLat - aLat) * r) / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLon - aLon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function bestMatch(place, list) {
  // El nombre del concello no cuenta: «Ría de Camariñas» no es la playa «O Lago - Camariñas».
  const town = words(place.municipality);
  const pw = new Set(
    [...words(place.name), ...place.cams.flatMap((c) => [...words(c.label ?? '')])].filter((w) => !town.has(w)),
  );
  let best = null;
  for (const item of list) {
    const d = km(place.lat, place.lon, item.lat, item.lon);
    if (d > MAX_KM) continue;
    const n = shared(pw, words(alias(item.name)));
    if (!n) continue;
    if (!best || n > best.n || (n === best.n && d < best.d)) best = { item, d, n };
  }
  return best?.item ?? null;
}

async function blueFlags() {
  const res = await fetch(BLUE_FLAG_CSV, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Xunta CSV ${res.status}`);
  const text = (await res.text()).replace(/^﻿/, '');
  const [head, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const cols = head.split(';').map((c) => fold(c.trim()));
  const at = (name) => cols.findIndex((c) => c.startsWith(name));
  const iName = at('praia');
  const iCoords = at('coordenadas');
  const iLen = at('lonxitude');
  const iArea = at('tipo de area');
  return rows
    .map((r) => r.split(';'))
    .map((r) => {
      const [lat, lon] = (r[iCoords] ?? '').split(',').map(Number);
      return { name: r[iName]?.trim(), lat, lon, lengthM: Number(r[iLen]) || undefined, sand: r[iArea]?.trim() || undefined };
    })
    .filter((b) => b.name && Number.isFinite(b.lat) && Number.isFinite(b.lon));
}

async function bathingWaters() {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const qs = new URLSearchParams({
      where: "bathingWaterIdentifier LIKE 'ES11%'",
      outFields: 'bathingWaterIdentifier,bathingWaterName,bwWaterCategory,latitude,longitude,qualityStatus',
      f: 'json',
      resultOffset: String(offset),
      resultRecordCount: '1000',
    });
    const res = await fetch(`${EEA_LAYER}?${qs}`);
    if (!res.ok) throw new Error(`EEA ${res.status}`);
    const json = await res.json();
    for (const f of json.features ?? []) {
      const a = f.attributes;
      if (a.bwWaterCategory === 'River' || a.bwWaterCategory === 'Lake') continue;
      out.push({ id: a.bathingWaterIdentifier, name: a.bathingWaterName, lat: a.latitude, lon: a.longitude, quality: a.qualityStatus });
    }
    if (!json.exceededTransferLimit) break;
  }
  return out;
}

const QUALITY = { Excellent: 'excellent', Good: 'good', Sufficient: 'sufficient', Poor: 'poor' };

const [flags, waters] = await Promise.all([blueFlags(), bathingWaters()]);
console.log(`${flags.length} banderas azules ${BLUE_FLAG_YEAR}, ${waters.length} zonas de baño costeras`);

const info = {};
for (const p of places) {
  const flag = bestMatch(p, flags);
  const water = bestMatch(p, waters);
  const entry = {};
  if (flag) entry.blueFlag = { year: BLUE_FLAG_YEAR, name: flag.name };
  if (flag?.lengthM) entry.lengthM = flag.lengthM;
  if (flag?.sand) entry.sand = flag.sand;
  if (water && QUALITY[water.quality]) entry.water = { season: EEA_SEASON, quality: QUALITY[water.quality], name: water.name, id: water.id };
  if (Object.keys(entry).length) info[p.id] = entry;
}

await writeFile(new URL('src/data/beach-info.json', root), `${JSON.stringify(info, null, 2)}\n`);
const n = Object.keys(info).length;
console.log(`${n}/${places.length} lugares con datos oficiales → src/data/beach-info.json`);
for (const [id, e] of Object.entries(info)) {
  console.log(`  ${id}: ${e.blueFlag ? `bandera azul (${e.blueFlag.name})` : ''}${e.water ? ` agua ${e.water.quality} (${e.water.name})` : ''}`);
}
