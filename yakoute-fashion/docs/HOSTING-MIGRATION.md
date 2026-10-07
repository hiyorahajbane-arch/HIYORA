# Hosting & migration guide — YAKOUTE FASHION

## What moves to the host

The `tools/` directory (portable PHP/MariaDB) and `wordpress/wp-config.php`
stay local. Everything else that matters is files plus one database dump:

1. `wordpress/wp-content/themes/yakoute/` (child theme)
2. `wordpress/wp-content/mu-plugins/` (`yakoute-multilingual.php`,
   `yakoute-translations.php`)
3. `wordpress/wp-content/uploads/` (product images, logo)
4. `wordpress/wp-content/languages/` is optional — WordPress re-downloads
   language packs on update; the WooCommerce `.mo` packs used locally live in
   `wordpress/wp-content/plugins/woocommerce/i18n/languages/` and
   `wordpress/wp-content/themes/storefront/languages/` (re-downloadable, see below).
5. A full dump of the `yakoute_fashion` database.

## 1. Dump the database (local)

```
tools\mariadb\bin\mysqldump.exe --protocol=TCP -h 127.0.0.1 -P 3307 -u root -pyakoute_local_pw ^
  --single-transaction --routines yakoute_fashion > yakoute_fashion.sql
```

Verify: `mysqlcheck --protocol=TCP -h 127.0.0.1 -P 3307 -u root -pyakoute_local_pw --check yakoute_fashion`
must report no errors before you dump.

## 2. Prepare WordPress on the host

- Install WordPress 7.1+, PHP 8.3+, MySQL 8 / MariaDB 10.6+.
- Install and activate: WooCommerce 11.x, Polylang 3.x, Storefront (parent).
- Copy the child theme, the two mu-plugins and `uploads/` into place.
- Create an empty database + user, import `yakoute_fashion.sql`.
- Copy `wordpress/wp-config.php` values (table prefix `wp_`, salts —
  **generate fresh salts for production**, charset `utf8mb4`).

## 3. Search-replace the URL

```
wp search-replace 'http://localhost:8080' 'https://www.example.com' --all-tables --precise
wp rewrite flush
```

## 4. Re-run the setup scripts on the host (same order as README)

They repair IDs, translation links, payment/shipping settings and stock from
`setup/products.json`. Then place one test order per language and delete it
with `setup/clean-test-orders.php` + `setup/fix-stock.php`.

## 5. Language packs

WordPress core packs install from Dashboard → Updates. If the host has no
outbound HTTP, copy these local files to the same relative paths:

- `wp-content/plugins/woocommerce/i18n/languages/woocommerce-{ar,fr_FR,en_GB}.mo`
- `wp-content/themes/storefront/languages/storefront-{fr_FR,en_GB}.mo`
  (no Arabic Storefront pack is published; Arabic Storefront strings fall back
  to the child-theme overrides in `yakoute-translations.php`).

## 6. Mail, HTTPS, backups

- The local stack has no mail server (order e-mails fail locally with
  “Could not instantiate mail function”). On the host, configure SMTP
  (e.g. the host’s SMTP or a transactional provider) and place a test order.
- Force HTTPS (host panel or Really Simple SSL pattern); the search-replace
  above already rewrote `http://` URLs.
- Schedule daily database dumps + weekly `uploads/` snapshots. Keep at least
  one off-server copy.

## 7. Never do this on production

- Never `taskkill /F mysqld.exe` (or `kill -9` the database): always stop it
  cleanly. An unclean stop corrupts InnoDB and the shop goes down with
  “Error establishing a database connection”.
- Never run `setup/legacy/*`.
- Never edit the parent theme or plugin files; all custom code lives in the
  child theme and the two mu-plugins.
