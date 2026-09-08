# Design exploration brief — the frame around the toys

## Situation

sebastian.quovra.com is a playable portfolio: five real products, each rebuilt as a working toy on the
page, each in its own visual world (Pulso: CRT arcade monitor, black + phosphor green, JetBrains Mono.
TrazoLoco: sketchbook paper with dotted grid, Patrick Hand, red/yellow/blue. Quovra: warm dark #171310
editorial, Fraunces + Instrument Sans, one green accent. Reachr: cream paper CRM, Fraunces, forest green.
¿Cuánto cobro?: cream budget sheet, Fraunces + mono numbers). The owner LOVES this middle part. Do not
touch it.

What he hates: everything BEFORE and AFTER the toys. Today that is a dark petrol page (#0C1820, bone text,
blue accent #5B9DF5) with a big Bricolage Grotesque headline "Don't read my portfolio. Play it.", one
paragraph of credentials, a list of five link-rows ("Catch a heartbeat", "Draw a bicycle in 80 seconds"…),
then after the toys a prose paragraph "Also on the bench" (four smaller projects), a "Building something?"
contact with a big underlined email, and a footer line. His words: "lo de antes y lo de después no me
gusta para nada" and earlier "lo siento muy IA". The toys are alive; the frame is a generic typographic
template. Your job: make the frame as alive, specific and hand-made as the toys, while still doing its job
in five seconds for a hiring manager: who is this, what has he done, how do I reach him.

## Who he is (all true, use it)

Sebastián Elustondo, Buenos Aires, remote (GMT-3). Senior software engineer / tech lead, six years on
production platforms at Mercado Libre, Conekta (fintech, payments), Spin and Kleva. Node.js, TypeScript,
multi-tenant PostgreSQL with row-level security, AWS serverless, payments and integrations. On his own time
he designs, builds and operates complete products alone (the five toys, plus four on the bench). Links:
mailto:sebastianelustondo@gmail.com · https://github.com/SebastianElustondo ·
https://www.linkedin.com/in/sebastian-elustondo · /Sebastian_Elustondo_CV.pdf (a real PDF at that path).

The four bench projects: Nivelate (growth journal PWA, live at https://nivelate.quovra.com), Desvío
(isometric maze tower defense, Phaser, sprites generated in code, in development), La Cuadra (3D
boarding-house tycoon in Godot, tenants remember and gossip, in development), Talle (paste a job posting,
get your CV tailored with an honest fit score, prototype).

## What you deliver

ONE self-contained HTML file: `explorations/<your-direction>.html`. It is a full-page mockup of the frame:
top bar → hero → [five toy placeholders] → bench → contact → footer. The toy placeholders are plain
`<section class="world w-<name>">` blocks, 720px tall, painted in each world's real background color with
the product name in its real font, in this order: pulso (#06090a, mono, green #39ff8f text) → trazo
(#f7f3e9 dotted grid, Patrick Hand, ink #2b2620) → quovra (#171310, Fraunces, #F1EAE0 text) → reachr
(#FAF7F0, Fraunces, #1C1913) → cobro (#FAF7F0, Fraunces, #1C1813). They exist only so the hand-offs
between your frame and the worlds can be judged. Everything else is yours.

Keep these hooks so the winner can be dropped into the real page: `<button id="cv-toggle">` somewhere
in the top bar (résumé mode toggle; label it in your voice), the five hero links point to `#pulso #trazo
#quovra #reachr #cobro`, and elements with the class names `.hero`, `.bench`, `.contact`, `.foot`. You may
add any structure inside them.

Fonts: Google Fonts only, one `<link>`; you may use any families. The existing loaded set is Bricolage
Grotesque, Archivo, JetBrains Mono, Fraunces, Instrument Sans, Patrick Hand; you are free to replace the
frame's faces entirely. No external images or scripts; inline SVG, CSS and Canvas are fine (generated
graphics via Canvas or CSS rather than long hand-authored SVG paths). No libraries. Plain ES2019.
Reduced-motion respected. Responsive 390px → 1440px, no horizontal page scroll. Keyboard focus visible.

## Hard rules (the anti-AI list, enforced)

No uppercase letter-spaced mono labels as a system. No "big number + tiny label" stat rows. No pill
buttons. No fade-up-on-scroll as the reveal language. No emoji as icons. No purple/cyan gradients, no
glassmorphism, no rounded-box icon grids, no neon-tech. No cream + serif + terracotta (that's Quovra's
own look and the frame must NOT look like Quovra), no near-black + single acid accent as the whole idea,
no broadsheet hairline-columns layout. No centered everything. Do not write "passionate", "crafting",
"digital experiences", "let's connect". The five hero links must remain real sentences a person would say,
not category labels.

## What "alive" means here

The toys taught the visitor that this page is touched, not read. The frame must keep that promise. At
least the hero and the contact should have one genuinely interactive or living element each, grounded in
who he is and what he does (a builder who ships things end-to-end, from Buenos Aires, at night after work).
Motion is information: only things that mean something move. Spend the boldness in one signature idea per
zone and keep the rest disciplined. Write real copy (short, first person, plain, a little dry).

## Your direction

You have been given ONE direction in your task prompt. Commit to it fully. Do not blend directions. Before
coding, write a 10-line design plan as an HTML comment at the top of your file: palette (4–6 hex),
type roles, the signature idea for the hero, the signature idea for the contact, how the bench is handled,
and what you deliberately left out. Then build it. Then open it in a browser (Playwright is available:
`npx playwright screenshot`, or serve it with `python3 -m http.server` and use the browser tools), look at
it at 1440 and 390 wide, fix what is weak, and only then report.

Report back in under 200 words: the plan, what a first-time visitor sees in the first 5 seconds, the two
interactive elements, and one honest weakness.
