#!/usr/bin/env python3
"""Profile banner: the Night Shift building from sebastian.quovra.com, one SVG per README theme.
Run from the repo root: python3 scripts/banner.py"""
import random

from nightshift import (FONT_BODY, FONT_DISP, FONT_MONO, PALETTES, WINDOWS, dark_window, defs,
                        esc, style, window_svg, write)

W, H = 1200, 470
BX, BW = 736, 340            # main building
COLS, FLOORS = 5, 6
WW, WH = 44, 48              # window size
PITCH_X, PITCH_Y = 64, 62
TOP = 76                     # y of floor 6
GROUND = TOP + (FLOORS - 1) * PITCH_Y          # y of floor 1 (ground floor)
STREET = GROUND + WH + 14                      # sidewalk starts here


def stars(p, gid):
    if not p["stars"]:
        return ""
    rnd = random.Random(2026)
    out = []
    for _ in range(70):
        x, y = rnd.uniform(10, W - 10), rnd.uniform(8, 300)
        r = rnd.choice((1.0, 1.3, 1.7, 2.2))
        out.append(f'<circle class="star" cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#F1E9DC" opacity=".8"/>')
    return f'<g opacity="{p["stars"]}">' + "".join(out) + "</g>"


def moon(p, gid):
    if not p["moon"]:
        return ""
    return (f'<g opacity="{p["moon"]}"><circle cx="1136" cy="50" r="34" fill="#F1E9DC" opacity=".18" filter="url(#{gid}-blur)"/>'
            f'<circle cx="1136" cy="50" r="20" fill="#F3ECDD"/><circle cx="1145" cy="44" r="17" fill="{p["sky1"]}"/></g>')


def neighbour(x, w, top, p, seed, lit_boost, gid):
    rnd = random.Random(seed)
    out = [f'<rect x="{x}" y="{top}" width="{w}" height="{STREET - top}" fill="{p["plaster2"]}"/>',
           f'<rect x="{x - 4}" y="{top - 6}" width="{w + 8}" height="8" fill="{p["slab"]}"/>']
    y = top + 22
    while y + 30 < GROUND + WH:
        for cx in range(x + 16, x + w - 30, 34):
            lit = rnd.random() < 0.22
            if lit:
                out.append(f'<rect x="{cx - 8}" y="{y - 8}" width="36" height="42" rx="6" fill="{p["lamp"]}" opacity="{0.45 * lit_boost:.2f}" filter="url(#{gid}-blur)"/>')
                out.append(f'<rect x="{cx}" y="{y}" width="20" height="26" fill="{p["lamp"]}" opacity="{0.75 * lit_boost + 0.2:.2f}" stroke="{p["frame"]}" stroke-width="2"/>')
                out.append(f'<rect x="{cx + 4}" y="{y + 4}" width="12" height="18" fill="#FFF1D6" opacity="{0.35 * lit_boost:.2f}"/>')
            else:
                out.append(f'<rect x="{cx}" y="{y}" width="20" height="26" fill="{p["glass"]}" stroke="{p["frame"]}" stroke-width="2"/>')
        y += 44
    return "".join(out)


def building(p, gid, theme):
    lb = p["lit_boost"]
    out = [
        f'<rect x="{BX}" y="{TOP - 24}" width="{BW}" height="{STREET - TOP + 24}" fill="url(#{gid}-plaster)"/>',
        f'<rect x="{BX - 8}" y="{TOP - 32}" width="{BW + 16}" height="10" fill="{p["slab"]}"/>',
        # water tank + antenna on the roof
        f'<rect x="{BX + 130}" y="{TOP - 68}" width="30" height="36" fill="{p["slab"]}"/>'
        f'<rect x="{BX + 124}" y="{TOP - 72}" width="42" height="6" fill="{p["frame"]}"/>'
        f'<line x1="{BX + 60}" y1="{TOP - 32}" x2="{BX + 60}" y2="{TOP - 96}" stroke="{p["frame"]}" stroke-width="3"/>'
        f'<circle cx="{BX + 60}" cy="{TOP - 98}" r="3" fill="{p["lamp"]}"/>',
    ]
    by_pos = {(w["floor"], w["col"]): k for k, w in WINDOWS.items() if w["floor"]}
    for f in range(FLOORS, 0, -1):
        y = TOP + (FLOORS - f) * PITCH_Y
        # a thin slab between floors
        out.append(f'<rect x="{BX}" y="{y - 12}" width="{BW}" height="2" fill="{p["slab"]}" opacity=".7"/>')
        for c in range(COLS):
            x = BX + 22 + c * PITCH_X
            if f == 1 and c == 2:
                # the street door, with its lamp
                out.append(f'<rect x="{x - 6}" y="{y - 6}" width="{WW + 12}" height="{WH + 14}" fill="{p["frame"]}"/>'
                           f'<rect x="{x - 2}" y="{y - 2}" width="{WW + 4}" height="{WH + 10}" fill="#3B2F2A"/>'
                           f'<line x1="{x + WW / 2}" y1="{y}" x2="{x + WW / 2}" y2="{y + WH + 6}" stroke="{p["frame"]}" stroke-width="2"/>'
                           f'<circle cx="{x + WW / 2 - 6}" cy="{y + WH / 2 + 4}" r="1.6" fill="{p["sign"]}"/>'
                           f'<circle cx="{x + WW / 2 + 6}" cy="{y + WH / 2 + 4}" r="1.6" fill="{p["sign"]}"/>'
                           f'<circle cx="{x + WW / 2}" cy="{y - 14}" r="16" fill="{p["lamp"]}" opacity="{0.35 * lb:.2f}" filter="url(#{gid}-blur)"/>'
                           f'<rect x="{x + WW / 2 - 7}" y="{y - 18}" width="14" height="6" fill="{p["lamp"]}"/>')
                continue
            key = by_pos.get((f, c))
            if key:
                out.append(window_svg(key, x, y, WW, WH, gid, lit_boost=lb))
            else:
                out.append(dark_window(x, y, WW, WH, p, dim=(f == 1)))
    return "".join(out)


def street(p, gid):
    return (f'<rect x="0" y="{STREET}" width="{W}" height="{H - STREET}" fill="{p["walk"]}"/>'
            f'<rect x="0" y="{STREET}" width="{W}" height="3" fill="{p["curb"]}"/>'
            f'<rect x="0" y="{STREET + 26}" width="{W}" height="3" fill="{p["curb"]}"/>'
            f'<rect x="0" y="{STREET + 29}" width="{W}" height="{H - STREET - 29}" fill="{p["asphalt"]}"/>'
            + "".join(f'<rect x="{x}" y="{STREET + 40}" width="34" height="3" fill="{p["walk_line"]}" opacity=".9"/>' for x in range(20, W, 70)))


def text(p, theme):
    ink, dim, sign = p["ink"], p["dim"], p["sign"]
    who = ["Six years on production platforms (Mercado Libre, Conekta, Spin, Kleva):",
           "Node, TypeScript, multi-tenant PostgreSQL, AWS, payments. That's daytime.",
           "After dark I design, build and run complete products alone."]
    lines = "".join(f'<tspan x="64" dy="{"0" if i == 0 else "24"}">{esc(l)}</tspan>' for i, l in enumerate(who))
    return f"""
  <g>
    <text x="64" y="150" font-family="{FONT_DISP}" font-size="52" fill="{ink}" letter-spacing="-.5">Sebastián Elustondo</text>
    <text x="64" y="192" font-family="{FONT_BODY}" font-size="19" fill="{ink}">Software engineer, Buenos Aires. <tspan font-style="italic" fill="{dim}">Days at the day job, nights on my own products.</tspan></text>
    <text x="64" y="240" font-family="{FONT_BODY}" font-size="15.5" fill="{dim}">{lines}</text>
    <text x="64" y="336" font-family="{FONT_MONO}" font-size="30" font-weight="600" fill="{sign}" letter-spacing="-.5">GMT-3</text>
    <text x="160" y="336" font-family="{FONT_BODY}" font-size="14" fill="{dim}">Buenos Aires · full overlap with US hours</text>
    <text x="64" y="386" font-family="{FONT_BODY}" font-size="15" fill="{ink}">Five windows are lit. Each one is a product I built and still run.</text>
    <text x="64" y="410" font-family="{FONT_BODY}" font-size="15" fill="{dim}">Play them at <tspan fill="{sign}">sebastian.quovra.com</tspan></text>
  </g>"""


def banner(theme):
    p = PALETTES[theme]
    gid = f"b{theme[0]}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Sebastián Elustondo. Software engineer, Buenos Aires. A building at night with five lit windows, one per product.">
  {style()}{defs(gid, p)}
  <rect width="{W}" height="{H}" fill="url(#{gid}-sky)"/>
  {stars(p, gid)}{moon(p, gid)}
  {neighbour(624, 100, 170, p, 7, p["lit_boost"], gid)}
  {neighbour(1088, 104, 120, p, 11, p["lit_boost"], gid)}
  {building(p, gid, theme)}
  {street(p, gid)}
  {text(p, theme)}
</svg>"""


if __name__ == "__main__":
    for theme in ("dark", "light"):
        write(f"banner-{theme}.svg", banner(theme))
