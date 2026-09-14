"""Shared pieces for the profile-README SVGs: the Night Shift palettes (same values as
src/spine.js), the five product glyphs (read from src/spine.js so they never drift), and
small SVG helpers. Everything is stdlib only."""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SPINE_JS = ROOT / "src" / "spine.js"

PALETTES = {
    # dark README -> the building at night (site palette "night")
    "dark": {
        "sky1": "#0A0E22", "sky2": "#1D1A40", "horizon": "#3E2C3C",
        "plaster": "#2B2637", "plaster2": "#241F30", "slab": "#181423", "frame": "#15111F",
        "sill": "#3A3348", "glass": "#111328", "glass2": "#1C2040",
        "ink": "#F1E9DC", "dim": "#AEA6BE", "rule": "rgba(241,233,220,.16)",
        "lamp": "#F0A64A", "lamp_glow": "rgba(240,166,74,.55)", "sign": "#F2B45C",
        "walk": "#2A2735", "walk_line": "#1E1B28", "curb": "#4A4458", "asphalt": "#141220",
        "stars": 1, "moon": 1, "lit_boost": 1,
    },
    # light README -> the same building by day (site palette "day")
    "light": {
        "sky1": "#6FA8DC", "sky2": "#BDD6EA", "horizon": "#E6ECF0",
        "plaster": "#DCD2C4", "plaster2": "#C6BAAA", "slab": "#9E9081", "frame": "#5C5148",
        "sill": "#B3A697", "glass": "#5C7291", "glass2": "#8AA3BF",
        "ink": "#1E1A2A", "dim": "#5C5468", "rule": "rgba(30,26,42,.16)",
        "lamp": "#B8792A", "lamp_glow": "rgba(184,121,42,0)", "sign": "#7A4E14",
        "walk": "#B9B0A3", "walk_line": "#9E958A", "curb": "#8B8073", "asphalt": "#4B4A52",
        "stars": 0, "moon": 0, "lit_boost": 0.45,
    },
}

# GitHub renders README SVGs inside <img>: no web fonts, so every family gets a system fallback.
FONT_DISP = "'Young Serif', Georgia, 'Times New Roman', serif"
FONT_BODY = "'Atkinson Hyperlegible', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
FONT_MONO = "'Azeret Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

# facade positions (floor, column) exactly as on sebastian.quovra.com
WINDOWS = {
    "pulso":  {"floor": 6, "col": 1, "bg": "#06090a", "glow": "#39ff8f", "ink": "#39ff8f"},
    "trazo":  {"floor": 5, "col": 3, "bg": "#f7f3e9", "glow": "#ffe3ae", "ink": "#2b2620"},
    "quovra": {"floor": 4, "col": 0, "bg": "#171310", "glow": "#7fc99a", "ink": "#F1EAE0"},
    "reachr": {"floor": 3, "col": 2, "bg": "#FAF7F0", "glow": "#cfe6c9", "ink": "#2E6B4B"},
    "cobro":  {"floor": 2, "col": 4, "bg": "#FAF7F0", "glow": "#f7e2b0", "ink": "#1C1813"},
    # not on the facade: a card-only window for the Apify Actors
    "apify":  {"floor": None, "col": None, "bg": "#142033", "glow": "#8FC6FF", "ink": "#BFE0FF"},
}

EXTRA_GLYPHS = {
    "apify": ('<rect x="14" y="12" width="52" height="36" rx="3" fill="#1B2B44" stroke="#BFE0FF" stroke-width="2.5"/>'
              '<rect x="20" y="18" width="16" height="10" fill="#8FC6FF"/><rect x="40" y="18" width="20" height="3" fill="#BFE0FF" opacity=".7"/>'
              '<rect x="40" y="25" width="14" height="3" fill="#BFE0FF" opacity=".45"/>'
              '<rect x="20" y="33" width="40" height="3" fill="#BFE0FF" opacity=".45"/><rect x="20" y="39" width="28" height="3" fill="#BFE0FF" opacity=".45"/>'
              '<circle cx="60" cy="42" r="3.5" fill="#39ff8f"/><rect x="30" y="50" width="20" height="4" fill="#BFE0FF"/>'),
}


def glyphs():
    """Return {key: inner svg markup} for the five lit windows, parsed from src/spine.js."""
    src = SPINE_JS.read_text(encoding="utf-8")
    out = dict(EXTRA_GLYPHS)
    for key in WINDOWS:
        if key in out:
            continue
        m = re.search(key + r":\s*\{.*?svg:'(<svg.*?</svg>)'", src, re.S)
        if not m:
            raise SystemExit(f"glyph for {key} not found in spine.js")
        svg = m.group(1)
        svg = re.sub(r'<svg[^>]*>', '', svg, count=1).replace('</svg>', '')
        out[key] = svg
    return out


def esc(s):
    return html.escape(str(s), quote=True)


def window_svg(key, x, y, w, h, gid, lit_boost=1.0, big=False):
    """A lit window with frame, glass, glyph and glow. `gid` keeps filter ids unique."""
    win = WINDOWS[key]
    frame = 4 if big else 3
    inner = glyphs()[key]
    gx, gy, gw, gh = x + w * 0.10, y + h * 0.32, w * 0.80, h * 0.60
    glow_op = round(0.55 * lit_boost, 2)
    return f"""
  <g class="win win-{key}">
    <rect x="{x - 10}" y="{y - 10}" width="{w + 20}" height="{h + 20}" rx="6" fill="{win['glow']}" opacity="{glow_op}" style="--o:{glow_op}" filter="url(#{gid}-blur)" class="glow"/>
    <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{win['bg']}" stroke="#15111F" stroke-width="{frame}"/>
    <line x1="{x + w / 2}" y1="{y}" x2="{x + w / 2}" y2="{y + h}" stroke="#15111F" stroke-width="1.5" opacity=".35"/>
    <line x1="{x}" y1="{y + h * 0.42}" x2="{x + w}" y2="{y + h * 0.42}" stroke="#15111F" stroke-width="1.5" opacity=".35"/>
    <svg x="{gx:.1f}" y="{gy:.1f}" width="{gw:.1f}" height="{gh:.1f}" viewBox="0 0 80 60">{inner}</svg>
    <rect x="{x - 7}" y="{y + h + 3}" width="{w + 14}" height="6" fill="#3A3348"/>
  </g>"""


def dark_window(x, y, w, h, p, dim=False):
    g1, g2 = (p["glass2"], p["glass"])
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{g2 if dim else g1}" '
            f'stroke="{p["frame"]}" stroke-width="3"/>'
            f'<line x1="{x + w / 2}" y1="{y}" x2="{x + w / 2}" y2="{y + h}" stroke="{p["frame"]}" stroke-width="1.5" opacity=".9"/>'
            f'<line x1="{x}" y1="{y + h * 0.42}" x2="{x + w}" y2="{y + h * 0.42}" stroke="{p["frame"]}" stroke-width="1.5" opacity=".9"/>'
            f'<rect x="{x - 7}" y="{y + h + 3}" width="{w + 14}" height="6" fill="{p["sill"]}"/>')


def defs(gid, p):
    return f"""
  <defs>
    <linearGradient id="{gid}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{p['sky1']}"/><stop offset=".62" stop-color="{p['sky2']}"/><stop offset="1" stop-color="{p['horizon']}"/>
    </linearGradient>
    <linearGradient id="{gid}-plaster" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{p['plaster']}"/><stop offset="1" stop-color="{p['plaster2']}"/>
    </linearGradient>
    <filter id="{gid}-blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="{gid}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>"""


def style(reduced_ok=True):
    css = """
    .glow{animation:breathe 6s ease-in-out infinite}
    .win-trazo .glow{animation-delay:-1.3s}.win-quovra .glow{animation-delay:-2.7s}
    .win-reachr .glow{animation-delay:-4.1s}.win-cobro .glow{animation-delay:-5.2s}
    .star{animation:twinkle 4s ease-in-out infinite}
    .star:nth-child(3n){animation-delay:-1.4s}.star:nth-child(3n+1){animation-delay:-2.6s}
    @keyframes breathe{0%,100%{opacity:var(--o,.55)}50%{opacity:calc(var(--o,.55) * .55)}}
    @keyframes twinkle{0%,100%{opacity:.9}50%{opacity:.25}}
    @media (prefers-reduced-motion:reduce){.glow,.star{animation:none}}
    """
    return f"<style>{css}</style>"


def load_json(name):
    return json.loads((ASSETS / name).read_text(encoding="utf-8"))


def write(name, svg):
    ASSETS.mkdir(exist_ok=True)
    path = ASSETS / name
    path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + svg.strip() + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")
