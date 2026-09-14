#!/usr/bin/env python3
"""One card per product in assets/projects.json, as a lit window from the facade plus the
facts that matter. Run from the repo root: python3 scripts/cards.py"""
from nightshift import FONT_BODY, FONT_DISP, FONT_MONO, PALETTES, defs, esc, load_json, style, window_svg, write

W, H = 520, 176


def card(pr, theme):
    p = PALETTES[theme]
    gid = f"c{theme[0]}{pr['slug'][:3]}"
    ink, dim, sign = p["ink"], p["dim"], p["sign"]
    line = "".join(f'<tspan x="128" dy="{"0" if i == 0 else "19"}">{esc(l)}</tspan>' for i, l in enumerate(pr["line"]))
    host = pr.get("host", "")
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(pr['name'])}: {esc(' '.join(pr['line']))} {esc(pr['fact'])}">
  {style()}{defs(gid, p)}
  <rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="8" fill="url(#{gid}-plaster)" stroke="{p['slab']}" stroke-width="2"/>
  <rect x="1" y="{H - 14}" width="{W - 2}" height="12" rx="6" fill="{p['walk']}"/>
  <rect x="1" y="{H - 14}" width="{W - 2}" height="2" fill="{p['curb']}"/>
  {window_svg(pr['window'], 30, 26, 66, 88, gid, lit_boost=p['lit_boost'])}
  <text x="128" y="50" font-family="{FONT_DISP}" font-size="24" fill="{ink}">{esc(pr['name'])}</text>
  <text x="128" y="70" font-family="{FONT_MONO}" font-size="11.5" fill="{dim}" letter-spacing=".4">{esc(pr['kind'].upper())}</text>
  <text x="128" y="98" font-family="{FONT_BODY}" font-size="13.5" fill="{ink}">{line}</text>
  <text x="128" y="144" font-family="{FONT_MONO}" font-size="12.5" font-weight="600" fill="{sign}">{esc(pr['fact'])}</text>
  <text x="{W - 18}" y="30" text-anchor="end" font-family="{FONT_MONO}" font-size="10.5" fill="{dim}">{esc(host)}</text>
</svg>"""


if __name__ == "__main__":
    data = load_json("projects.json")
    for pr in data["projects"]:
        for theme in ("dark", "light"):
            write(f"card-{pr['slug']}-{theme}.svg", card(pr, theme))
