async function loadPresentationsIndex() {
  if (location.protocol === 'file:') {
    throw new Error(
      'This page is opened as a local file (file://). Browsers block loading JSON/PDF this way. Please use a local web server (e.g. VS Code Live Server) or open it from GitHub Pages.'
    );
  }
  const res = await fetch('presentations.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load presentations.json (${res.status})`);
  }
  const data = await res.json();
  if (!data || !data.dates) {
    throw new Error('Invalid presentations.json format');
  }
  return data;
}

function normalizeDateKey(value) {
  if (!value) return '';
  // Expect yyyy-mm-dd from <input type="date">
  return String(value).trim();
}

function resolveFileUrl(relativePath) {
  // Keep it relative to /visual/ for GitHub Pages; ensure URL encoding for spaces.
  return encodeURI(relativePath);
}

function findByCode(indexData, code) {
  const query = String(code || '').trim();
  if (!query) return null;
  for (const [dateKey, entries] of Object.entries(indexData.dates)) {
    for (const entry of entries || []) {
      if (String(entry.code || '').trim().toLowerCase() === query.toLowerCase()) {
        return { dateKey, entry };
      }
    }
  }
  return null;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === false || v === null || v === undefined) {
      // skip
    } else if (k === 'html') node.innerHTML = String(v);
    else node.setAttribute(k, String(v));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}
