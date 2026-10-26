#!/usr/bin/env python3
"""Build the not coffee website into ./dist. Standard library only.

    python3 build.py

- Pages live in src/pages/*.html (HTML fragments with a metadata comment on top).
- Flavor pages are generated from src/partials/product.html + src/data/products.json.
- Shared snippets are written as {{name}} tokens and filled in below.
- Output is plain static HTML: each page becomes <path>/index.html so URLs stay clean.
"""
import html
import json
import re
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

CONFIG = {
    "site_url": "https://www.notnotcoffee.com",   # final domain
    "email": "hello@notcoffee.com",
    "instagram": "https://www.instagram.com/notcffee/",
    "tiktok": "https://www.tiktok.com/@notcffee",
    "year": "2026",
}

DATA = json.loads((SRC / "data/products.json").read_text())
CREATORS = json.loads((SRC / "data/creators.json").read_text()).get("videos", [])
FLAVORS = DATA["flavors"]


def esc(s):
    return html.escape(s or "", quote=True)


def price_text(p):
    return f"${p:,.2f}" if isinstance(p, (int, float)) else "Price coming soon"


def can(slug):
    return f"/assets/img/can-{slug}.webp"


def bot(slug):
    return f"/assets/img/botanical-{slug}.webp"


def placeholder(text):
    """Visible, clearly-marked spot for facts that aren't final yet."""
    return f'<span class="tbc">[{esc(text)}]</span>'


# ---------------------------------------------------------------- snippets
def flavor_tile(f, square=False):
    sq = " square" if square else ""
    return f"""
<a class="tile reveal" href="/flavors/{f['slug']}">
  <div class="tile-media{sq}">
    <img class="bot bot-a" src="{bot(f['slug'])}" alt="" loading="lazy">
    <img class="bot bot-b" src="{bot(f['slug'])}" alt="" loading="lazy">
    <img class="can" src="{can(f['slug'])}" alt="{esc(f['name'])} can" width="359" height="989" loading="lazy">
  </div>
  <div class="tile-row"><span class="tile-name">{esc(f['name'])}</span><span class="tile-price">{price_text(f['price'])}</span></div>
  <div class="tile-sub">{esc(f['tagline'])}</div>
</a>"""


SIGNUP = """
<section class="bg-stone section" aria-labelledby="signup-h">
  <div class="wrap">
    <form class="signup" data-mailto="{{email}}" data-subject="Tell me when not coffee lands near me">
      <h2 class="h2" id="signup-h">Know when we land near you.</h2>
      <p class="body">One email, when a shelf in your city has us. That's it.</p>
      <div class="field-row">
        <label class="sr-only" for="su-email">Email address</label>
        <input class="input" id="su-email" name="email" data-label="Email" type="email" autocomplete="email" placeholder="Email address" required>
        <label class="sr-only" for="su-city">City</label>
        <input class="input" id="su-city" name="city" data-label="City" type="text" autocomplete="address-level2" placeholder="Your city" required style="flex-basis:160px">
        <button class="btn" type="submit">Notify me</button>
      </div>
      <p class="form-note" aria-live="polite"></p>
    </form>
  </div>
</section>"""
# Swap this form for a Klaviyo (or similar) embed when email marketing is set up.


ICON_IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor"/></svg>'
ICON_TT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.6 2.2 4.4 5 4.6"/></svg>'


def creator_videos():
    """'Poured by creators' grid. Renders nothing until src/data/creators.json has videos."""
    if not CREATORS:
        return ""
    tiles = []
    for v in CREATORS:
        plat = v.get("platform", "instagram").lower()
        icon, plat_name = (ICON_TT, "TikTok") if plat == "tiktok" else (ICON_IG, "Instagram")
        handle = esc(v["handle"].lstrip("@"))
        tiles.append(
            f'<a class="clip reveal" href="{esc(v["url"])}" target="_blank" rel="noopener">'
            f'<span class="clip-media"><img src="/assets/img/creators/{esc(v["cover"])}" alt="Video by @{handle}" loading="lazy">'
            f'<span class="clip-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span></span>'
            f'<span class="clip-meta"><span>@{handle}</span><span class="clip-plat" title="{plat_name}">{icon}<span class="sr-only">on {plat_name}</span></span></span>'
            "</a>")
    return f"""
<section class="wrap-narrow" style="padding-bottom:clamp(56px,7vw,96px)" aria-labelledby="clips-h">
  <div class="section-head">
    <h2 class="h2" id="clips-h">Poured <em>by creators.</em></h2>
    <p class="body">Real people, real fridges. Tag @notcffee on Instagram or TikTok and you might end up here.</p>
  </div>
  <div class="clips">{"".join(tiles)}</div>
</section>"""


def snippets():
    return {
        "creator_videos": creator_videos(),
        "tiles_lineup": "".join(flavor_tile(f) for f in FLAVORS),
        "tiles_shop": "".join(flavor_tile(f, square=True) for f in FLAVORS),
        "signup": SIGNUP,
        "bot_cards": "".join(
            f'<a class="bot-card reveal" href="/flavors/{f["slug"]}" style="background:{f["colors"]["wash"]}"><img src="{bot(f["slug"])}" alt="Hand-drawn {esc(f["name"].lower())} botanical" loading="lazy"><span>{esc(f["name"])}</span></a>'
            for f in FLAVORS
        ),
        "botanical_still": '<div class="botanical-still">' + "".join(
            f'<img src="{bot(f["slug"])}" alt="" loading="lazy">' for f in FLAVORS) + "</div>",
                "caffeine_any": next((f["caffeine"] for f in FLAVORS if f["caffeine"]), None) or placeholder("mg per can"),
    }


# ---------------------------------------------------------------- products
def spec_rows(rows):
    return "".join(f"<li><span>{esc(k)}</span><span>{v}</span></li>" for k, v in rows)


def label_rows(caffeine):
    rows = [("Serving size", "12 fl oz (355 mL)"), ("Calories", "0"), ("Total fat", "0g"),
            ("Sodium", "20mg"), ("Total carbohydrate", "0g"), ("Total sugars", "0g"),
            ("Protein", "0g"), ("Potassium", "40mg"), ("Caffeine", caffeine)]
    return spec_rows(rows)


SHIP_ROWS = spec_rows([
    ("Delivery", placeholder("Shipping times")),
    ("Free shipping", placeholder("Threshold")),
    ("Returns", placeholder("Policy")),
])


def product_page(item):
    tpl = (SRC / "partials/product.html").read_text()
    slug = item["slug"]
    caffeine = esc(item["caffeine"]) if item["caffeine"] else placeholder("mg per can")
    tea_rows = [("The tea", esc(item["tea"])), ("Sweetener", "None, unsweetened"), ("Calories", "0"),
                ("Caffeine", caffeine), ("Brew", "Brewed, never from concentrate"),
                ("Can", "12 fl oz slim"), ("Made", "Brewed &amp; Canned in the USA")]
    ag = esc(item["agNote"]) if item["agNote"] else placeholder(
        "A line about how this one was poured at home")
    cur = ' aria-current="page"'
    switch = "".join('<a href="/flavors/%s"%s>%s</a>' % (f["slug"], cur if f["slug"] == slug else "", esc(f["name"]))
                     for f in FLAVORS)
    rep = {
        "slug": slug,
        "floaters": "".join(f'<img class="floater {c}" src="{bot(slug)}" alt="" aria-hidden="true">'
                            for c in ["f1", "f2", "f3", "f4"]),
        "switcher": switch, "crumb": esc(item["name"]),
        "heading": f'{esc(item["first"])}<br><em>{esc(item["second"])}</em>',
        "notes": esc(" · ".join(item["notes"])), "desc": esc(item["description"]),
        "media": f'<img src="{can(slug)}" alt="{esc(item["name"])} can" width="359" height="989" fetchpriority="high">',
        "pack": esc(item["packLabel"]), "price": price_text(item["price"]),
        "price_cls": "" if isinstance(item["price"], (int, float)) else " tbc",
        "tea_rows": spec_rows(tea_rows), "label_rows": label_rows(caffeine), "ship_rows": SHIP_ROWS,
        "ag": ag, "other_tiles": "".join(flavor_tile(f) for f in FLAVORS if f["slug"] != slug),
    }
    for k, v in rep.items():
        tpl = tpl.replace("{{" + k + "}}", v)
    return tpl, f"{item['name']} Cold Tea | not coffee", f"{item['name']}: {item['description']}"


def products_js():
    m = {}
    for f in FLAVORS:
        m[f["slug"]] = {"name": f["name"], "pack": f["packLabel"], "price": f["price"],
                        "thumb": can(f["slug"]).lstrip("/")}
    return "/* Generated by build.py from src/data/products.json. Do not edit. */\nwindow.NC_PRODUCTS = " + json.dumps(
        {"currency": DATA["currency"], "products": m}, indent=1) + ";\n"


# ---------------------------------------------------------------- pages
META_RE = re.compile(r"^<!--(.*?)-->\s*", re.S)


def read_page(path):
    raw = path.read_text()
    meta = {}
    m = META_RE.match(raw)
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        raw = raw[m.end():]
    return meta, raw


def render(content, title, description, path, nav=None, head_extra=""):
    page = (SRC / "partials/layout.html").read_text()
    reps = dict(CONFIG)
    reps.update({
        "title": esc(title), "description": esc(description), "path": path,
        "content": content, "head_extra": head_extra, "version": VERSION,
    })
    for key in ["shop", "story", "faq", "wholesale"]:
        reps["cur_" + key] = ' aria-current="page"' if nav == key else ""
    # content first so tokens inside content get filled too
    page = page.replace("{{content}}", content)
    for k, v in reps.items():
        page = page.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[a-z_]+\}\}", page)
    if left:
        raise SystemExit(f"Unfilled tokens in {path}: {sorted(set(left))}")
    return page


def relativize(path, text):
    """Rewrite root-absolute links so the page works from any folder (preview builds)."""
    depth = 0 if path in ("/", "/404") else path.strip("/").count("/") + 1
    pre = "../" * depth or "./"

    def page_link(m):
        attr, target, query, frag = m.group(1), m.group(2), m.group(3) or "", m.group(4) or ""
        if target.startswith("assets/") or "." in target.split("/")[-1]:
            return f'{attr}="{pre}{target}{query}{frag}"'
        return f'{attr}="{pre}{target + "/" if target else ""}index.html{frag}"'

    return re.sub(r'(href|src)="/(?!/)([^"#?]*)(\?[^"#]*)?(#[^"]*)?"', page_link, text)


RELATIVE = False


def write(path, html_text):
    if RELATIVE:
        html_text = relativize(path, html_text)
    out = DIST / path.strip("/") / "index.html" if path not in ("/", "/404") else (
        DIST / "index.html" if path == "/" else DIST / "404.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html_text)


VERSION = str(int(time.time()))


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(SRC / "assets", DIST / "assets")
    (DIST / "assets/js/products.js").write_text(products_js())

    snips = snippets()
    pages = []
    for p in sorted((SRC / "pages").glob("*.html")):
        meta, body = read_page(p)
        for k, v in snips.items():
            body = body.replace("{{" + k + "}}", v)
        path = meta.get("path", "/" + p.stem)
        write(path, render(body, meta["title"], meta["description"], path, meta.get("nav")))
        pages.append(path)

    for f in FLAVORS:
        body, title, desc = product_page(f)
        path = f"/flavors/{f['slug']}"
        write(path, render(body, title, desc, path, "shop", f'<style>:root{{--wash:{f["colors"]["wash"]}}}</style>'))
        pages.append(path)

    # sitemap + robots
    urls = "".join(f"<url><loc>{CONFIG['site_url']}{p if p != '/' else ''}/</loc></url>".replace("//</loc>", "/</loc>")
                   for p in pages if p != "/404")
    (DIST / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {CONFIG['site_url']}/sitemap.xml\n")
    print(f"Built {len(pages)} pages into {DIST}")
    for p in pages:
        print("  ", p)


if __name__ == "__main__":
    import sys
    if "--relative" in sys.argv:
        RELATIVE = True
        DIST = ROOT / "dist-preview"
    main()
