// Shared sidebar loader for all pages
// Injects sidebar.html and wires open/close + active link highlight.

(function () {
  function normalizePath(pathname) {
    const p = String(pathname || '').split('?')[0].split('#')[0];
    if (!p || p === '/') return 'index.html';
    const last = p.split('/').filter(Boolean).pop();
    return last || 'index.html';
  }

  function markActive(container) {
    const current = normalizePath(window.location.pathname);
    const links = container.querySelectorAll('a[data-sidebar-link]');
    links.forEach((a) => {
      a.classList.remove('border-neonBlue');
      a.classList.add('border-slate-700/70');
      const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
      if (href === current) {
        a.classList.add('border-neonBlue');
        a.classList.remove('border-slate-700/70');
      }
    });
  }

  function wireToggle(container) {
    const sidebar = container.querySelector('#sidebar');
    const openBtn = container.querySelector('#sidebar-open');
    const closeBtn = container.querySelector('#sidebar-close');
    if (!sidebar || !openBtn || !closeBtn) return;

    function openSidebar() {
      sidebar.classList.add('open');
      openBtn.style.display = 'none';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      openBtn.style.display = '';
    }

    openBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    // Open by default on desktop
    if (window.innerWidth >= 769) {
      openSidebar();
    }
  }

  async function inject() {
    try {
      const res = await fetch('sidebar.html', { cache: 'no-store' });
      if (!res.ok) return;
      const html = await res.text();
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;

      // Insert early so it overlays everything consistently.
      const fragment = document.createDocumentFragment();
      while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
      document.body.insertBefore(fragment, document.body.firstChild);

      const container = document.body;
      markActive(container);
      wireToggle(container);
    } catch (e) {
      // best-effort
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
