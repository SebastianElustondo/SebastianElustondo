#!/usr/bin/env python3
"""The stack as a card: real logos (Simple Icons, CC0, cached in scripts/icons.json so the README
depends on no third-party service), grouped as in the CV. Data in assets/stack.json.
Run from the repo root: python3 scripts/stack.py"""
import json
import pathlib

from nightshift import FONT_BODY, FONT_DISP, FONT_MONO, PALETTES, defs, esc, load_json, write

ICONS = json.loads((pathlib.Path(__file__).resolve().parent / "icons.json").read_text(encoding="utf-8"))
W = 1000
LABEL_X, FIRST_X, SLOT, ROW, TOP = 40, 200, 96, 74, 30


def lum(hexcolor):
    r, g, b = (int(hexcolor[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def icon_color(hexcolor, theme, p):
    l = lum(hexcolor)
    if theme == "dark" and l < 0.06:
        return p["ink"]
    if theme == "light" and l > 0.45:
        return p["ink"]
    return "#" + hexcolor


def icon(name, x, y, size, theme, p, aliases):
    key = aliases.get(name, name)
    ic = ICONS.get(key)
    if not ic:
        # no logo in Simple Icons (Phaser): a plain tile with the initial
        return (f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="6" fill="none" stroke="{p["ink"]}" stroke-width="2"/>'
                f'<text x="{x + size / 2}" y="{y + size * 0.7}" text-anchor="middle" font-family="{FONT_DISP}" font-size="{size * 0.62:.0f}" fill="{p["ink"]}">{esc(name[0])}</text>')
    s = size / 24
    return f'<path transform="translate({x} {y}) scale({s:.4f})" d="{ic["d"]}" fill="{icon_color(ic["hex"], theme, p)}"/>'


def card(data, theme):
    p = PALETTES[theme]
    gid = f"k{theme[0]}"
    ink, dim, sign = p["ink"], p["dim"], p["sign"]
    groups = data["groups"]
    H = TOP + len(groups) * ROW + 44
    out = []
    for gi, g in enumerate(groups):
        y = TOP + gi * ROW
        out.append(f'<text x="{LABEL_X}" y="{y + 30}" font-family="{FONT_MONO}" font-size="11.5" fill="{dim}" letter-spacing=".6">{esc(g["label"].upper())}</text>')
        if gi:
            out.append(f'<line x1="{LABEL_X}" y1="{y - 8}" x2="{W - 40}" y2="{y - 8}" stroke="{p["slab"]}" stroke-width="1" opacity=".8"/>')
        for ii, name in enumerate(g["items"]):
            x = FIRST_X + ii * SLOT
            out.append(icon(name, x + 18, y + 8, 30, theme, p, data.get("aliases", {})))
            out.append(f'<text x="{x + 33}" y="{y + 58}" text-anchor="middle" font-family="{FONT_BODY}" font-size="11.5" fill="{ink}">{esc(data.get("short", {}).get(name, name))}</text>')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Stack: {esc('; '.join(g['label'] + ': ' + ', '.join(g['items']) for g in groups))}">
  {defs(gid, p)}
  <rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="8" fill="url(#{gid}-plaster)" stroke="{p['slab']}" stroke-width="2"/>
  <rect x="1" y="{H - 14}" width="{W - 2}" height="12" rx="6" fill="{p['walk']}"/>
  <rect x="1" y="{H - 14}" width="{W - 2}" height="2" fill="{p['curb']}"/>
  {"".join(out)}
  <text x="{W - 40}" y="{H - 24}" text-anchor="end" font-family="{FONT_MONO}" font-size="10.5" fill="{dim}">logos: Simple Icons (CC0)</text>
</svg>"""


if __name__ == "__main__":
    data = load_json("stack.json")
    for theme in ("dark", "light"):
        write(f"stack-{theme}.svg", card(data, theme))
