# PONT0S

**Cámaras en directo de la costa de Galicia**, de Ribadeo a A Guarda, con el tiempo, el viento, las olas, la marea y la temperatura del agua de cada sitio. En español y gallego.

**Web:** https://pont0s.vercel.app

*Póntos* es «mar abierto» en griego.

- **33 cámaras en 27 puntos de la costa**, todas se ven dentro de la web: fotos de MeteoGalicia y Windy que se renuevan solas, y el directo de Samil, que arranca con un solo clic.
- **El tiempo y el mar** de cada sitio: ahora, las próximas 24 horas y los próximos 7 días; olas, mar de fondo, temperatura del agua, UV, salida y puesta de sol y la curva de la marea de hoy.
- **Datos oficiales**: bandera azul y calidad del agua.
- Buscador, filtro por zona, ordenar por cercanía y playas guardadas en el navegador.
- Sin cookies propias ni analítica. El vídeo de YouTube no se carga hasta que pulsas.
- Web estática, sin servidor ni claves.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # valida src/data/beaches.json
npm run build      # genera dist/
npm run check:cams # comprueba que cada cámara responde
```

Node 22.12 o superior.

## Cómo está hecho

| Pieza | Dónde |
|---|---|
| Lugares y cámaras | [`src/data/beaches.json`](src/data/beaches.json): la única lista, validada al compilar ([`src/lib/beaches.ts`](src/lib/beaches.ts)) |
| Bandera azul y calidad del agua | [`src/data/beach-info.json`](src/data/beach-info.json), generado por `node scripts/enrich-beaches.mjs` (repetir cada junio) |
| Mapa de la costa | [`src/data/coast.json`](src/data/coast.json), generado por `npm run data:coast` desde OpenStreetMap; se sirve como sprite `coast.svg` |
| Tiempo y mar | [`src/lib/openmeteo.ts`](src/lib/openmeteo.ts): el navegador llama a Open-Meteo (una sola llamada para todas las playas de la portada) y guarda las respuestas 15 min en `sessionStorage` |
| Textos | [`src/i18n.ts`](src/i18n.ts) (español en `/`, gallego en `/gl/`) |
| Páginas | Astro 7: portada ([`Home.astro`](src/components/Home.astro)) y ficha por lugar ([`BeachPage.astro`](src/components/BeachPage.astro)) |

**Diseño.** La base es grafito y titanio, con un solo acento: naranja boya (`#FF8A3D`), el color de las boyas y de Salvamento Marítimo. El mapa del inicio es una carta náutica de noche: el agua en grafito, bandas de sonda azuladas junto a la costa, la tierra en un grafito más claro, un marco con la escala de latitud y longitud, y cada cámara marcada como una luz. Los nombres de las playas van en cursiva, como el agua en las cartas náuticas.

## Fuentes de datos

| Qué | Fuente | Licencia | Cómo |
|---|---|---|---|
| Previsión del tiempo | [Open-Meteo](https://open-meteo.com/) | CC BY 4.0, gratis sin ánimo de lucro | Desde el navegador, sin clave |
| Olas, mar de fondo, agua, nivel del mar (marea) | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) | CC BY 4.0 | Desde el navegador |
| Fotos de cámaras | [MeteoGalicia](https://www.meteogalicia.gal/web/observacion/camaras) | Uso libre citando a MeteoGalicia ([aviso legal](https://www.meteogalicia.gal/aviso-legal)) | `<img>` que se renueva cada 5 min |
| Fotos de cámaras | [Windy Webcams](https://www.windy.com/webcams) | Imagen enlazada a windy.com ([condiciones](https://api.windy.com/webcams/terms)) | `<img>` que se renueva cada 2,5 min |
| Directo de Samil | [RiadeVigoCam](https://www.riadevigocam.com/) en YouTube | El canal permite insertarlo | iframe al pulsar |
| Bandera azul 2026 | [Xunta de Galicia, Abert@s](https://abertos.xunta.gal/catalogo/cultura-ocio-deporte/-/dataset/0697/praias-galegas-con-bandeira-azul-2026) | CC BY-SA 4.0 | Al generar los datos |
| Calidad del agua 2025 | [EEA, Bathing Water Directive](https://www.eea.europa.eu/en/topics/in-depth/bathing-water) (datos de Náyade) | CC BY 4.0 | Al generar los datos |
| Línea de costa | © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | ODbL | Al generar los datos |

Solo entran cámaras que se pueden ver dentro de la web con permiso de quien las emite. Hay más en Galicia (Camaramar, Hispacams, SkylineWebcams, G24 de la CRTVG, Surf30, Waira…), pero o sus condiciones no lo permiten o falta pedirlo: ver [`docs/permisos.md`](docs/permisos.md).

### Siguiente versión

- **Previsión de MeteoGalicia por playa** (615 playas, con temperatura del agua y estado del mar) y **mareas oficiales** de 15 puertos. No se pueden pedir desde el navegador (no admiten CORS), así que irán en una tarea programada de GitHub Actions que guarde JSON estático.
- **AEMET** (predicción de playas y avisos costeros): necesita una clave gratuita guardada en los secretos del repositorio.
- **Boyas y mareógrafos de Puertos del Estado**: piden permiso por escrito para reutilizar sus datos.

## Contribuir

Lo más útil es añadir o arreglar cámaras: [CONTRIBUTING.md](CONTRIBUTING.md). Cada lunes una tarea de GitHub Actions comprueba que todas siguen respondiendo.

## Publicación

Vercel publica `main` en https://pont0s.vercel.app. En GitHub Pages también funciona: `BASE_PATH=/PONT0S` y `SITE_URL=https://<usuario>.github.io`.

## Licencia

Código y metadatos: [MIT](LICENSE). Las imágenes y vídeos de las cámaras son de quien las emite; los datos de tiempo y mar, de Open-Meteo (CC BY 4.0); la costa, de OpenStreetMap (ODbL).
