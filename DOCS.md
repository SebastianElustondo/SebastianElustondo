# Portfolio personal — Sebastián Elustondo

Sitio de una sola página, en inglés, donde los cinco productos destacados son juguetes reales y
funcionales. El texto sobre cada producto ("facts") aparece como recompensa después de interactuar
(o con "Show me how it's built", o en modo CV).

**Marco "Night Shift, Buenos Aires"** (v4, 2026-09-03): la página es un edificio leído de arriba a
abajo. Hero = fachada con cinco ventanas encendidas (una por producto) y dos relojes reales; la paleta
cambia con la hora real de Buenos Aires (`?ba=HH` para previsualizar). Los juguetes son los
departamentos. Bench = pisos bajos con ventanas tapiadas y placas (Nivelate sin link, por decisión de
Sebastián). Contacto = planta baja con puerta, nota pegada y portero eléctrico que redacta el mail.
Footer = vereda. Las exploraciones descartadas (workbench, workorder) quedan en `src/explorations/`.

## Estructura

```
src/index.html      spine: barra, hero, modo CV, bench, contacto (placeholders @css/@toys/@js)
src/spine.css|js    marco Night Shift (Young Serif + Atkinson + Azeret Mono) + reveal de facts + modo CV
src/explorations/   brief + 3 mockups de la exploración de diseño del marco
src/CONTRACT.md     contrato que siguió cada juguete (anatomía, evento toy:done, paletas, copy)
src/toys/<t>.{html,css,js}   pulso · trazo · quovra · reachr · cobro (cada uno autocontenido)
build.py            ensambla todo en ./index.html (single-file, deployable tal cual)
```

Build: `python3 build.py` (opcional: ruta extra para la variante artifact sin `<head>`).
Orden de mundos: pulso (CRT negro) → trazo (papel) → quovra (dark cálido) → reachr (crema) → cobro (crema).

## Los juguetes

| Mundo | Qué hace el visitante | Dispara facts cuando |
|---|---|---|
| pulso | juega el loop real: tap cuando el blip cruza el arco rojo, 3 vidas, flatline | primer game over o 10 bpm |
| trazo | dibuja en un canvas con los 18 colores, palabra con letras que se revelan, reloj 80 s | 3 trazos, ¡Listo! o tiempo |
| quovra | prende módulos en el panel del dueño y ve cambiar el sitio de una barbería en un teléfono | 3+ módulos activos |
| reachr | arrastra leads por el pipeline; en "Cobrado" se redacta solo el recordatorio de WhatsApp | primera card en Cobrado |
| cobro | calculadora real con dolarapi en vivo (fallback manual), link copiable | cualquier slider o dólar |

Modo CV (`html.cv`, botón "I'd rather just read it"): oculta los juguetes y muestra todos los facts.
Sin JS todo el contenido es visible. `prefers-reduced-motion` respetado en todos.

## README del perfil (banner, tarjetas, stats)

El README de este repo es el perfil público de GitHub. Sus imágenes son SVG generados con scripts
stdlib en `scripts/`, con la misma identidad Night Shift del sitio (paletas `night` y `day` de
`src/spine.js`, glifos de las ventanas leídos de ahí mismo):

```
scripts/nightshift.py   paletas, glifos, helpers SVG compartidos
scripts/banner.py       assets/banner-{dark,light}.svg   (el edificio + presentación)
scripts/cards.py        assets/card-<slug>-{dark,light}.svg desde assets/projects.json
scripts/stack.py        assets/stack-{dark,light}.svg   (logos del stack desde assets/stack.json)
scripts/icons.json      logos cacheados de Simple Icons (CC0); Phaser no existe ahí y usa una placa
```

Regenerar: `cd scripts && python3 banner.py && python3 cards.py && python3 stack.py`.
La tarjeta de stats (contribuciones como ventanas) y su workflow se descartaron el 2026-09-14 por
decisión de Sebastián: dependían de un PAT y no sumaban.
Los números de las tarjetas se mantienen a mano en `assets/projects.json` (campo `asof`).
Nivelate quedó como placa "retired" en el bench (la PWA se dio de baja el 2026-09-08).

## Deploy

**ONLINE en https://sebastian.quovra.com** (Cloudflare Pages, proyecto `sebastian-elustondo`,
también en sebastian-elustondo.pages.dev). DNS: CNAME `sebastian` → `sebastian-elustondo.pages.dev`, proxied.

`public/` (CV en PDF, `_headers`) se copia a `dist/` en el build. Redeploy tras cambios:

```
python3 build.py && npx wrangler pages deploy dist --project-name sebastian-elustondo --branch main --commit-dirty=true
```

Modo CV: el botón "Read the résumé instead" muestra el CV completo (experiencia, stack, educación)
seguido de los facts de cada producto. El PDF vive en `public/Sebastian_Elustondo_CV.pdf`; para
actualizarlo, reemplazar el archivo y redeployar.

Recursos externos: Google Fonts, el beacon de Cloudflare Web Analytics (sitio `sebastian.quovra.com` en el dashboard, sin cookies; solo en el index.html deployado, no en la preview del artifact) y el fetch opcional de cobro a dolarapi.com.

## Pendientes

- [ ] Link a GitHub en contacto (`TODO(Sebastián)` en src/index.html). LinkedIn ya está.
- [ ] Confirmar fechas de Kleva (el PDF dice "Jun 2026 - Present" y dos entradas con el mismo mes).
