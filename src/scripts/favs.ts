// Playas guardadas: solo en este navegador (localStorage), nada sale del dispositivo.
const KEY = 'pont0s:favs';

export function loadFavs(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function toggleFav(id: string): Set<string> {
  const favs = loadFavs();
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...favs]));
  } catch {
    /* sin almacenamiento: dura esta visita */
  }
  return favs;
}
