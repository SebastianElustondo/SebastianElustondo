#!/usr/bin/env python3
"""Section placards (the floor plates from the site's bench) and the ground-floor sign that
closes the README. Run from the repo root: python3 scripts/plates.py"""
from nightshift import FONT_BODY, FONT_DISP, FONT_MONO, PALETTES, defs, esc, write

W = 1000
PLACARDS = [
    ("live",  "6º", "Live",  "five lit windows, one per product"),
    ("stack", "3º", "Stack", "what the building is made of"),
]


def placard(key, floor, title, note, theme):
    p = PALETTES[theme]
    gid = f"p{theme[0]}{key}"
    H = 64
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(title)}: {esc(note)}">
  {defs(gid, p)}
  <rect x="1" y="10" width="{78 + 14 * len(title)}" height="44" rx="4" fill="url(#{gid}-plaster)" stroke="{p['slab']}" stroke-width="2"/>
  <circle cx="14" cy="32" r="2" fill="{p['sill']}"/><circle cx="{78 + 14 * len(title) - 12}" cy="32" r="2" fill="{p['sill']}"/>
  <text x="28" y="39" font-family="{FONT_MONO}" font-size="13" font-weight="600" fill="{p['dim']}" letter-spacing=".5">{esc(floor)}</text>
  <text x="60" y="40" font-family="{FONT_DISP}" font-size="24" fill="{p['ink']}">{esc(title)}</text>
  <line x1="{78 + 14 * len(title) + 16}" y1="32" x2="{W - 4}" y2="32" stroke="{p['sill']}" stroke-width="2" opacity=".8"/>
  <text x="{W - 4}" y="22" text-anchor="end" font-family="{FONT_BODY}" font-size="12.5" font-style="italic" fill="{p['dim']}">{esc(note)}</text>
</svg>"""


def sign(theme):
    p = PALETTES[theme]
    gid = f"g{theme[0]}"
    H = 150
    lamp_op = 0.22 * p["lit_boost"] + 0.06
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Now: open to remote full-time roles. Argentina, GMT-3, full overlap with US hours.">
  {defs(gid, p)}
  <rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="8" fill="url(#{gid}-plaster)" stroke="{p['slab']}" stroke-width="2"/>
  <rect x="1" y="{H - 22}" width="{W - 2}" height="20" rx="6" fill="{p['walk']}"/>
  <rect x="1" y="{H - 22}" width="{W - 2}" height="3" fill="{p['curb']}"/>
  <ellipse cx="500" cy="34" rx="170" ry="46" fill="{p['lamp']}" opacity="{lamp_op:.2f}" filter="url(#{gid}-blur)"/>
  <rect x="486" y="6" width="28" height="7" fill="{p['lamp']}"/>
  <rect x="470" y="30" width="60" height="4" fill="{p['frame']}" opacity=".5"/>
  <text x="500" y="76" text-anchor="middle" font-family="{FONT_DISP}" font-size="30" fill="{p['ink']}">Open to remote full-time roles</text>
  <text x="500" y="104" text-anchor="middle" font-family="{FONT_MONO}" font-size="13.5" fill="{p['sign']}" letter-spacing=".6">ARGENTINA · GMT-3 · FULL OVERLAP WITH US HOURS</text>
  <circle cx="60" cy="{H - 12}" r="1.6" fill="{p['walk_line']}"/><circle cx="940" cy="{H - 12}" r="1.6" fill="{p['walk_line']}"/>
</svg>"""


if __name__ == "__main__":
    for theme in ("dark", "light"):
        for key, floor, title, note in PLACARDS:
            write(f"placard-{key}-{theme}.svg", placard(key, floor, title, note, theme))
        write(f"sign-{theme}.svg", sign(theme))
