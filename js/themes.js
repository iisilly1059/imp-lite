(function() {
    'use strict';

    const VALID_THEMES = new Set([
        'dark','light','matrix','blood','sunset','forest',
        'cyberpunk','midnight','purplehaze','coffee','ocean',
        'aurora','ember','graphite','sakura'
    ]);

    const VALID_NAVBAR = new Set(['bottom','top','left','right']);
    const SYNC_KEYS = new Set([
        'selectedTheme',
        'bgImage',
        'navbarPosition',
        'cloakTitle',
        'cloakFavicon',
        'performanceMode'
    ]);
    const THEME_SYNC_EVENT = 'imp:theme-sync';
    const THEME_SYNC_CHANNEL = 'imp-theme-sync';

    let body = null;
    let engineInitialized = false;
    let syncHandlersBound = false;
    let syncChannel = null;

    const storage = {
        get(key, def) {
            try {
                const v = localStorage.getItem(key);
                return v !== null ? v : (def === undefined ? null : def);
            } catch { return def === undefined ? null : def; }
        },
        set(key, value) {
            try {
                const next = String(value);
                const prev = localStorage.getItem(key);
                localStorage.setItem(key, next);
                if (SYNC_KEYS.has(key) && prev !== next) {
                    emitSyncUpdate(key, next);
                }
            } catch {}
        }
    };

    function emitSyncUpdate(key, value) {
        if (!SYNC_KEYS.has(key)) return;
        const detail = { key, value };
        window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail }));
        if (syncChannel) {
            try { syncChannel.postMessage(detail); } catch {}
        }
    }

    function applyExternalSetting(key, incomingValue) {
        if (!key || !SYNC_KEYS.has(key)) return;
        switch (key) {
            case 'selectedTheme':
                applyTheme(incomingValue || storage.get('selectedTheme', 'dark'), { persist: false });
                break;
            case 'bgImage':
                applyBackgroundImage();
                break;
            case 'navbarPosition':
                applyNavbarPosition(incomingValue || storage.get('navbarPosition', 'bottom'), { persist: false });
                break;
            case 'cloakTitle':
            case 'cloakFavicon':
                applyCloaking();
                break;
            case 'performanceMode':
                applyPerformanceMode(parseInt(incomingValue || '0'));
                break;
        }
    }

    function bindSyncHandlers() {
        if (syncHandlersBound) return;
        syncHandlersBound = true;

        window.addEventListener('storage', function(ev) {
            if (!ev || !SYNC_KEYS.has(ev.key)) return;
            applyExternalSetting(ev.key, ev.newValue);
        });

        window.addEventListener(THEME_SYNC_EVENT, function(ev) {
            const detail = ev && ev.detail;
            if (!detail || !SYNC_KEYS.has(detail.key)) return;
            applyExternalSetting(detail.key, detail.value);
        });

        if (window.BroadcastChannel) {
            try {
                syncChannel = new BroadcastChannel(THEME_SYNC_CHANNEL);
                syncChannel.addEventListener('message', function(ev) {
                    const data = ev && ev.data;
                    if (!data || !SYNC_KEYS.has(data.key)) return;
                    applyExternalSetting(data.key, data.value);
                });
            } catch {
                syncChannel = null;
            }
        }
    }

    function applyPerformanceMode(mode) {
        const safe = (mode === 0 || mode === 1 || mode === 2) ? mode : 0;
        document.documentElement.setAttribute('data-perf', safe);
    }

    function applyTheme(theme, options) {
        if (!body) return;
        const safe = VALID_THEMES.has(theme) ? theme : 'dark';
        body.setAttribute('data-theme', safe);
        document.documentElement.setAttribute('data-theme', safe);
        if (!options || options.persist !== false) {
            storage.set('selectedTheme', safe);
        }
    }

    function applyBackgroundImage() {
        if (!body) return;
        const bg = storage.get('bgImage');
        const s = body.style;
        if (bg) {
            s.backgroundImage = 'url(' + bg + ')';
            s.backgroundSize = 'cover';
            s.backgroundPosition = 'center';
            s.backgroundAttachment = 'fixed';
            s.backgroundRepeat = 'no-repeat';
        } else {
            s.backgroundImage = '';
            s.backgroundSize = '';
            s.backgroundPosition = '';
            s.backgroundAttachment = '';
            s.backgroundRepeat = '';
        }
    }

    function applyNavbarPosition(pos, options) {
        if (!body) return;
        const valid = VALID_NAVBAR.has(pos) ? pos : 'bottom';
        body.setAttribute('data-navbar', valid);
        if (!options || options.persist !== false) {
            storage.set('navbarPosition', valid);
        }
    }

    function applyCloaking() {
        const title = storage.get('cloakTitle');
        if (title) document.title = title;
        const icon = storage.get('cloakFavicon');
        if (icon) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = icon;
        }
    }

    function loadThemeSettings() {
        applyTheme(storage.get('selectedTheme', 'dark'));
        applyBackgroundImage();
        applyNavbarPosition(storage.get('navbarPosition', 'bottom'));
        applyCloaking();
        applyPerformanceMode(parseInt(storage.get('performanceMode', '0')));
    }

    function initThemeEngine() {
        if (engineInitialized) return;
        engineInitialized = true;
        body = document.body;
        loadThemeSettings();
        bindSyncHandlers();
    }

    function getThemeList() {
        return Array.from(VALID_THEMES);
    }

    function getCurrentTheme() {
        if (!body) return 'dark';
        return body.getAttribute('data-theme') || 'dark';
    }

    window.ThemeEngine = {
        init: initThemeEngine,
        applyTheme,
        applyBackgroundImage,
        applyNavbarPosition,
        applyCloaking,
        applyPerformanceMode,
        getThemeList,
        getCurrentTheme,
        storage
    };

    window._applyTheme = applyTheme;
    window._applyNavbarPosition = applyNavbarPosition;
    window._applyBackgroundImage = applyBackgroundImage;
})();
