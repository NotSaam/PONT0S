// Comprobaciones del fichero de playas que no dependen de la red.
// node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const beaches = JSON.parse(await readFile(new URL('../src/data/beaches.json', import.meta.url), 'utf8'));
const ZONES = ['marina', 'ferrolterra', 'coruna', 'costa-da-morte', 'rias-baixas'];
const TYPES = ['image', 'iframe', 'youtube', 'hls'];

test('ids únicos y con formato', () => {
  const ids = beaches.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  const cams = beaches.flatMap((b) => b.cams.map((c) => c.id));
  assert.equal(new Set(cams).size, cams.length, 'ids de cámara repetidos');
});

test('cada playa está en Galicia y en una zona conocida', () => {
  for (const b of beaches) {
    assert.ok(ZONES.includes(b.zone), `${b.id}: zona ${b.zone}`);
    assert.ok(b.lat > 41.7 && b.lat < 44.1 && b.lon > -9.7 && b.lon < -6.8, `${b.id}: coordenadas`);
    assert.ok(b.name && b.municipality && b.province, `${b.id}: faltan nombre, concello o provincia`);
  }
});

test('cada cámara se ve dentro de la web, por https y con su fuente', () => {
  for (const b of beaches) {
    assert.ok(b.cams.length > 0, `${b.id}: sin cámaras`);
    for (const c of b.cams) {
      assert.ok(TYPES.includes(c.type), `${c.id}: tipo ${c.type}`);
      assert.ok(c.provider, `${c.id}: falta provider`);
      assert.match(c.page, /^https?:\/\//, `${c.id}: falta page`);
      assert.ok(c.url, `${c.id}: falta url`);
      if (['image', 'iframe', 'hls'].includes(c.type)) assert.match(c.url, /^https:\/\//, `${c.id}: debe ir por https`);
      if (c.type === 'youtube') assert.match(c.url, /^[\w-]{11}$/, `${c.id}: id de YouTube`);
    }
  }
});
