#!/usr/bin/env python3
"""Assemble the playable portfolio into a single self-contained index.html.

Usage: python3 build.py [artifact_output_path]
  - writes ./index.html (full document, deployable to Cloudflare Pages as-is)
  - optionally writes the head-less artifact variant to the given path
"""
import sys, pathlib, shutil

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
TOYS = ["pulso", "trazo", "quovra", "reachr", "cobro"]  # page order: dark / paper / dark / cream / cream

def read(p):
    return p.read_text(encoding="utf-8") if p.exists() else ""

def main():
    tpl = read(SRC / "index.html")
    css = [read(SRC / "spine.css")]
    js = [read(SRC / "spine.js")]
    html = []
    missing = []
    for t in TOYS:
        h, c, j = (read(SRC / "toys" / f"{t}.{ext}") for ext in ("html", "css", "js"))
        if not h:
            missing.append(t); continue
        html.append(f"<!-- ===== toy: {t} ===== -->\n{h}")
        css.append(f"/* ===== toy: {t} ===== */\n{c}")
        js.append(f"/* ===== toy: {t} ===== */\n{j}")
    content = (tpl.replace("<!--@css-->", "\n".join(css))
                  .replace("<!--@toys-->", "\n\n".join(html))
                  .replace("<!--@js-->", "\n".join(js)))
    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<meta name="description" content="Sebastián Elustondo, product engineer from Argentina. '
            'A portfolio you play: five real products, working on the page.">\n'
            '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22>'
            '<rect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%230C1820%22/>'
            '<circle cx=%2250%22 cy=%2250%22 r=%2222%22 fill=%22%235B9DF5%22/></svg>">\n</head>\n<body>\n')
    beacon = ('\n<!-- Cloudflare Web Analytics (privacy-first, no cookies) -->\n'
              '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" '
              'data-cf-beacon=\'{"token": "a952157d3c8e41e59cf9e893d5cd07f6"}\'></script>\n')
    (ROOT / "index.html").write_text(head + content + beacon + "\n</body>\n</html>\n", encoding="utf-8")
    if len(sys.argv) > 1:
        pathlib.Path(sys.argv[1]).write_text(content, encoding="utf-8")
    # dist/ = deployable folder: index.html + everything in public/
    dist = ROOT / "dist"
    shutil.rmtree(dist, ignore_errors=True); dist.mkdir()
    shutil.copy(ROOT / "index.html", dist / "index.html")
    pub = ROOT / "public"
    if pub.exists():
        for f in pub.iterdir():
            if f.is_file(): shutil.copy(f, dist / f.name)
    size = (ROOT / "index.html").stat().st_size
    print(f"built index.html ({size/1024:.1f} KB); toys: {[t for t in TOYS if t not in missing]}; missing: {missing}; dist: {sorted(x.name for x in dist.iterdir())}")

if __name__ == "__main__":
    main()
