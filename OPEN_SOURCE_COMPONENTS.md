# Open-source component decisions

## LedgerLB UI consolidation — 2026-10-11

**Architecture:** LedgerLB is a static HTML/CSS/JavaScript ERP prototype. The host shell contains separate StockPro operations and LedgerLB accounting iframe documents, and the purchasing / settlement workspaces run inside the StockPro frame. To avoid requiring a framework migration or duplicating authentication and storage, all existing data handlers were preserved while presentation was consolidated in the local `ledgerlb-ui.css` stylesheet.

### Open-source research

| Project | Repository | License | Decision |
| --- | --- | --- | --- |
| Open Props (reviewed v1.7 series) | https://github.com/argyleink/open-props | MIT | Design-token architecture reference; no code copied and no runtime dependency. |
| Pico CSS (v2.1.1) | https://github.com/picocss/pico | MIT | Not adopted; official project is archived and its global semantic reset would clash with StockPro's Tailwind-derived classes. |
| shadcn/ui | https://github.com/shadcn-ui/ui | MIT | Not adopted; framework-specific React/Tailwind architecture would require a large migration unrelated to the UI consolidation. |
| Lucide | https://github.com/lucide-icons/lucide | ISC, plus MIT for Feather-derived icons | General inspiration for consistent outline SVG style. Navigation SVG markup is custom and local; no library bundled and no icons imported. |

### Implemented first-party UI components

- `ledgerlb-ui.css` provides shared colors, typography, layout, forms, navigation, cards, tables, modal presentation, hover, and focus styles for the host and both embedded documents.
- Operational module headers now have explicit `ll-module-heading`, `ll-module-intro` and `ll-eyebrow` markup; Sales, Customers and Suppliers share a `ll-master-grid` structure.
- `unified-purchasing.js` and `outstanding-invoices.js` no longer inject independent runtime CSS. Their working event handlers and localStorage logic are retained.
- Original standalone StockPro and LedgerLB inline base styling remains as fallback for opening the pages outside the LedgerLB host; the embedded-theme duplication is removed.

### Compatibility / risk

- No new JavaScript package, external CSS runtime, build step or backend dependency.
- StockPro still depends on Tailwind CDN and Chart.js; existing integrations unchanged.
- All underlying data remains browser-local. No guarantees of durable atomic transactions, multi-user accounting integrity or regulatory readiness are implied.
- Visual smoke-testing is mandatory on hosted pages and mobile sizes after deployment. Restore prior commits if regressions are found.

No third-party source files or copied library component implementations are bundled by this change.
