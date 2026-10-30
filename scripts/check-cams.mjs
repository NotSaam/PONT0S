// Comprueba que cada cámara de src/data/beaches.json sigue respondiendo.
// Uso: node scripts/check-cams.mjs [--json]
// Sale con código 1 si alguna foto o reproductor no responde (lo usa la tarea semanal de GitHub).

import { readFile } from 'node:fs/promises';

const beaches = JSON.parse(await readFile(new URL('../src/data/beaches.json', import.meta.url), 'utf8'));
const asJson = process.argv.includes('--json');

async function probe(url, expectImage) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': 'pont0s-check (https://github.com/NotSaam/PONT0S)' },
    });
    const type = res.headers.get('content-type') ?? '';
    // Leer solo el principio: basta para saber que llega algo.
    await res.body?.cancel();
    const ok = res.ok && (!expectImage || type.startsWith('image/'));
    return { ok, status: res.status, type };
  } catch (e) {
    return { ok: false, status: 0, type: String(e.name ?? e) };
  } finally {
    clearTimeout(timer);
  }
}

const rows = [];
for (const b of beaches) {
  for (const c of b.cams) {
    const target = c.type === 'image' ? c.url : c.type === 'iframe' || c.type === 'hls' ? c.url : c.type === 'youtube' ? `https://i.ytimg.com/vi/${c.url}/hqdefault.jpg` : c.page;
    const r = await probe(target, c.type === 'image');
    rows.push({ beach: b.id, cam: c.id, type: c.type, url: target, ...r });
    if (!asJson) console.log(`${r.ok ? 'OK  ' : 'FALLA'} ${String(r.status).padStart(3)} ${b.id}/${c.id} (${c.type}) ${r.ok ? '' : r.type}`);
  }
}
if (asJson) console.log(JSON.stringify(rows, null, 2));
const bad = rows.filter((r) => !r.ok);
if (!asJson) console.log(`\n${rows.length - bad.length}/${rows.length} cámaras responden.`);
process.exit(bad.length ? 1 : 0);
