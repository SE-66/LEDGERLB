# LEDGERLB

Lebanon-first accountant review workspace with an integrated StockPro operational layer.

## Run locally
Open `index.html` in a browser alongside `ledgerlb.html` and `stockpro.html`.

## Deployment — Cloudflare Pages
Connect only the new GitHub repository **SE-66/LEDGERLB** to Cloudflare Pages:
- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0` (or leave blank)
- Build output directory: `/` (repository root)
- Root directory: repository root

Cloudflare Pages will deploy the static HTML site and redeploy on pushes to `main`. Do not enable GitHub Pages for this project.

## Prototype warning
This is not production accounting software. Use fictional data only. It currently lacks secure server-side authentication and a centralized accounting database. Currency/tax rules and reporting must be independently validated before production use.
