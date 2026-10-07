# YAKOUTE FASHION — متجر أزياء إلكتروني (WooCommerce multilingual)

Portable local stack (Windows): WordPress + WooCommerce + Polylang (AR/FR/EN),
MariaDB on port 3307, PHP built-in server on port 8080. No admin rights needed.

## Quick start

1. Double-click **START.BAT**.
   - Starts MariaDB (`tools\bin\db-start.cmd`).
   - Starts the web server (`tools\bin\serve.cmd`, skips if port 8080 is busy).
   - Opens the shop and wp-admin.
2. Shop: <http://localhost:8080> — Admin: <http://localhost:8080/wp-admin>
   (`yakoute` / `yakoute@2026`).
3. To stop everything, double-click **STOP.BAT** (clean MariaDB shutdown —
   never kill `mysqld.exe`, an unclean shutdown corrupts InnoDB tables).

## Languages & URLs

| Language | Home | Shop | Cart | Checkout | Terms |
|---|---|---|---|---|---|
| العربية (default, RTL) | `/` | `/shop/` | `/cart/` | `/checkout/` | `/terms/` |
| Français | `/fr/` | `/fr/shop/` | `/fr/cart/` | `/fr/checkout/` | `/fr/terms/` |
| English | `/en/` | `/en/shop/` | `/en/cart/` | `/en/checkout/` | `/en/terms/` |

Products and categories keep separate slugs per language
(`robe-ete-fleurie`, `robe-ete-fleurie-fr`, `robe-ete-fleurie-en`).
Arabic is the source language; `setup/products.json` holds the AR/FR/EN
names and descriptions.

## Checkout

Cash on delivery only, free shipping, Morocco only. Classic (shortcode)
cart/checkout pages, one page per language. The order thank-you page stays
in the checkout language and every order stores its language in `_order_lang`
(visible in the admin order screen).

Test it (needs the stack running):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\HP840G~1\t\place-order.ps1 -Lang fr
```

`-Lang ar|fr|en`. Afterwards delete the test order and restore the stock:

```
tools\bin\wp.cmd eval-file setup\clean-test-orders.php --user=1
tools\bin\wp.cmd eval-file setup\fix-stock.php --user=1
```

## Rebuild from scratch (idempotent scripts)

Every script can be re-run safely; each one repairs what it owns.

```
tools\bin\wp.cmd eval-file setup\rebuild-languages.php --user=1
tools\bin\wp.cmd eval-file setup\tune-polylang.php --user=1
tools\bin\wp.cmd eval-file setup\configure-site.php --user=1
tools\bin\wp.cmd eval-file setup\configure-store.php --user=1
tools\bin\wp.cmd eval-file setup\import-products.php --user=1
tools\bin\wp.cmd eval-file setup\link-languages.php --user=1
tools\bin\wp.cmd eval-file setup\link-shop-pages.php --user=1
tools\bin\wp.cmd eval-file setup\link-pages.php --user=1
tools\bin\wp.cmd eval-file setup\create-terms-page.php --user=1
tools\bin\wp.cmd eval-file setup\use-classic-woo-pages.php --user=1
tools\bin\wp.cmd eval-file setup\configure-payments-shipping.php --user=1
tools\bin\wp.cmd eval-file setup\fix-stock.php --user=1
tools\bin\wp.cmd eval-file setup\restore-theme-mods.php --user=1
tools\bin\wp.cmd rewrite flush --user=1
```

What lives where:

- `wordpress/wp-content/themes/yakoute/` — child theme (boutique header,
  front page, multilingual SEO in `inc/seo.php`).
- `wordpress/wp-content/mu-plugins/yakoute-multilingual.php` — Polylang +
  WooCommerce glue (clean URLs, page mapping, checkout language, empty-cart
  redirect per language).
- `wordpress/wp-content/mu-plugins/yakoute-translations.php` — translation
  packs loading, COD/shipping labels per language, order language meta.
- `setup/products.json` — the catalogue source of truth (prices, stock,
  AR/FR/EN copy).
- `setup/clean-test-orders.php` — removes `test@example.com` orders and
  releases their stock.
- `setup/legacy/` — retired experiments, never run directly.

## Version control

`.gitignore` keeps the portable stack out of git (`tools/`, WordPress core,
`wp-content/uploads`, `wp-config.php`, `*.sql`, logs). Tracked: the child
theme, mu-plugins, `setup/`, `assets/`, docs and these BAT files.

## Hosting / migration

See `docs/HOSTING-MIGRATION.md`.
