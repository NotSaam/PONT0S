# Cámaras pendientes de permiso

PONT0S solo muestra cámaras que se ven dentro de la web y con permiso de quien las emite. Estas tienen un reproductor que técnicamente se podría insertar, pero sus dueños no publican condiciones de uso o las prohíben sin permiso escrito. Hasta tener un «sí», no están en `src/data/beaches.json`.

| Lugar | Quién la emite | Reproductor | A quién preguntar |
|---|---|---|---|
| Pantín (Valdoviño) | Surf30 | `https://g0.ipcamlive.com/player/player.php?alias=pantin&autoplay=1&mute=1` | [surf30.net](https://www.surf30.net/2026/08/webcam-pantin-frouxeira-valdovino.html) |
| A Frouxeira (Valdoviño) | Surf30 | `https://g0.ipcamlive.com/player/player.php?alias=valdovino&autoplay=1&mute=1` | ídem |
| Razo (Carballo) | Concello de Carballo | `https://g0.ipcamlive.com/player/player.php?alias=praiaderazo&autoplay=1&mute=1` | Concello de Carballo |
| Patos (Nigrán) | Waira | Directo HLS en Wowza (el reproductor no deja insertarse) | [waira.com](https://waira.com/webcam/) |
| Orzán, Ferrol, Ortigueira, Muxía, O Grove, Sanxenxo, Portonovo, Baiona, A Guarda | CRTVG / G24 | Directos HLS 1080p (su aviso legal exige permiso escrito) | [CRTVG](https://www.crtvg.es/aviso-legal) |

Cuando llegue el permiso: añadir la cámara con `type` `iframe` (o `hls`) y la `url` del reproductor (con autoplay y sin sonido) y, en el PR, enlazar el correo o la página donde lo conceden.

## Mensaje tipo

> Hola. Hago PONT0S, una web sin ánimo de lucro y de código abierto que reúne las cámaras de la costa de Galicia con la previsión del tiempo y del mar (https://pont0s.vercel.app). ¿Nos dais permiso para insertar vuestra cámara de [playa] con vuestro reproductor? Aparecería con vuestro nombre y un enlace a vuestra web en cada vista, y el reproductor solo se carga cuando alguien pulsa para verlo. Gracias.

## Otras webs con cámaras de la costa (no se pueden mostrar)

Camaramar, Hispacams y SkylineWebcams prohíben en sus condiciones reproducir sus cámaras fuera de su web.
