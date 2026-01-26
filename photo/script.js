/* Photography portfolio: gallery + filters + lightbox */

const state = {
  data: null,
  activeTag: 'All',
  query: '',
  activeIndex: -1
};

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeTag(tag) {
  return String(tag || '').trim();
}

function itemMatches(item) {
  const q = state.query.trim().toLowerCase();
  const matchesTag =
    state.activeTag === 'All' ||
    (Array.isArray(item.tags) && item.tags.map(normalizeTag).includes(state.activeTag));

  if (!matchesTag) return false;
  if (!q) return true;

  const haystack = [
    item.title,
    item.description,
    item.location,
    Array.isArray(item.tags) ? item.tags.join(' ') : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

function buildTagList(data) {
  const provided = Array.isArray(data.collections) ? data.collections : [];
  const fromItems = new Set(['All']);

  for (const item of data.items || []) {
    for (const tag of item.tags || []) {
      const t = normalizeTag(tag);
      if (t) fromItems.add(t);
    }
  }

  const merged = new Set(['All']);
  for (const t of provided) merged.add(normalizeTag(t));
  for (const t of fromItems) merged.add(normalizeTag(t));

  return Array.from(merged).filter(Boolean);
}

function ratioClass(item) {
  if (item.featured) return 'card card--wide';
  const ratio = (item.ratio || '').toLowerCase();
  if (ratio === 'tall') return 'card card--tall';
  if (ratio === 'wide') return 'card card--wide';
  return 'card';
}

function renderChips(tags) {
  const chips = $('#chips');
  chips.innerHTML = '';

  for (const tag of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = tag;
    btn.setAttribute('aria-pressed', String(tag === state.activeTag));

    btn.addEventListener('click', () => {
      state.activeTag = tag;
      for (const el of $all('.chip', chips)) {
        el.setAttribute('aria-pressed', String(el.textContent === tag));
      }
      renderGallery();
    });

    chips.appendChild(btn);
  }
}

function renderGallery() {
  const grid = $('#grid');
  const empty = $('#empty');
  const results = (state.data.items || []).filter(itemMatches);

  grid.innerHTML = '';

  if (!results.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  results.forEach((item, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = ratioClass(item);
    card.setAttribute('data-index', String(idx));
    card.setAttribute('aria-label', `Open photo: ${item.title || 'Untitled'}`);

    const tags = (item.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const meta = [item.location, item.date].filter(Boolean).join(' • ');

    card.innerHTML = `
      <img loading="lazy" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.title || 'Photo')}" />
      <div class="card__overlay">
        <p class="card__title">${escapeHtml(item.title || 'Untitled')}</p>
        <p class="card__meta">${escapeHtml(meta)}</p>
        <div class="tagline">${tags}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      const filtered = results;
      const originalIndex = idx;
      openLightbox(filtered, originalIndex);
    });

    grid.appendChild(card);
  });
}

function openLightbox(items, startIndex) {
  state._lightboxItems = items;
  state.activeIndex = startIndex;

  const lb = $('#lightbox');
  lb.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';

  updateLightbox();
  $('#lbClose').focus();
}

function closeLightbox() {
  const lb = $('#lightbox');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.activeIndex = -1;
  state._lightboxItems = null;
}

function clampIndex(i) {
  const items = state._lightboxItems || [];
  if (!items.length) return 0;
  if (i < 0) return items.length - 1;
  if (i >= items.length) return 0;
  return i;
}

function updateLightbox() {
  const items = state._lightboxItems || [];
  if (!items.length) return;

  state.activeIndex = clampIndex(state.activeIndex);
  const item = items[state.activeIndex];

  $('#lbImg').src = item.src;
  $('#lbImg').alt = item.alt || item.title || 'Photo';
  $('#lbTitle').textContent = item.title || 'Untitled';
  $('#lbDesc').textContent = item.description || '';

  $('#lbLocation').textContent = item.location || '—';
  $('#lbDate').textContent = item.date || '—';
  $('#lbTags').textContent = (item.tags || []).join(', ') || '—';

  const openOriginal = $('#lbOpen');
  openOriginal.href = item.src;

  const counter = $('#lbCounter');
  counter.textContent = `${state.activeIndex + 1} / ${items.length}`;
}

function step(delta) {
  state.activeIndex = clampIndex(state.activeIndex + delta);
  updateLightbox();
}

async function init() {
  const res = await fetch('./gallery.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load gallery.json');

  state.data = await res.json();

  const profile = state.data.profile || {};
  $('#pageTitle').textContent = profile.title || 'Photography Portfolio';
  $('#brandName').textContent = profile.name || 'My Portfolio';
  $('#heroName').textContent = profile.name || 'Photographer';
  $('#heroLocation').textContent = profile.location || '';

  const insta = $('#instagramLink');
  insta.href = profile.instagram || '#';
  insta.setAttribute('aria-disabled', String(!profile.instagram));

  const email = $('#emailLink');
  email.href = profile.email ? `mailto:${profile.email}` : '#';
  email.textContent = profile.email || 'your@email.com';

  const siteLink = $('#siteLink');
  siteLink.href = profile.website || '../site/';

  const tags = buildTagList(state.data);
  renderChips(tags);

  const search = $('#searchInput');
  search.addEventListener('input', () => {
    state.query = search.value;
    renderGallery();
  });

  // Hero preview uses first item
  const first = (state.data.items || [])[0];
  if (first) {
    $('#previewImg').src = first.src;
    $('#previewImg').alt = first.alt || first.title || 'Preview';
    $('#previewLabel').textContent = first.title || 'Featured';
  }

  // Lightbox controls
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', () => step(-1));
  $('#lbNext').addEventListener('click', () => step(1));

  $('#lightbox').addEventListener('click', (e) => {
    if (e.target === $('#lightbox')) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    const lbOpen = $('#lightbox').getAttribute('aria-hidden') === 'false';
    if (!lbOpen) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  renderGallery();

  // Smooth anchor scroll
  for (const a of $all('a[href^="#"]')) {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id ? $(id) : null;
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

init().catch((err) => {
  console.error(err);
  $('#empty').hidden = false;
  $('#empty').innerHTML = `
    <strong>Gallery failed to load.</strong>
    <div style="margin-top:8px">Check that <code>photo/gallery.json</code> exists and paths are correct.</div>
  `;
});
