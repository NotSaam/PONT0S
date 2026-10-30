// Proyección compartida por el mapa de la costa (build) y las playas (web).
// Equirectangular con la escala horizontal corregida por cos(lat0): a esta escala basta.

export const BBOX = { west: -9.6, east: -6.95, south: 41.8, north: 44.02 };

const lat0 = ((BBOX.south + BBOX.north) / 2) * (Math.PI / 180);
const kx = Math.cos(lat0);

// Ancho fijo; el alto sale de la proporción real de la caja.
const WIDTH = 1000;
const spanX = (BBOX.east - BBOX.west) * kx;
const spanY = BBOX.north - BBOX.south;
const HEIGHT = Math.round((WIDTH * spanY) / spanX);

export const VIEW = { width: WIDTH, height: HEIGHT };

/** @returns {[number, number]} x, y en el viewBox (y hacia abajo) */
export function project(lon, lat) {
  const x = ((lon - BBOX.west) * kx * WIDTH) / spanX;
  const y = ((BBOX.north - lat) * HEIGHT) / spanY;
  return [x, y];
}
