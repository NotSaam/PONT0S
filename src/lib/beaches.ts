// Playas y cámaras: src/data/beaches.json es la única fuente. Se valida al compilar: un dato roto
// para el build con un mensaje claro en vez de llegar a la web.
import raw from '../data/beaches.json';
import infoRaw from '../data/beach-info.json';
import coast from '../data/coast.json';
import { project } from './projection.mjs';
import { ZONES, type Zone } from '../i18n';

export type CamType = 'image' | 'iframe' | 'youtube' | 'hls';
const CAM_TYPES: CamType[] = ['image', 'iframe', 'youtube', 'hls'];

export interface Camera {
  id: string;
  /** Qué se ve, si la playa tiene varias: «Vista norte», «Paseo». */
  label?: string;
  /** Quién la emite: «Concello de Sanxenxo», «MeteoGalicia». */
  provider: string;
  /** Página de la cámara en la web de quien la emite (para la atribución). */
  page: string;
  type: CamType;
  /** image: URL de la foto; iframe: URL del reproductor oficial; youtube: id del vídeo; hls: .m3u8. */
  url?: string;
  /** Segundos entre fotos (solo image). */
  refresh?: number;
  /** Foto pequeña para las tarjetas; en un vídeo, la portada antes de pulsar. */
  thumb?: string;
  /** Canal de YouTube: si está, se inserta su directo actual (el id de vídeo cambia al reiniciar). */
  channel?: string;
  /** Texto de atribución que pide la fuente, si pide uno concreto. */
  credit?: string;
}

export type WaterQuality = 'excellent' | 'good' | 'sufficient' | 'poor';

/** Datos oficiales (scripts/enrich-beaches.mjs): bandera azul de la Xunta y calidad del agua de la EEA. */
export interface BeachInfo {
  blueFlag?: { year: number; name: string };
  lengthM?: number;
  sand?: string;
  water?: { season: number; quality: WaterQuality; name: string; id: string };
}

export interface Beach {
  id: string;
  name: string;
  municipality: string;
  province: string;
  zone: Zone;
  lat: number;
  lon: number;
  cams: Camera[];
  info?: BeachInfo;
  /** Posición a lo largo de la costa, de Ribadeo a A Guarda (0 = más al este). */
  order: number;
}

type RawBeach = Omit<Beach, 'order' | 'info'>;
const infoById = infoRaw as Record<string, BeachInfo>;

const mainCoast = (coast.land as string)
  .slice(1)
  .split('L')
  .slice(0, -2)
  .map((p) => p.split(' ').map(Number) as [number, number]);

function coastOrder(lon: number, lat: number) {
  const [x, y] = project(lon, lat);
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < mainCoast.length; i++) {
    const d = (mainCoast[i][0] - x) ** 2 + (mainCoast[i][1] - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function validate(list: RawBeach[]) {
  const ids = new Set<string>();
  const camIds = new Set<string>();
  const errors: string[] = [];
  for (const b of list) {
    const where = `playa «${b.id}»`;
    if (!/^[a-z0-9-]+$/.test(b.id)) errors.push(`${where}: el id solo admite a-z, 0-9 y guiones`);
    if (ids.has(b.id)) errors.push(`${where}: id repetido`);
    ids.add(b.id);
    if (!ZONES.includes(b.zone)) errors.push(`${where}: zona «${b.zone}» desconocida (${ZONES.join(', ')})`);
    if (!(b.lat > 41.7 && b.lat < 44.1 && b.lon > -9.7 && b.lon < -6.8)) errors.push(`${where}: coordenadas fuera de Galicia`);
    if (!b.cams?.length) errors.push(`${where}: sin cámaras`);
    for (const c of b.cams ?? []) {
      const cw = `${where}, cámara «${c.id}»`;
      if (camIds.has(c.id)) errors.push(`${cw}: id repetido`);
      camIds.add(c.id);
      if (!c.page?.startsWith('https://') && !c.page?.startsWith('http://')) errors.push(`${cw}: falta la página de la fuente`);
      if (!CAM_TYPES.includes(c.type))
        errors.push(`${cw}: tipo «${c.type}» no válido (${CAM_TYPES.join(', ')}): solo cámaras que se ven dentro de la web`);
      if (!c.url) errors.push(`${cw}: falta la url`);
      if ((c.type === 'image' || c.type === 'iframe' || c.type === 'hls') && c.url && !c.url.startsWith('https://'))
        errors.push(`${cw}: la web va por https; una ${c.type} por http no se vería (contenido mixto)`);
    }
  }
  if (errors.length) throw new Error(`beaches.json no es válido:\n- ${errors.join('\n- ')}`);
}

const list = raw as RawBeach[];
validate(list);

export const beaches: Beach[] = list
  .map((b) => ({
    ...b,
    info: infoById[b.id],
    order: coastOrder(b.lon, b.lat),
  }))
  .sort((a, b) => a.order - b.order);

export const cameraCount = beaches.reduce((n, b) => n + b.cams.length, 0);

/** Cámara de la tarjeta: mejor una foto (se ve sin pulsar) que un vídeo. */
export function previewCam(b: Beach) {
  return (
    b.cams.find((c) => c.type === 'image') ??
    b.cams.find((c) => c.type === 'youtube') ??
    b.cams.find((c) => c.type === 'iframe') ??
    b.cams[0]
  );
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault_live.jpg`;
}
