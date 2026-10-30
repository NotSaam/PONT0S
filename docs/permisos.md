# Cámaras pendientes de permiso

PONT0S solo muestra cámaras que se ven dentro de la web y con permiso de quien las emite. Estas tienen un reproductor que técnicamente se podría insertar, pero sus dueños no publican condiciones de uso o las prohíben sin permiso escrito. Hasta tener un «sí», no están en `src/data/beaches.json`.

| Lugar | Quién la emite | Reproductor | A quién preguntar |
|---|---|---|---|
| Pantín (Valdoviño) | Surf30 | `https://g0.ipcamlive.com/player/player.php?alias=pantin&autoplay=1&mute=1` | [surf30.net](https://www.surf30.net/2026/08/webcam-pantin-frouxeira-valdovino.html) |
| A Frouxeira (Valdoviño) | Surf30 | `https://g0.ipcamlive.com/player/player.php?alias=valdovino&autoplay=1&mute=1` | ídem |
| Razo (Carballo) | Concello de Carballo | `https://g0.ipcamlive.com/player/player.php?alias=praiaderazo&autoplay=1&mute=1` (foto: `https://ipcamlive.com/player/snapshot.php?alias=praiaderazo`) | infocarballo@carballo.org. Su [aviso legal](https://carballo.gal/aviso-legal/) no cede derechos de explotación |
| Pedra do Sal, Baldaio (Carballo) | Concello de Carballo | `https://g0.ipcamlive.com/player/player.php?alias=pedradosal&autoplay=1&mute=1` (foto: `https://ipcamlive.com/player/snapshot.php?alias=pedradosal`) | ídem |
| Pantín (Valdoviño) | Concello de Valdoviño | Cámara propia del concello; su aviso legal no dice nada de reutilización (detalles en la investigación del 2026-10-30) | Concello de Valdoviño |
| Patos (Nigrán) | Waira | Directo HLS en Wowza (el reproductor no deja insertarse) | [waira.com](https://waira.com/webcam/) |
| Orzán, Ferrol, Ortigueira, Muxía, O Grove, Sanxenxo, Portonovo, Baiona, A Guarda | CRTVG / G24 | Directos HLS 1080p (su aviso legal exige permiso escrito) | [CRTVG](https://www.crtvg.es/aviso-legal) |

Cuando llegue el permiso: añadir la cámara con `type` `iframe` (o `hls`) y la `url` del reproductor (con autoplay y sin sonido) y, en el PR, enlazar el correo o la página donde lo conceden.

## Mensaje tipo

> Hola. Hago PONT0S, una web sin ánimo de lucro y de código abierto que reúne las cámaras de la costa de Galicia con la previsión del tiempo y del mar (https://pont0s.vercel.app). ¿Nos dais permiso para insertar vuestra cámara de [playa] con vuestro reproductor? Aparecería con vuestro nombre y un enlace a vuestra web en cada vista, y el reproductor solo se carga cuando alguien pulsa para verlo. Gracias.

## Redes de cámaras que piden permiso escrito

Tienen muchas cámaras de playas gallegas, pero sus condiciones no dejan reproducirlas en otra web sin un permiso por escrito y no ofrecen código para insertarlas. No se extraen sus vídeos: solo entran si lo autorizan.

| Red | Quién es | Qué dicen | Contacto |
|---|---|---|---|
| Hispacams | Himalia Tecnologías S.L. | «Sin autorización previa por escrito» no se puede «utilizar, reproducir, transmitir» ([aviso legal](https://www.hispacams.com/aviso-legal/), apartado 4) | Formulario de [anunciarse](https://www.hispacams.com/anunciarse/) o [instala tu webcam](https://www.hispacams.com/de-interes/instala-tu-webcam/) |
| Camaramar | Streamingsurf Iberia S.L. | No se ceden al usuario derechos de explotación ([aviso legal](https://www.camaramar.com/aviso-legal)) | info@camaramar.com |
| SkylineWebcams | SkylineWebcams | Prohíben reproducir los fotogramas; sus páginas no se dejan enmarcar | [condiciones](https://www.skylinewebcams.com/en/terms-of-use.html) |

### Correo para Hispacams y Camaramar

> Asunto: Permiso para mostrar vuestras cámaras de Galicia en PONT0S
>
> Hola. Soy Samuel Fuentes y hago PONT0S (https://pont0s.vercel.app), una web sin ánimo de lucro y de código abierto que reúne las cámaras de la costa de Galicia con la previsión del tiempo, el mar y la marea de cada playa.
>
> Nos gustaría mostrar vuestras cámaras gallegas dentro de la web, con vuestro reproductor tal cual (vuestra marca, vuestra publicidad si la lleva) y, debajo de cada una, vuestro nombre y un enlace a la página de la cámara. El vídeo solo se carga cuando alguien pulsa para verlo.
>
> ¿Nos dais permiso por escrito? Si tenéis un código de inserción o un programa para webs colaboradoras, lo usamos encantados.
>
> Gracias,
> Samuel
