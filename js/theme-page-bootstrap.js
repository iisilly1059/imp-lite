(function() {
    'use strict';

    let booted = false;

    function runThemeBootstrap() {
        if (booted) return;
        if (!window.ThemeEngine || typeof window.ThemeEngine.init !== 'function') return;
        if (!document.body) return;
        window.ThemeEngine.init();
        booted = true;
    }

    function onReady(cb) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', cb, { once: true });
        } else {
            cb();
        }
    }

    window.initThemePage = runThemeBootstrap;

    onReady(function() {
        if (!document.body || document.body.getAttribute('data-theme-bootstrap') === 'off') return;
        runThemeBootstrap();
    });
})();
