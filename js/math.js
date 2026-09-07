(function () {
  'use strict';
  const CONTAINER   = '#math';
  const TIMEOUT_MS  = 8_000;
  const DEBOUNCE_MS = 30;

  const INIT_OPTIONS = {
    container:    CONTAINER,
    theme:        'dark',
    columns:      8,
    rows:         12,
    gamesPerPage: 96,
  };

  function pollUntil(test, label) {
    const immediate = test();
    if (immediate) return Promise.resolve(immediate);

    return new Promise((resolve, reject) => {
      const deadline = performance.now() + TIMEOUT_MS;

      (function frame() {
        const value = test();
        if (value) {
          resolve(value);
        } else if (performance.now() > deadline) {
          reject(new Error('[math] Timed out waiting for: ' + label));
        } else {
          requestAnimationFrame(frame);
        }
      })();
    });
  }

  const luminReady = () =>
    pollUntil(() => window.Lumin, 'Lumin SDK (is the CDN script reachable?)');

  const shadowReady = (host) =>
    pollUntil(() => host.shadowRoot, 'shadow root on ' + CONTAINER);

  let styleEl      = null;
  let debounceTimer = null;

  function cssVar(name, fallback) {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || fallback
    );
  }

  function buildCSS() {
    const bg    = cssVar('--color-secondary-bg',  '#161616');
    const hover = cssVar('--color-surface-hover', '#252525');
    const b0    = cssVar('--border-subtle',        'rgba(255,255,255,.08)');
    const b1    = cssVar('--border-default',       'rgba(255,255,255,.12)');
    const fg    = cssVar('--color-text',           '#ffffff');
    const muted = cssVar('--color-text-muted',     '#9ca3af');
    const card  = cssVar('--color-surface',        '#181818');
    return [
      `.lumin-search{width:100%;background:${bg}!important;color:${fg}!important;border:1px solid ${b0}!important;outline:none!important;box-shadow:none!important}`,
      `.lumin-search:focus,.lumin-search:focus-visible{border-color:${b1}!important;background:${hover}!important;outline:none!important;box-shadow:none!important}`,
      `.lumin-search::placeholder{color:${muted}!important}`,
      `.lumin-btn,.lumin-cat,.lumin-page-btn{background:${bg}!important;border:1px solid ${b0}!important;border-top-color:${b1}!important;border-radius:10px!important;padding:.5rem 1rem!important;font-weight:500!important;font-size:.85rem!important;color:${muted}!important;transition:background-color .2s,border-color .2s,color .2s!important;box-shadow:0 2px 8px rgba(0,0,0,.2)!important;display:flex!important;align-items:center!important;gap:.5rem!important;cursor:pointer!important;white-space:nowrap!important;flex-shrink:0!important}`,
      `.lumin-btn:hover,.lumin-cat:hover,.lumin-page-btn:hover,.lumin-cat.active,.lumin-page-btn.active{background:${hover}!important;color:${fg}!important}`,
      `.lumin-card{background:${card}!important;border:1px solid ${b0}!important;border-top-color:${b1}!important;border-radius:12px!important;transition:.2s}`,
      `.lumin-card:hover{transform:translateY(-3px);border-color:${b1}!important;box-shadow:0 10px 30px rgba(0,0,0,.35)!important}`,
      `.lumin-card-overlay{background:linear-gradient(to top,rgba(0,0,0,.85),transparent)!important}`,
    ].join('');
  }

  function applyTheme(shadow) {
    if (!styleEl || !shadow.contains(styleEl)) {
      styleEl = document.createElement('style');
      styleEl.id = 'lumin-imp-theme';
      shadow.prepend(styleEl);
    }
    styleEl.textContent = buildCSS();
  }

  function scheduleTheme(shadow) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyTheme(shadow), DEBOUNCE_MS);
  }

  async function boot() {
    let lumin;
    try {
      lumin = await luminReady();
    } catch (err) {
      console.warn(err.message);
      console.warn('[math] Hint: check that the CDN URL resolves and is not blocked by an adblocker or network policy. Also: @latest bypasses JSDelivr cache — pin to a specific version for reliable loads.');
      return;
    }

    lumin.init(INIT_OPTIONS);

    const host = document.querySelector(CONTAINER);
    if (!host) {
      console.warn('[math] Container not found:', CONTAINER);
      return;
    }

    let shadow;
    try {
      shadow = await shadowReady(host);
    } catch (err) {
      console.warn(err.message);
      return;
    }

    applyTheme(shadow);

    const refresh = () => scheduleTheme(shadow);
    window.addEventListener('imp:theme-sync', refresh);
    window.addEventListener('storage', (e) => {
      if (e.key === 'selectedTheme') refresh();
    });

    window.addEventListener('pagehide', () => {
      clearTimeout(debounceTimer);
    }, { once: true });
  }
  boot();

})();
