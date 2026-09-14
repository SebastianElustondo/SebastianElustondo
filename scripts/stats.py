#!/usr/bin/env python3
"""GitHub numbers as a building: the last 26 weeks of contributions are its windows (one column
per week, one row per weekday), plus streaks and the language mix of this account's repos.

Reads the GraphQL API with STATS_TOKEN or GITHUB_TOKEN from the environment (falls back to
`gh auth token`). With a personal token that can read private repos, private work counts;
with the default Actions token only public work does, and the card says so.
Run from the repo root: python3 scripts/stats.py"""
import datetime as dt
import json
import os
import subprocess
import urllib.request

from nightshift import FONT_BODY, FONT_DISP, FONT_MONO, PALETTES, defs, esc, style, write

LOGIN = "SebastianElustondo"
WEEKS = 26
W, H = 1000, 320

QUERY = """
query($login:String!){
  user(login:$login){
    contributionsCollection{
      totalCommitContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ contributionCount date } } }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false){
      nodes{ isPrivate languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } }
    }
  }
}"""


def token():
    for k in ("STATS_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(k):
            return os.environ[k]
    try:
        return subprocess.check_output(["gh", "auth", "token"], text=True).strip()
    except Exception:
        raise SystemExit("no token: set STATS_TOKEN or GITHUB_TOKEN")


def fetch():
    req = urllib.request.Request("https://api.github.com/graphql",
                                 data=json.dumps({"query": QUERY, "variables": {"login": LOGIN}}).encode(),
                                 headers={"Authorization": f"bearer {token()}", "Content-Type": "application/json",
                                          "User-Agent": "profile-stats"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if "errors" in data:
        raise SystemExit(data["errors"])
    return data["data"]["user"]


def crunch(u):
    days = [d for w in u["contributionsCollection"]["contributionCalendar"]["weeks"] for d in w["contributionDays"]]
    counts = [d["contributionCount"] for d in days]
    total = u["contributionsCollection"]["contributionCalendar"]["totalContributions"]
    active = sum(1 for c in counts if c)
    longest = cur = 0
    for c in counts:
        cur = cur + 1 if c else 0
        longest = max(longest, cur)
    current = 0
    for c in reversed(counts[:-1] if counts and counts[-1] == 0 else counts):
        if not c:
            break
        current += 1
    langs = {}
    private = 0
    for repo in u["repositories"]["nodes"]:
        private += repo["isPrivate"]
        for e in repo["languages"]["edges"]:
            n = e["node"]["name"]
            langs.setdefault(n, [0, e["node"]["color"] or "#888"])[0] += e["size"]
    top = sorted(langs.items(), key=lambda kv: -kv[1][0])[:6]
    tot = sum(v[0] for v in langs.values()) or 1
    weeks = u["contributionsCollection"]["contributionCalendar"]["weeks"][-WEEKS:]
    return {"total": total, "active": active, "longest": longest, "current": current,
            "langs": [(n, v[0] / tot, v[1]) for n, v in top], "private": private > 0,
            "weeks": weeks, "peak": max(counts) if counts else 0,
            "updated": dt.date.today().isoformat()}


def card(s, theme):
    p = PALETTES[theme]
    gid = f"s{theme[0]}"
    ink, dim, sign, lamp = p["ink"], p["dim"], p["sign"], p["lamp"]
    # the building on the right: 26 columns (weeks) x 7 rows (Sun..Sat)
    bx, by, cw, ch, px, py = 440, 58, 15, 12, 20, 17
    bw = WEEKS * px + 18
    top, ground = by - 20, by + 7 * py + 6
    out = [f'<rect x="{bx - 12}" y="{top}" width="{bw + 8}" height="{H - 40 - top}" fill="url(#{gid}-plaster)"/>',
           f'<rect x="{bx - 20}" y="{top - 8}" width="{bw + 24}" height="10" fill="{p["slab"]}"/>',
           f'<rect x="{bx + bw - 60}" y="{top - 40}" width="24" height="32" fill="{p["slab"]}"/>'
           f'<rect x="{bx + bw - 65}" y="{top - 44}" width="34" height="6" fill="{p["frame"]}"/>']
    peak = max(1, s["peak"])
    for wi, w in enumerate(s["weeks"]):
        for di, d in enumerate(w["contributionDays"]):
            c = d["contributionCount"]
            x, y = bx + wi * px, by + di * py
            if c == 0:
                out.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="{p["glass"]}" stroke="{p["frame"]}" stroke-width="1.5"/>')
            else:
                lvl = min(1.0, 0.35 + 0.65 * (c / peak) ** 0.5)
                op = round(lvl, 2)
                out.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="{lamp}" opacity="{op}" stroke="{p["frame"]}" stroke-width="1.5"><title>{d["date"]}: {c}</title></rect>')
    # ground floor: door + sidewalk
    dx = bx + bw // 2 - 12
    out.append(f'<rect x="{dx}" y="{ground + 4}" width="24" height="30" fill="{p["frame"]}"/>'
               f'<rect x="{dx + 3}" y="{ground + 7}" width="18" height="27" fill="#3B2F2A"/>'
               f'<rect x="{dx + 5}" y="{ground - 2}" width="14" height="5" fill="{lamp}"/>'
               f'<rect x="{bx - 40}" y="{ground + 34}" width="{bw + 70}" height="3" fill="{p["curb"]}"/>')
    building = "".join(out)
    # language bar
    lx, ly, lw = 48, 250, 340
    bars, labels, cx = [], [], lx
    for i, (name, share, color) in enumerate(s["langs"]):
        ww = max(2, round(lw * share))
        bars.append(f'<rect x="{cx}" y="{ly}" width="{ww}" height="10" fill="{color}"/>')
        cx += ww + 1
    tx = lx
    for name, share, color in s["langs"][:5]:
        label = f"{name} {share * 100:.0f}%"
        labels.append(f'<tspan x="{tx}" dy="0"><tspan fill="{color}">■</tspan> {esc(label)}</tspan>')
        tx += int(len(label) * 6.6) + 22
    scope = "public + private repos" if s["private"] else "public repos only"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="GitHub activity: {s['total']} contributions in the last year, {s['active']} active days, longest streak {s['longest']} days.">
  {style()}{defs(gid, p)}
  <rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="8" fill="url(#{gid}-sky)" stroke="{p['slab']}" stroke-width="2"/>
  <rect x="1" y="{H - 40}" width="{W - 2}" height="38" rx="6" fill="{p['walk']}"/>
  <rect x="1" y="{H - 40}" width="{W - 2}" height="3" fill="{p['curb']}"/>
  {building}
  <text x="48" y="54" font-family="{FONT_DISP}" font-size="22" fill="{ink}">The last {WEEKS} weeks, seen from the street</text>
  <text x="48" y="76" font-family="{FONT_BODY}" font-size="13" fill="{dim}">Every window is a day. Lit means I pushed something.</text>
  <text x="48" y="140" font-family="{FONT_MONO}" font-size="46" font-weight="600" fill="{sign}" letter-spacing="-1">{s['total']}</text>
  <text x="48" y="162" font-family="{FONT_BODY}" font-size="13" fill="{dim}">contributions in the last 12 months</text>
  <g font-family="{FONT_MONO}" font-size="22" font-weight="600" fill="{ink}">
    <text x="48" y="206">{s['active']}</text><text x="168" y="206">{s['peak']}</text>
  </g>
  <g font-family="{FONT_BODY}" font-size="12" fill="{dim}">
    <text x="48" y="224">active days</text><text x="168" y="224">busiest day, in contributions</text>
  </g>
  {"".join(bars)}
  <text x="{lx}" y="{ly + 26}" font-family="{FONT_MONO}" font-size="10.5" fill="{dim}">{"".join(labels)}</text>
  <text x="{W - 20}" y="{H - 16}" text-anchor="end" font-family="{FONT_MONO}" font-size="10.5" fill="{dim}">languages by bytes, {scope} · updated {s['updated']}</text>
</svg>"""


if __name__ == "__main__":
    s = crunch(fetch())
    print({k: v for k, v in s.items() if k != "weeks"})
    for theme in ("dark", "light"):
        write(f"stats-{theme}.svg", card(s, theme))
