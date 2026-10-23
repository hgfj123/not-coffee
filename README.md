# not coffee — website

Real brewed tea. Nothing else.

A fast static site with no dependencies. Edit files in `src/`, then build:

```
python3 build.py
```

The finished site is written to `dist/`, which is what Vercel publishes (see `vercel.json`).
Commit `dist/` along with your changes.

## Where things live

| What | Where |
|---|---|
| Prices, caffeine, flavor copy, AG's notes | `src/data/products.json` |
| Page copy | `src/pages/*.html` |
| Flavor page layout (shared by all flavors) | `src/partials/product.html` |
| Header, footer, bag drawer | `src/partials/layout.html` |
| Colors, fonts, spacing | `src/assets/css/site.css` (top of file) |
| Images | `src/assets/img/` |
| Email, socials, domain | `CONFIG` at the top of `build.py` |

## Still to fill in

Anything shown on the site in `[square brackets]` is waiting for a final fact:
prices, caffeine per can, the ingredient statement, shipping and returns, shelf life,
wholesale case size and minimums, and AG's personal lines.

## Before launch

- Connect checkout: set `CHECKOUT_URL` in `src/assets/js/site.js` (Shopify).
- Swap the email forms for Klaviyo (or similar).
- Add a store locator on `/where-to-buy` once retailers are confirmed.
- Replace the photo placeholders marked `<!-- PHOTO -->`.
- Publish the privacy policy and terms.
