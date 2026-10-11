/* LedgerLB embedded workspace structure; no business-state ownership.
 * Moves existing DOM controls into one module chrome without cloning elements
 * or replacing event handlers. Safe to run more than once.
 */
(function () {
  'use strict';
  const modules = {
    'dashboard-module': ['Overview', 'Your business at a glance', 'Overview'],
    'inventory-module': ['Inventory', 'Track stock, quantities and product values', 'Products'],
    'sales-module': ['Sales & invoices', 'Manage customer invoices and payments', 'Sales'],
    'customers-module': ['Customers', 'Customer records and sales history', 'Relationships'],
    'suppliers-module': ['Suppliers', 'Supplier records, products and purchasing activity', 'Relationships'],
    'finance-module': ['Finance', 'Cash, receivables, payables and financial summaries', 'Finance'],
    'reports-module': ['Reports', 'Operational trends and performance', 'Insights'],
    'settings-module': ['Business settings', 'Manage company preferences and data', 'Administration'],
    'accounting-module': ['Operational accounting', 'StockPro journal and reconciliation tools', 'Finance']
  };
  const masterViews = ['sales-module', 'customers-module', 'suppliers-module'];

  function enhance(root, meta) {
    if (!root || root.dataset.workspaceVersion === '3') return;
    const first = root.firstElementChild;
    const legacyHeading = first && first.matches('h2') ? first :
      first && first.matches('div.flex') ? first.querySelector(':scope > h2') : null;
    const existingTools = legacyHeading && legacyHeading !== first ?
      first.querySelector(':scope > .flex') : null;
    if (!legacyHeading && root.id !== 'dashboard-module') return;

    const header = document.createElement('header');
    header.className = 'ws-module-header';
    const heading = document.createElement('div');
    heading.className = 'ws-heading';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'ws-eyebrow';
    eyebrow.textContent = meta[2];
    const title = document.createElement('h2');
    title.className = 'ws-module-title';
    title.textContent = meta[0];
    const subtitle = document.createElement('p');
    subtitle.className = 'ws-module-subtitle';
    subtitle.textContent = meta[1];
    heading.append(eyebrow, title, subtitle);
    header.append(heading);

    if (existingTools) {
      const tools = document.createElement('div');
      tools.className = 'ws-module-actions';
      // Move, never clone: inline onclick, registered listeners, file inputs
      // and their IDs remain attached to the same elements.
      while (existingTools.firstChild) tools.append(existingTools.firstChild);
      tools.querySelectorAll('button').forEach(button => {
        const label = (button.textContent || '').trim().replace(/^[^a-zA-Z]+/, '');
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', label);
        button.dataset.wsAction = /^(New|Add|Create)\b/i.test(label) ? 'primary' : 'secondary';
      });
      header.append(tools);
    }
    root.classList.add('ws-workspace');
    root.dataset.workspaceVersion = '3';
    if (legacyHeading && first === legacyHeading) first.replaceWith(header);
    else if (legacyHeading && first) first.replaceWith(header);
    else root.prepend(header);

    if (masterViews.includes(root.id)) {
      const grid = root.querySelector(':scope > .grid');
      if (grid && grid.children.length >= 2) {
        grid.classList.add('ws-master-layout');
        const a = grid.children[0], b = grid.children[1];
        a.classList.add('ws-master-column');
        b.classList.add('ws-detail-column');
        a.querySelector('.card')?.classList.add('ws-master-card');
        b.querySelector('.card')?.classList.add('ws-detail-card');
      }
    }
  }

  function init() {
    if (!document.body.classList.contains('sp2-embedded')) return;
    Object.keys(modules).forEach(id => enhance(document.getElementById(id), modules[id]));
    document.body.classList.add('ws-v3-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.LedgerLBWorkspaceUI = { refresh: init };
})();