# Playable portfolio — toy contract (v2)

Page thesis: **"Don't read my portfolio. Play it."** Each of the five products is a real,
working toy on the page. Copy about the product ("facts") is hidden until the visitor
interacts, then revealed as a reward. Every world has its OWN layout — there is NO shared
section skeleton. Avoid the AI-portfolio tics: no uppercase letter-spaced mono labels
(except inside Pulso, where mono IS the product's identity), no "big number + tiny label"
stat rows, no pill buttons, no generic fade-up reveals, no emoji as icons.

## Files you produce (one toy = three files, nothing else)

```
src/toys/<name>.html   — a fragment: exactly one <section class="world w-<name>" id="<name>">…</section>
src/toys/<name>.css    — every selector scoped under .w-<name>
src/toys/<name>.js     — one IIFE; may expose window.Toys.<name> = { mount } only
```
`<name>` ∈ pulso | trazo | reachr | quovra | cobro. Files are concatenated into one page by
`build.py`; do not add <html>/<head>/<body>, <link>, <script src>, or external assets of any
kind (CSP blocks them). Inline SVG is fine; keep hand-authored path data short.

## Section anatomy (required)

```html
<section class="world w-<name>" id="<name>" aria-labelledby="<name>-title">
  <div class="stage"> …the playable toy… </div>
  <button type="button" class="peek">Show me how it's built</button>
  <aside class="facts" hidden> …the FACTS HTML given below, verbatim text, your styling… </aside>
</section>
```
- `.stage` is the toy. It must be fully usable with mouse AND touch (Pointer Events),
  keyboard where sensible, on a 390px-wide phone and a 1440px desktop.
- `.peek` is the skip for impatient visitors. Style it in the world's own voice
  (not a pill). The spine wires its click.
- `.facts` starts `hidden`. The spine removes `hidden` when your toy fires the done event
  or when `.peek` is clicked, or when the page is in résumé mode. Style `.facts` so it
  feels like a native part of YOUR world (a CRT readout, a notebook page, a CRM side panel,
  a studio console, a budget footnote…). Make its appearance a moment, not a fade-up.

## The done event (required, fire exactly once)

```js
section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: '<name>' } }));
```
Fire it when the visitor has "gotten it" — milestones are listed per toy below.

## Runtime rules

- Pointer Events (`pointerdown/move/up`, `touch-action: none` on the interactive surface).
- Pause any rAF loop when the section is offscreen (IntersectionObserver) and when
  `document.hidden`. Respect `prefers-reduced-motion` (no ambient animation; the toy still works).
- No `alert/confirm/prompt`. No `fetch` except Cobro (see below). No localStorage required;
  if you use it, wrap in try/catch and work without it.
- Size budget: JS ≤ 14 KB, CSS ≤ 8 KB per toy. Plain ES2019, no build step, no libraries.
- The page also renders in "résumé mode" (`html.cv`): the spine hides `.stage` and `.peek`
  and shows `.facts`. Make sure `.facts` reads fine on its own.
- Fonts available (already loaded by the spine; use via these variables):
  `--disp` Bricolage Grotesque · `--body` Archivo · `--mono` JetBrains Mono ·
  `--fraunces` Fraunces (has italics + opsz) · `--instrument` Instrument Sans · `--patrick` Patrick Hand.
- Define your world's palette as CSS variables on `.w-<name>` and paint EVERY color
  explicitly (background too); the page is single-theme by design.

---

## PULSO — the real game, on a CRT monitor

Identity (exact): bg `#06090a`, signal/text `#39ff8f`, critical red `#ff3b3b`, golden peak
`#ffcc33`, dim ring `#1f6b45`, dim text `#6fae86`, alert white `#eafff5`. All mono
(`--mono`), lowercase wordmark "pulso", glow via text-shadow/box-shadow, subtle scanlines,
"bpm" as the score unit. Vibe: arcade cabinet meets ICU monitor.

Gameplay (faithful to the real product): a blip travels around a ring; a red critical arc
sits on the ring; the player taps/clicks/presses Space when the blip is inside the arc.
Hit → score (bpm) +1, arc shrinks a little, speed increases a little, 30% chance the
direction reverses. Miss (tap outside arc, or blip passes the arc without a tap) → lose one
of 3 lives, brief red flash. Every 5th hit the arc is golden and worth 3. Show: bpm, lives
(◉◉◎), best this session, a one-line status ("señal captada" on hit, "arritmia" on miss).
Game over → "flatline" moment (blip stops, ring goes dim, a horizontal line draws across),
then a "play again" control. Render on <canvas> sized to the container (devicePixelRatio
aware), full-bleed dark section, the ring centered and large (min 260px, up to 420px).
Done milestone: first game over OR reaching 10 bpm, whichever first.

FACTS (place inside .facts; keep text verbatim, markup free to restyle):
<h2 id="pulso-title">pulso</h2>
<p>You just played the real loop. On pulso.quovra.com it grows into a full meta-game: a currency ("latidos"), a shop with six CRT themes, four game modes, prestige, daily missions and an arcade-style global leaderboard.</p>
<ul>
<li>Vanilla JS + Canvas, zero dependencies, no build step. The whole game ships in under 100 KB.</li>
<li>Global leaderboard on Cloudflare D1, same-origin, running at $0.</li>
<li>Wrapped with Capacitor into an Android app with rewarded ads; on the web the ad layer sleeps entirely.</li>
</ul>
<p><a href="https://pulso.quovra.com" target="_blank" rel="noopener">play the full game at pulso.quovra.com</a></p>

---

## TRAZO (TrazoLoco) — the section is a drawing canvas

Identity (exact): paper `#f7f3e9`, paper-light `#fffdf6`, ink `#2b2620`, soft ink
`#7a7060`, rule `#ddd3bd`, red `#e8503a` (the "Loco" in the wordmark), highlighter yellow
`#f6c344`, blue `#4a90d9`, green `#58a55c`. Dotted-grid paper background. Hand-drawn
wobbly borders (asymmetric border-radius like `255px 15px 225px 15px/15px 225px 15px 255px`),
slight rotations, `--patrick` handwriting for UI text. Warm, analog, social.

Toy: a full-width drawing canvas (min 320px tall, ~55vh on desktop). Above it a prompt in the
game's voice: "Dibujá: <word>" with the word shown as hint underscores that reveal letters
over time (reveal 1 letter at 45% and another at 75% of an 80-second clock, like the real
game; show the clock). Pick the word at random from this list: bicicleta, faro, tortuga,
paraguas, cactus, submarino, helado, cohete, guitarra, molino. A toolbar in wobbly style with
the game's 18 real colors (`#000000 #666666 #ffffff #e53935 #ff7043 #ffd600 #8bc34a #1e8e3e
#00bcd4 #1e88e5 #3949ab #8e24aa #ec407a #8d6e63 #ffab91 #fff59d #a5d6a7 #90caf9`), 4 brush
widths, eraser, undo, clear, and a "¡Listo!" button. Strokes are stored as NORMALIZED
coordinates (0..1) and re-rendered on resize — that's a real feature of the product, show it
working. Smooth lines (quadratic midpoints), round caps. Add a tiny "estás cerquita 🔥" style
of feedback only in text form when they press Listo (e.g. "¡Trazo registrado!") — this is the
one place an emoji is allowed, because it's the product's own copy.
Done milestone: the visitor has drawn ≥ 3 strokes, or pressed ¡Listo!, or the clock ran out.

FACTS:
<h2 id="trazo-title">TrazoLoco</h2>
<p>That canvas is the same one ten people share in a real room, over WebSockets, no signup. Public matchmaking or a private 4-letter code; a "broken telephone" mode; chaos modifiers that force one continuous line or drawing blind; the best rounds export as vertical video.</p>
<ul>
<li>One Node + Socket.io server runs the whole state machine: turns, scoring, letter hints, profanity filtering, and a 90-second reconnect grace so a backgrounded phone rejoins its game.</li>
<li>Strokes travel as normalized coordinates, so a drawing looks identical on any screen — resize this page and watch yours survive.</li>
<li>A 1,252-word Spanish dictionary, a Discord bot that opens private rooms, and an end-to-end smoke test that plays a full two-player game over real sockets.</li>
</ul>
<p><a href="https://trazoloco.quovra.com" target="_blank" rel="noopener">play with friends at trazoloco.quovra.com</a></p>

---

## REACHR — drag a lead through the pipeline

Identity (exact): paper `#FAF7F0`, ink `#1C1913`, ONE accent forest green `#1E7A4C`,
hairlines `#E2DACA`, card `#FFFDF8`, muted `#776E5E`, destructive `#B3402E`. Type:
`--fraunces` for headings/wordmark "Reachr." (with a green full stop), `--instrument` for UI.
Editorial paper feel. No second accent, no gradients, no glass.

Toy: a kanban with four stages — "Lead", "Contactado", "Cerrado", "Cobrado" — and three
cards (fictional local businesses: "Barbería Hestia · sitio web", "Box Norte · turnos",
"Café Ramos · menú QR", each with an amount like USD 120/mes). Cards are draggable with
Pointer Events (mouse + touch), with a ghost while dragging and a drop highlight on the
target column. When a card lands in "Cobrado", a WhatsApp-style message composes itself
letter by letter in a panel beside/below the board: "Hola Juan, te escribo de Quovra 👋
Te paso el recordatorio del mes: USD 120 por el sitio web, vence el 10. ¿Lo pasás por
transferencia o MP? ¡Gracias!" (emoji allowed here only because it's the product's own
reminder copy). Show a small "Cobranzas: 1 al día" tally that updates. Make the board feel
like a real CRM, not a demo: hairline columns, dated follow-up chips ("seguimiento: mañana").
Done milestone: first card dropped into "Cobrado".

FACTS:
<h2 id="reachr-title">Reachr<span class="dot">.</span></h2>
<p>From lead to client, from client to payment. A WhatsApp-first CRM for freelancers and micro-agencies in Latin America who sell recurring services to local businesses. The part every CRM forgets is collections, and that's the part you just used. I run my own client outreach on it every day.</p>
<ul>
<li>Debt is derived, not stored: due status is computed at read time from billing day + payments. A whole billing subsystem with zero scheduled infrastructure.</li>
<li>The public demo-booking endpoint is defended in layers: honeypot, anti-flood caps, an atomic Postgres rate limiter, and a DB-level UNIQUE that turns the race condition into a clean 409.</li>
<li>Email replies are detected without Gmail OAuth: a Cloudflare Email Worker matches the sender to a lead and advances the pipeline on its own.</li>
</ul>
<p>Next.js 16 · React 19 · Supabase with row-level security · Paddle · 36 API routes · 12 tables · fully bilingual.</p>
<p><a href="https://reachr.quovra.com" target="_blank" rel="noopener">reachr.quovra.com</a></p>

---

## QUOVRA — flip modules on, watch a client's site change

Identity (exact): warm dark paper `#171310`, ink `#F1EAE0`, muted `#A89E8D`, hairline
`#2F2921`, ONE accent green `#47B37C`. Type: `--fraunces` display (wordmark "Quovra." with
green full stop), `--instrument` UI. Editorial, magazine-like, anti-generic-SaaS.

Toy: split layout. LEFT: an "owner panel" for a fictional client, "Barbería Hestia", with
8 real module switches — sitio, turnos, tienda, reseñas, eventos, avisos, reportes, socios —
each a proper toggle (role="switch", keyboard operable). RIGHT: a phone-shaped mockup of the
client's public site (cream site inside the dark section, its own tiny type) that gains or
loses sections LIVE as modules flip: turnos → a "Reservar turno" block with slots and a
"seña por Mercado Pago" line; tienda → a mini catalog with 2 products and stock; reseñas →
"Dejanos tu reseña en Google" with 5 stars; eventos → "Próximo evento: Noche de barbas";
avisos → a newsletter box; reportes → nothing visible on the site but an owner-only
"Reporte mensual enviado" toast on the panel; socios → a "Planes y clases" block with a
trial-class button. Start with only "sitio" on. Add one line under the panel that updates:
"Onboarding: 0 lines of code written." (keep it literal and dry). Modules animate in/out
with height transitions (skip under reduced motion).
Done milestone: three or more modules switched on.

FACTS:
<h2 id="quovra-title">Quovra<span class="dot">.</span></h2>
<p>My studio, and the multi-tenant platform behind it. What you just did is the whole business model: every capability is built once and switched on per client by configuration. Bookings with Mercado Pago deposits, an online store with real stock control, review funnels, gym memberships, a site builder. The acid test for every feature: can a whole client be onboarded without writing code?</p>
<ul>
<li>9 Cloudflare Workers, 35 Postgres tables, ~53,000 lines shipped to production in a 17-day build.</li>
<li>Free-tier ceilings drove the architecture: with 5 cron triggers per account, expiring holds are computed at read time, so work scales with usage, not with tenants.</li>
<li>Deposits go straight to each business's own Mercado Pago account. Per-tenant credentials live in Supabase Vault; only the payment webhook can confirm, or undo, a paid booking.</li>
<li>Deny-all row-level security: no table is readable by any client key; every query runs server-side through the service role, scoped by tenant.</li>
</ul>
<p><a href="https://quovra.com" target="_blank" rel="noopener">quovra.com</a> · founding client migrated from a legacy system</p>

---

## COBRO (¿Cuánto cobro?) — a working rate calculator

Identity (exact): cream `#FAF7F0`, panel white `#FFFFFF`, ink `#1C1813`, grey `#7C7466`,
line `#E3DCCB`, green `#1E7A4C`, bright green `#47B37C`, soft green `#EAF3EC`, alert
ochre `#9A7B1F`. Type: `--fraunces` headings (italic allowed on one word), `--instrument`
UI, `--mono` for numbers only. Philosophy: "a well-designed budget sheet, not a Bloomberg
terminal". Exactly one hand-drawn gesture on screen (a single underline stroke).

Toy: a real calculator. Inputs: hourly rate in USD (range slider 5–150 + number field),
hours per week (range 5–60), billable share (range 30–100%, default 60%, with a one-line
explanation: worked hours ≠ billable hours), and a dollar selector with four segmented
options: Blue, MEP, Oficial, Cripto. Output: ARS per month, big, tabular-nums, updating
live, plus the hourly rate in ARS and a "monthly hours billed" line. Rates: on load try
`fetch('https://dolarapi.com/v1/dolares')` (use the `venta` side of blue, bolsa=MEP,
oficial, cripto); if it fails or is blocked (it WILL be blocked in the preview sandbox),
silently fall back to editable values with a visible "manual rate" field, exactly like the
real product's graceful degradation, and label the source line honestly
("rates: dolarapi.com · updated hh:mm" vs "rates: manual"). Format ARS with dots as
thousand separators. Include a "copy as link" button that puts the current inputs into the
URL hash (#cobro?tarifa=25&horas=30&fact=60&dolar=mep) and reads them back on load.
Done milestone: any slider or the dollar selector changed.

FACTS:
<h2 id="cobro-title">¿Cuánto <em>cobro?</em></h2>
<p>The question every Argentine freelancer asks, answered honestly. Convert at the dollar you actually use, or work backwards from the life you want to the rate you need, separating worked hours from billable ones. Plus monotributo math, a project quote builder, and guides without jargon.</p>
<ul>
<li>100% client-side and dependency-free: no backend, no build step, nothing leaves the browser but one public FX call.</li>
<li>If the FX API is down, a manual-rate field appears and every calculator keeps working. You may have just seen that happen.</li>
<li>Quotes serialize into the URL, so a freelancer can send a client the exact numbers as a link.</li>
</ul>
<p><a href="https://cobro.quovra.com" target="_blank" rel="noopener">cobro.quovra.com</a></p>
