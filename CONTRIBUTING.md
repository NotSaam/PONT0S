# Cómo contribuir

Gracias por ayudar. Lo más útil es **añadir o arreglar cámaras**.

## Añadir una cámara

Todo está en [`src/data/beaches.json`](src/data/beaches.json). Una playa:

```json
{
  "id": "riazor",
  "name": "Riazor",
  "municipality": "A Coruña",
  "province": "A Coruña",
  "zone": "coruna",
  "lat": 43.3687,
  "lon": -8.4119,
  "cams": [
    {
      "id": "riazor-concello",
      "provider": "Concello da Coruña",
      "page": "https://…",
      "type": "image",
      "url": "https://…/riazor.jpg",
      "refresh": 60
    }
  ]
}
```

- `zone`: `marina`, `ferrolterra`, `coruna`, `costa-da-morte` o `rias-baixas`.
- `lat`/`lon`: el centro de la playa (de OpenStreetMap, por ejemplo).
- `type` de la cámara (todas se ven dentro de la web, nunca un enlace que saque de ella):
  - `image`: una foto JPG/PNG que la fuente renueva cada pocos minutos. `url` es la foto; `thumb`, una versión pequeña para la portada si existe; `refresh`, cada cuántos segundos pedirla otra vez.
  - `youtube`: un directo de YouTube. `url` es el id del vídeo (11 caracteres) y `channel`, el id del canal (el vídeo cambia cuando el directo se reinicia).
  - `iframe`: un reproductor que la fuente ofrece para insertar en otras webs. Tiene que arrancar solo (autoplay y sin sonido) para que baste un clic.
  - `hls`: un vídeo `.m3u8` público.
- `page` siempre: la página de la cámara en la web de quien la emite. Sale como «Fuente» bajo la imagen.

**Reglas:**

1. Solo cámaras públicas que la fuente deja mostrar en otras webs: un código para insertar, una licencia abierta o permiso por escrito. Si no está claro, pide permiso antes (hay un mensaje tipo en [`docs/permisos.md`](docs/permisos.md)).
2. Todo por `https`: una foto o un reproductor por `http` no se ve en una web segura.
3. Nada de cámaras que enfoquen de cerca a personas, casas o matrículas.

Antes de abrir el PR:

```bash
npm test             # valida beaches.json
npm run check:cams   # comprueba que cada cámara responde
npm run dev          # mírala en http://localhost:4321
```

Si no quieres tocar código, [abre una incidencia](../../issues/new?template=camara.yml) con la página de la cámara.

## Textos e idiomas

Los textos están en [`src/i18n.ts`](src/i18n.ts) (español y gallego). Para añadir un idioma, otra entrada con las mismas claves.

## Estilo

- Sentence case en la interfaz.
- Nada de rastreadores, cookies propias ni analítica de terceros.
- Los reproductores de terceros se cargan solo cuando la persona pulsa «Ver la cámara».
